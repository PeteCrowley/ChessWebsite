from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework import generics
from .models import Game
from .serializers import CreateGameSerializer, FetchGameSerializer
from chess import engine, Board
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth import logout as django_logout
from django.contrib.auth import login as django_login
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token

# Create your views here
def index(request):
    return HttpResponse("Hello this is the main page")

class GameListView(generics.ListAPIView):
    queryset = Game.objects.all()
    serializer_class = FetchGameSerializer

class GameAddView(generics.CreateAPIView):
    queryset = Game.objects.all()
    serializer_class = CreateGameSerializer

class GameDetailView(generics.RetrieveAPIView):
    """Retrieve a single Game by its UUID `id` field."""
    queryset = Game.objects.all()
    serializer_class = FetchGameSerializer
    lookup_field = "id"

class GetEngineMoveView(generics.GenericAPIView):
    def post(self, request):
        """Given a FEN string, return the engine's best move."""
        fen = request.data.get("fen")
        if not fen:
            return JsonResponse({
                "status": "error",
                "error": "missing_fen",
                "message": "FEN string is required",
                }, status=400)
        board = Board(fen)
        if not board.is_valid():
            return JsonResponse({
                "status": "error",
                "error": "invalid_fen",
                "message": "Invalid FEN string",
                }, status=400)
        
        if "limit" in request.data:
            time_limit = request.data.get("limit")
        else:
            time_limit = 0.1  # default time limit
        
        eg = engine.SimpleEngine.popen_uci("api/stockfish/stockfish-macos-m1-apple-silicon")
        result = eg.play(board, engine.Limit(time_limit))
        eg.quit()

        if not result.move:
            return JsonResponse({
                "status": "error",
                "error": "no_move",
                "message": "Engine could not find a move",
                }, status=500)
        
        move = result.move.uci()
        print("Engine suggests move:", move)
        return JsonResponse({
            "status": "ok",
            "move": move,
        }, status=200)

class RegisterView(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return JsonResponse({'error': 'Username and password are required.'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists.'}, status=400)
        user = User.objects.create_user(username=username, password=password)
        return JsonResponse({'message': 'User registered successfully.'}, status=201)
    

class LoginView(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return JsonResponse({'error': 'Username and password are required.'}, status=400)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # create session
            django_login(request, user)
            return JsonResponse({'message': 'Login successful.'}, status=200)
        else:
            return JsonResponse({'error': 'Invalid credentials.'}, status=400)
        
class CurrentUserView(generics.GenericAPIView):
    def get(self, request):
        if request.user.is_authenticated:
            return JsonResponse({'username': request.user.username}, status=200)
        else:
            return JsonResponse({'error': 'User not authenticated.'}, status=401)


class LogoutView(generics.GenericAPIView):
    def post(self, request):
        django_logout(request)
        return JsonResponse({'message': 'Logged out'}, status=200)

@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({'status': 'ok', 'token': token})
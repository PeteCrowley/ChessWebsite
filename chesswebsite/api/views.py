from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import generics
from .models import Game
from .serializers import CreateGameSerializer, FetchGameSerializer

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
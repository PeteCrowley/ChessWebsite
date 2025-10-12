from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("games/", views.GameListView.as_view(), name="game-list"),
    path("games/<uuid:id>/", views.GameDetailView.as_view(), name="game-fetch"),
    path("games/add/", views.GameAddView.as_view(), name="game-add"),
    path("engine/move/", views.GetEngineMoveView.as_view(), name="engine-move"),
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path('auth/login/', views.LoginView.as_view(), name='api_token_auth'),
    path('auth/user/', views.CurrentUserView.as_view(), name='current-user'),
    path('auth/logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('auth/csrf/', views.get_csrf_token, name='get-csrf-token'),
]
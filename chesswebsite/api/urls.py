from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("games/", views.GameListView.as_view(), name="game-list"),
    path("games/<uuid:id>/", views.GameDetailView.as_view(), name="game-fetch"),
    path("games/add/", views.GameAddView.as_view(), name="game-add"),
]
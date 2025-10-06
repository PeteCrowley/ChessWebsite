from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
    path('game/<uuid:gameId>/', index),
]
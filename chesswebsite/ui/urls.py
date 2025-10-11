from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
    path('game/<uuid:gameId>/', index),
    path('play/engine/', index),
    path('play/<uuid:gameId>/', index),
    path('analysis', index)
]
from django.urls import path
from django.views.static import serve
from .views import index
from pathlib import Path

BUILD_DIR = Path(__file__).resolve().parent.parent / 'ui' / 'build'

urlpatterns = [
    path('manifest.json', lambda req: serve(req, 'manifest.json', document_root=str(BUILD_DIR))),
    path('favicon.ico', lambda req: serve(req, 'favicon.ico', document_root=str(BUILD_DIR))),
    path('logo192.png', lambda req: serve(req, 'logo192.png', document_root=str(BUILD_DIR))),
    path('logo512.png', lambda req: serve(req, 'logo512.png', document_root=str(BUILD_DIR))),
    path('robots.txt', lambda req: serve(req, 'robots.txt', document_root=str(BUILD_DIR))),

    path('', index),
    path('game/<uuid:gameId>/', index),
    path('play/engine/', index),
    path('play/<uuid:gameId>/', index),
    path('analysis/', index),
    path('login/', index),
    path('register/', index),
]
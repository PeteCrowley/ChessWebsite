from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/play/queue/$', consumers.PlayQueueConsumer.as_asgi()),
    re_path(r'ws/play/(?P<game_id>[0-9a-f-]+)/$', consumers.PlayGameConsumer.as_asgi()),
]
from rest_framework import serializers
from .models import Game

class FetchGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ('id', 'pgn',)

class CreateGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ('pgn',)

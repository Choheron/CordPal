from django.apps import AppConfig


class SpotifyapiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'spotifyapi'

    def ready(self):
      import spotifyapi.signals

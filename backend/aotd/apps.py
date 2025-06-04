from django.apps import AppConfig


class AotdConfig(AppConfig):
  default_auto_field = 'django.db.models.BigAutoField'
  name = 'aotd'

  def ready(self):
    import aotd.signals
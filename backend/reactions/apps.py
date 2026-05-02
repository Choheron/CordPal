from django.apps import AppConfig


class ReactionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reactions'

    def ready(self):
        import reactions.signals

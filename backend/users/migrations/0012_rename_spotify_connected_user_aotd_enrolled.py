# Generated by Django 5.1.4 on 2025-06-01 22:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_alter_user_options_alter_user_managers_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='spotify_connected',
            new_name='aotd_enrolled',
        ),
    ]

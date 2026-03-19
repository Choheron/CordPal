from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aotd', '0032_alter_albumtag_emoji'),
    ]

    operations = [
        migrations.AddField(
            model_name='globaltag',
            name='emoji',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aotd', '0031_albumtag_emoji'),
    ]

    operations = [
        migrations.AlterField(
            model_name='albumtag',
            name='emoji',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]

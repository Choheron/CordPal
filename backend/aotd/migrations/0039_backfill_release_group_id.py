from django.db import migrations


def backfill_release_group_id(apps, schema_editor):
    Album = apps.get_model('aotd', 'Album')
    to_update = []
    for album in Album.objects.filter(raw_data__isnull=False).only('id', 'raw_data', 'release_group_id'):
        rg_id = album.raw_data.get('release-group', {}).get('id')
        if rg_id:
            album.release_group_id = rg_id
            to_update.append(album)
    if to_update:
        Album.objects.bulk_update(to_update, ['release_group_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('aotd', '0038_add_release_group_id'),
    ]

    operations = [
        migrations.RunPython(backfill_release_group_id, migrations.RunPython.noop),
    ]

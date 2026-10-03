from django.db import migrations

# toJSON snapshot keys that held a discord id before the guid switch
SNAPSHOT_ID_KEYS = ('user_id', 'submitter_id', 'owner_id', 'submitted_by_id', 'edited_by', 'target_user')


def add_guids(node, guid_map):
    '''Add guid fields next to stored discord id fields. Additive only, so old readers keep working.'''
    if isinstance(node, list):
        for item in node:
            add_guids(item, guid_map)
        return
    if not isinstance(node, dict):
        return
    for key in list(node.keys()):
        value = node[key]
        if key.endswith('__discord_id'):
            # values() rows, e.g. "submitted_by__discord_id" gains "submitted_by"
            base = key[:-len('__discord_id')]
            if base not in node and value in guid_map:
                node[base] = guid_map[value]
        elif key == 'discord_id':
            # values() rows already carry "pk" and User.toJSON already carries "guid"
            if 'pk' not in node and 'guid' not in node and value in guid_map:
                node['guid'] = guid_map[value]
        elif key in SNAPSHOT_ID_KEYS and isinstance(value, str) and value in guid_map:
            node[key] = guid_map[value]
        else:
            add_guids(value, guid_map)


def payload_discord_ids_to_guids(apps, schema_editor):
    User = apps.get_model('users', 'User')
    guid_map = dict(User.objects.values_list('discord_id', 'guid'))
    for model_name in ('GlobalPlayback', 'UserPlayback'):
        Model = apps.get_model('playback', model_name)
        for playback in Model.objects.all():
            add_guids(playback.payload, guid_map)
            playback.save(update_fields=['payload'])


class Migration(migrations.Migration):

    dependencies = [
        ('playback', '0001_initial'),
        ('users', '0014_album_owner_action_guids'),
    ]

    operations = [
        migrations.RunPython(payload_discord_ids_to_guids, migrations.RunPython.noop),
    ]

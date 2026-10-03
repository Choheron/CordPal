from django.db import migrations

OWNER_KEYS = ('previous_owner_id', 'new_owner_id')


def remap_owner_ids(apps, lookup_field, value_field):
    User = apps.get_model('users', 'User')
    UserAction = apps.get_model('users', 'UserAction')
    id_map = dict(User.objects.values_list(lookup_field, value_field))
    to_update = []
    for action in UserAction.objects.filter(entity_type='ALBUM_OWNER').only('id', 'details'):
        details = action.details or {}
        changed = False
        for key in OWNER_KEYS:
            if details.get(key) in id_map:
                details[key] = id_map[details[key]]
                changed = True
        if changed:
            action.details = details
            to_update.append(action)
    if to_update:
        UserAction.objects.bulk_update(to_update, ['details'])


def discord_ids_to_guids(apps, schema_editor):
    remap_owner_ids(apps, 'discord_id', 'guid')


def guids_to_discord_ids(apps, schema_editor):
    remap_owner_ids(apps, 'guid', 'discord_id')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_add_last_avatar_check'),
    ]

    operations = [
        migrations.RunPython(discord_ids_to_guids, guids_to_discord_ids),
    ]

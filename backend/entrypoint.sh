#!/bin/bash

# Do required cronjob setup
# TODO: Possibly reorg this when moving to kubernetes
echo "SHELL=/bin/bash" > /etc/cron.d/my_custom_cron
echo "1 0 * * * cd /app && /usr/local/bin/python manage.py selectAlbumOfDay >> /proc/1/fd/1 2>&1" >> /etc/cron.d/my_custom_cron # Run every day at 12:01 CT
# Start cron service
service cron start

# Apply migrations
python manage.py migrate
# Continue
exec "$@"
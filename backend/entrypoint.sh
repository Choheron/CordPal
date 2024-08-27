#!/bin/bash

# Apply migrations
python manage.py migrate
# Continue
exec "$@"
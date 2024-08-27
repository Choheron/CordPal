# Apply migrations
python manage.py migrate
# Run Server
python manage.py runserver 0.0.0.0:8000 --settings=backend.settings_prod
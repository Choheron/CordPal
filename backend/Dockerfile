FROM python:3.11-alpine

WORKDIR /app 

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Delete nonprod settings file to ensure it is not accidentally used
RUN rm /app/backend/settings_dev.py

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000", "--settings=backend.settings_prod"]

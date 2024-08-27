FROM python:3.11-alpine

WORKDIR /app 

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Delete nonprod settings file to ensure it is not accidentally used
RUN rm /app/backend/settings_dev.py
# Delete nonprod DB settings
RUN rm /app/backend/.nonprod_pgpass

# Set ENV for Postgres connection
ENV PGSERVICEFILE="/app/backend/.pg_service.conf"

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]

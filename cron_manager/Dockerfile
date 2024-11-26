FROM alpine:3.6

# Run as root user
USER root

# Set Timezone
ENV TZ='America/Chicago'

# Install curl
RUN apk --no-cache add curl

# copy crontabs for root user
COPY ./crontab /etc/crontabs/root

# start crond with log level 8 in foreground, output to stderr
CMD ["crond", "-f", "-d", "8"]

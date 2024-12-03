# ==== BUILD STAGE ===================================================================
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==== RUNTIME STAGE ===================================================================
FROM node:18-alpine AS runtime

ENV NODE_ENV=production

# Install Timezone Package
RUN apk add --no-cache tzdata
# Set Timezone
ENV TZ='America/Chicago'

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build --chown=node /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000
USER node
CMD ["npm", "start"]

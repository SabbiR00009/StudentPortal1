# ─── Stage 1: build the React frontend ───
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: backend runtime (also serves the built frontend) ───
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# Bring in the compiled frontend so Express can serve it (same-origin app + API).
COPY --from=frontend /app/frontend/dist ./public
ENV STATIC_DIR=/app/backend/public

EXPOSE 3000
CMD ["node", "server.js"]

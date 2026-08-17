# ═══════════════════════════════════════════════════════════════════
# University_system — Frontend Dockerfile (React + Vite → nginx)
# Multi-stage: 1) Node builder  2) nginx production runtime
# ═══════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────
# STAGE 1 : "deps" — diňe dependency-leri gurýarys (cache layer)
#   Sebäp: package.json üýtgemedik wagty bu gatlag cache-den gelýär,
#   src kody üýtgäninde npm ci gaýtadan işlänok → build çalt bolýar.
# ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Dependency faýllaryny aýratyn göçürýäris — üýtgemese cache galýar
COPY package.json package-lock.json ./

# ci — lock faýlyndan takyk wersiýalary gurýar, "npm install"-dan has ygtybarly
RUN npm ci --frozen-lockfile


# ───────────────────────────────────────────────────────────────────
# STAGE 2 : "builder" — proýekti build edýäris
# ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build wagtynda environment variable-lar (VITE_ prefiksi bilen
# client-side koda girýär, şonuň üçin build wagtynda gerek)
ARG VITE_API_URL=http://localhost:8000
ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV} \
    VITE_API_URL=${VITE_API_URL}

# Gurulan node_modules-y deps stage-den göçürýäris
COPY --from=deps /app/node_modules ./node_modules

# Çeşme kodlaryny göçürýäris
COPY . .

# Production bundle döredýäris
RUN npm run build


# ───────────────────────────────────────────────────────────────────
# STAGE 3 : "production" — iň soňky kiçi nginx runtime image
#   Diňe /app/dist we nginx bar; Node.js, npm — hiç biri ýok.
# ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# wget — HEALTHCHECK üçin gerek (alpine-de curl ýok, wget bar)
RUN apk add --no-cache wget

# ── Howpsuzlyk: nginx non-root user bilen işlesin ────────────────
# nginx:alpine image-de "nginx" ulanyjysy eýýäm bar (UID=101),
# /var/cache/nginx we /var/run üçin hukuk berýäris
RUN chown -R nginx:nginx \
        /var/cache/nginx \
        /var/log/nginx \
        /usr/share/nginx/html \
    && chmod -R 755 /var/cache/nginx \
    # nginx.pid faýlynyň ýerini üýtgedýäris (root bolmazdan ýazmak üçin)
    && sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf

# ── nginx konfigurasiýasyny goýýarys ─────────────────────────────
# COPY bilen goşulýan custom nginx.conf (aşakda HEREDOC bilen inline)
# Inline ýazmak üçin RUN + echo ulanylýar
RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    # ── SPA routing: islendik ýol → index.html ───────────────' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '' \
    '    # ── Static asset cache (JS/CSS/media — Vite hash bilen) ──' \
    '    location ~* \.(?:js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '        access_log off;' \
    '    }' \
    '' \
    '    # ── Gzip gysyş ───────────────────────────────────────────' \
    '    gzip on;' \
    '    gzip_types text/plain text/css application/javascript application/json' \
    '               image/svg+xml application/xml;' \
    '    gzip_min_length 1024;' \
    '    gzip_vary on;' \
    '' \
    '    # ── Howpsuzlyk headers-lary ──────────────────────────────' \
    '    add_header X-Frame-Options "SAMEORIGIN"         always;' \
    '    add_header X-Content-Type-Options "nosniff"     always;' \
    '    add_header X-XSS-Protection "1; mode=block"     always;' \
    '    add_header Referrer-Policy "strict-origin-when-cross-origin" always;' \
    '' \
    '    # ── /health endpoint — Docker HEALTHCHECK üçin ──────────' \
    '    location /health {' \
    '        access_log off;' \
    '        return 200 "ok\n";' \
    '        add_header Content-Type text/plain;' \
    '    }' \
    '}' \
    > /etc/nginx/conf.d/default.conf

# Builder stage-den taýýar dist göçürýäris
COPY --from=builder /app/dist /usr/share/nginx/html

# Eýeçiligi nginx user-e berýäris
RUN chown -R nginx:nginx /usr/share/nginx/html

# Non-root user bilen işlet
USER nginx

# ── Metadata ─────────────────────────────────────────────────────
LABEL org.opencontainers.image.source="https://github.com/eliotlastdance00-art/University_system" \
      org.opencontainers.image.description="University System frontend (React + Vite → nginx)" \
      org.opencontainers.image.licenses="MIT"

EXPOSE 80

# ── Health Check ─────────────────────────────────────────────────
# /health endpoint-y barlaýar:
#   --interval  : her 30 sek barlama
#   --timeout   : 3 sek jogap bolmasa "unhealthy"
#   --start-period: ilki 15 sek başlangyç döwrü (barlanmaýar)
#   --retries   : 3 gezek şowsuz bolsa "unhealthy"
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
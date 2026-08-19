# --- University_system backend (FastAPI) — professionallaşdyrylan, multi-stage ---

# ═══════════════════════════════════════════════════════════
# STAGE 1: "builder" — diňe gurluşyk (compile) üçin ulanylýar,
# final image-e girmeýär. Şonuň üçin build-essential ýaly agyr
# gurallar iň soňky image-iň göwrümine täsir etmeýär.
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        default-libmysqlclient-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# pip-i takyk wersiýa berkidip täzeleýäris - "häzirki iň soňky"
# diýen näbelli ýagdaýa bil baglamzok.
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
# --user bilen paketleri /root/.local-a gurýarys - şeýlelik
# bilen ikinji tapgyrda diňe şol taýýar paketleri göçürip bileris,
# build-essential-yň özüni göçürmän.
RUN pip install --no-cache-dir --user -r requirements.txt


# ═══════════════════════════════════════════════════════════
# STAGE 2: "runtime" — hakykatdan iş ýerine ýetirilýän, kiçi
# we arassa final image. Kompilýator ýok, diňe gerekli zatlar.
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim AS runtime

# Işleýän wagty gerek bolan ýeke-täk sistem kitaphanasy
# (MySQL C driver) + curl (health-check üçin) + tini (PID 1 init).
RUN apt-get update && apt-get install -y --no-install-recommends \
        default-libmysqlclient-dev \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/*

# Python-a degişli professional sazlamalar:
#  - .pyc faýl döretmesin (konteýner gysga ömürli)
#  - stdout/stderr buffer edilmesin (log-lar real-time görünsin)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/appuser/.local/bin:$PATH

WORKDIR /code

# Takyk UID/GID bilen ulanyjy - Kubernetes/production gurşawlarynda
# "runAsNonRoot" ýaly howpsuzlyk syýasatlaryna laýyk gelýär.
RUN groupadd -g 1000 appuser && useradd -u 1000 -g appuser -m appuser

# builder tapgyryndan diňe taýýar Python paketlerini göçürýäris -
# gcc/make hiç haçan bu image-e girmeýär.
COPY --from=builder /root/.local /home/appuser/.local

COPY app ./app

# Eýeçiligi appuser-e geçirýäris, ýogsam ýazma/okama hukuk ýalňyşlygy bolar.
RUN chown -R appuser:appuser /code

USER appuser

# Image-e metadata goşýarys - kim ýasady, näme üçin, haýsy lisenziýa.
LABEL   org.opencontainers.image.source="https://github.com/eliotlastdance00-art/University_system" \
        org.opencontainers.image.description="University System backend API (FastAPI + MySQL)" \
        org.opencontainers.image.licenses="MIT"

EXPOSE 8000

# Docker-yň özi konteýneriň "diridigini" awtomatik barlasyn.
# docker ps-de "healthy"/"unhealthy" statusy görkezer, compose-da
# depends_on: condition: service_healthy bilen bile işleýär.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# tini - PID 1 hökmünde işleýär, uvicorn-yň özi çaga prosesleri
# dogry arassalamasa-da, "zombie" prosesleriň öňüni alýar we
# signallary (SIGTERM) dogry geçirýär.
ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
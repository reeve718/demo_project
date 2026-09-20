# Custom PostGIS image that supports linux/arm64.
#
# The official `postgis/postgis` image on Docker Hub only publishes
# `linux/amd64` variants, which breaks on ARM hosts such as the
# Raspberry Pi 5 (linux/arm64/v8). This image builds the same
# stack — Postgres 16 + PostGIS 3 — from the official `postgres`
# image, which IS published for arm64.
#
# The first init script in /docker-entrypoint-initdb.d/
# (`db/init/01-schema.sql`) already calls
# `CREATE EXTENSION IF NOT EXISTS postgis;`, so no extra bootstrap
# step is needed here.
FROM postgres:16-bookworm

# Install PostGIS 3 for Postgres 16 from Debian's official repos.
# The `ca-certificates` package keeps HTTPS apt sources happy.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        postgresql-16-postgis-3 \
        postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

#!/bin/sh
# fetch-and-deploy-main.sh
docker compose -f docker-compose.prod.yml down --rmi all && \
    git pull origin main && \
    GATEWAY_PORT=3000 docker compose -f docker-compose.prod.yml up -d;

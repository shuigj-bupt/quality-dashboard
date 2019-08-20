#!/bin/bash

SERVICE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SERVICE_DIR}"

export DOCKER_REGISTRY=127.0.0.1:5000
export REGISTRY_NAMESPACE=default
export SERVICE=$(cat info | grep name= | cut -f2 -d"=")
export SERVICE_VERSION=$(cat info | grep version= | cut -f2 -d"=")

docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml push
docker stack deploy --compose-file docker-compose-dev.yml ${SERVICE}

sleep 15

docker exec -ti $(docker ps | grep ${SERVICE} | cut -f1 -d" ") npm ci
docker exec -ti $(docker ps | grep ${SERVICE} | cut -f1 -d" ") npm run build
docker exec -ti $(docker ps | grep ${SERVICE} | cut -f1 -d" ") npm run dev
#!/bin/bash

CONTAINER_USER=node
CONTAINER_NAME=icwt_telegram_bot_1

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source ./dev.env.sh

docker-compose --project-name icwt --file ./toub.docker-compose.yml  up -d --build

docker exec -it --user=$CONTAINER_USER $CONTAINER_NAME sh
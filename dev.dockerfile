FROM node:8-alpine

RUN apk add --no-cache imagemagick git curl
RUN [ -d /usr/src/app/photos ] || mkdir -p /usr/src/app/photos

RUN npm install -g nodemon

WORKDIR /usr/src/app
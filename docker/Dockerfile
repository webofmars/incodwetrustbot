FROM node:alpine

WORKDIR /usr/src/app
ENTRYPOINT npm start
EXPOSE 3000

COPY src /usr/src/app

RUN apk add --no-cache imagemagick git

RUN [ -d /usr/src/app/photos ] || mkdir -p /usr/src/app/photos
RUN cd /usr/src/app && npm install

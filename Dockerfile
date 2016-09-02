FROM node:latest

WORKDIR /usr/src/app
ENTRYPOINT npm start
EXPOSE 3000

RUN DEBIAN_FRONTEND=non-interactive apt-get install -y -q imagemagick
COPY package.json /usr/src/app/
COPY bot.js /usr/src/app/
COPY lib /usr/src/app/lib
COPY gallery /usr/src/app/gallery
RUN [ -d /usr/src/app/gallery/albums ] || mkdir -p /usr/src/app/gallery/albums
RUN cd /usr/src/app && npm install

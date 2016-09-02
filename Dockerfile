FROM node:latest

WORKDIR /usr/src/app
ENTRYPOINT npm start
EXPOSE 3000

RUN DEBIAN_FRONTEND=non-interactive apt-get install -y -q imagemagick
COPY package.json /usr/src/app/
COPY bot.js /usr/src/app/
COPY lib /usr/src/app/lib
COPY node-gallery /usr/src/app/node-gallery
RUN [ -d /usr/src/app/photos ] || mkdir -p /usr/src/app/photos
RUN cd /usr/src/app && npm install

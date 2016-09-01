FROM node:latest
COPY * /usr/src/app/
RUN DEBIAN_FRONTEND=non-interactive apt-get install -y -q imagemagick
RUN cd /usr/src/app && npm install
RUN mkdir /usr/src/app/photos
WORKDIR /usr/src/app
ENTRYPOINT npm start
EXPOSE 3000
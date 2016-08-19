FROM node:latest
COPY * /usr/src/app/
RUN cd /usr/src/app && npm install
WORKDIR /usr/src/app
ENTRYPOINT npm start

FROM node:alpine

WORKDIR /usr/src/app
ENTRYPOINT [ "npm" ]
CMD ["start"]
EXPOSE 3000
HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1

RUN apk add --no-cache imagemagick git curl
RUN [ -d /usr/src/app/photos ] || mkdir -p /usr/src/app/photos

COPY src /usr/src/app
RUN cd /usr/src/app && npm install -g
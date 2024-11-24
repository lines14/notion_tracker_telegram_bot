FROM node:20.18.1-alpine

WORKDIR /app

RUN apk update && \
    apk upgrade

COPY . .

RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

RUN npm install

EXPOSE 2225

CMD ["node", "notionBot.js"]
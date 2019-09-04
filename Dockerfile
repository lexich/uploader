FROM node:8.16.1-alpine as build
WORKDIR /app
COPY . /app
RUN yarn
RUN npm run compile

FROM node:8.16.1-alpine
WORKDIR /app
COPY --from=build /app/lib /app/lib
COPY package.json /app
COPY yarn.lock /app
COPY views /app/views
RUN yarn install --production
CMD [ "node", "/app/lib/index.js" ]

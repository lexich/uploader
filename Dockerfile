
FROM node:8.16.1-alpine as client
WORKDIR /app
COPY packages/client /app
RUN yarn
RUN yarn build

FROM node:8.16.1-alpine as server
WORKDIR /app
RUN \
    npm i lerna -g --loglevel notice
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY packages/server ./packages/server
COPY packages/auth ./packages/auth
COPY packages/files ./packages/files
COPY lerna.json .
RUN lerna bootstrap
RUN ls -l
RUN npm run server:compile


FROM node:8.16.1-alpine
WORKDIR /app
COPY --from=server /app/node_modules ./node_modules
COPY --from=server /app/packages/server ./packages/server

COPY --from=server /app/packages/auth/lib ./packages/auth/lib
COPY --from=server /app/packages/auth/package.json ./packages/auth

COPY --from=server /app/packages/files/lib ./packages/files/lib
COPY --from=server /app/packages/files/package.json ./packages/files/package.json

COPY --from=client /app/build ./packages/server/build
COPY index.js ./
CMD [ "node", "index.js" ]

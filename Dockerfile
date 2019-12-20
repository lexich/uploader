
FROM node:8.16.1-alpine as client
WORKDIR /app
COPY packages/client /app
RUN yarn && yarn build

FROM node:8.16.1-alpine as server
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY packages/server ./packages/server
COPY packages/auth ./packages/auth
COPY packages/files ./packages/files
COPY lerna.json .
RUN npm i lerna -g --loglevel notice && yarn && lerna bootstrap && npm run server:compile


FROM node:8.16.1-alpine
WORKDIR /app
COPY --from=server /app/node_modules ./node_modules

COPY --from=server /app/packages/server/lib ./packages/server/lib
COPY --from=server /app/packages/server/views ./packages/server/views
COPY --from=server /app/packages/server/package.json ./packages/server/package.json

COPY --from=server /app/packages/auth/lib ./packages/auth/lib
COPY --from=server /app/packages/auth/package.json ./packages/auth

COPY --from=server /app/packages/files/lib ./packages/files/lib
COPY --from=server /app/packages/files/package.json ./packages/files/package.json

COPY --from=client /app/build ./packages/client/build

COPY index.js ./
CMD [ "node", "index.js" ]

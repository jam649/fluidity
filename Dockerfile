#-- BUILD
FROM node:24.14.0-alpine AS build

USER node
WORKDIR /home/node

ADD --chown=node:node ./public ./public
ADD --chown=node:node ./src ./src
ADD --chown=node:node ./index.html .
ADD --chown=node:node ./vite.config.ts .
ADD --chown=node:node ./tsconfig.json .
ADD --chown=node:node ./tsconfig.app.json .
ADD --chown=node:node ./tsconfig.node.json .
ADD --chown=node:node ./package.json .
ADD --chown=node:node ./package-lock.json .

RUN npm ci
RUN npm run build


#-- DEPLOYMENT
FROM nginx:alpine

COPY --from=build /home/node/dist /usr/share/nginx/html

RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

# Build site
FROM node:20 AS builder

RUN mkdir app
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/yarn-3.6.3.cjs .yarn/releases/yarn-3.6.3.cjs
RUN corepack enable
RUN yarn
RUN apt update
RUN apt install jekyll -y -q
RUN gem install jekyll-read-more jekyll-gist
COPY . .
RUN yarn grunt

VOLUME /app

# Run site
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/_site ./

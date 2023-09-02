# Build site
FROM node:20 as builder

RUN mkdir app
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
RUN apt update
RUN apt install jekyll -y -q
RUN gem install jekyll-read-more jekyll-gist
COPY . .
RUN npx grunt

VOLUME /app

# Run site
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/_site ./

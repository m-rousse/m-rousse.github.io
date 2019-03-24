# Build site
FROM node:11.12 as builder

RUN mkdir app
WORKDIR /app
COPY . .
RUN yarn
RUN apt update
RUN apt install jekyll -y -q
RUN gem install jekyll-read-more
RUN npx grunt

VOLUME /app

# Run site
FROM nginx:1.15-alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/_site ./
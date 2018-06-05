FROM nginx:alpine

ADD . /app
WORKDIR /app
ENV PATH="node_modules/.bin:${PATH}"

RUN apk update
RUN apk add yarn ruby ruby-dev alpine-sdk ruby-rdoc ruby-irb imagemagick python
RUN gem install jekyll
RUN gem install jekyll-gist
RUN gem install jekyll-read-more
RUN yarn
RUN grunt
RUN rm _site/Dockerfile _site/yarn*
RUN cp _site/* /usr/share/nginx/html/ -r

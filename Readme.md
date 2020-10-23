# Infos

My blog.

## To update pages

```bash
function buildBlog {
  docker build . -t blog:latest
  docker run --rm -d --name blog blog:latest
  git checkout master
  rm * -rf
  docker cp blog:'/usr/share/nginx/html/' .
  mv html/* .
  rm html -rf
  git add .
  gc -m 'Update blog '"$(date)"
  git push
  git checkout source
  docker stop blog
}
```

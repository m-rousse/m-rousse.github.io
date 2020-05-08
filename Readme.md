# Infos

My professional blog. In there should only be articles with a meaning for my professional career.

## To-Do

- Redact "About Me"
- Add sCTF Write Ups
- Add *PUBLIC* CV
- Verify that all files are mandatory
- Enable caching (server header for caching client-side)
- Redact "Projects" and add a page for each one of them
- Add musics that I love (Currently : Suits BSO (see D:/Musics/Suits_BSO))

## To update pages

```bash
docker build . -t blog:latest
docker run --rm -d --name blog blog:latest
git checkout gh-pages
rm * -rf
docker cp blog:'/usr/share/nginx/html/' .
mv html/* .
rm html -rf
git add .
gc -m 'Update blog '"$(date)"
git push
git checkout master
```

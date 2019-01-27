---
title: Docker Imageのtag listをCLIで取得する
date: '2018-12-20'
---

Docker Imageのtag listをCLIで取得するための手順。
<!-- end -->

## なぜ
Docker Hub上での目視確認が辛いため。
例えば、[PHP Docker Hub](https://hub.docker.com/_/php/)なんかは、Imageの種類が多すぎて視認性が悪いと思う。

## やること

### 例: phpのImageを探す

```bash
## 要jq
curl -s https://registry.hub.docker.com/v1/repositories/php/tags |jq '.[].name' |grep 7.1.5

## 結果
7.1.5
7.1.5-alpine
7.1.5-apache
7.1.5-cli
7.1.5-fpm
7.1.5-fpm-alpine
7.1.5-zts
7.1.5-zts-alpine
```

### jqなしで頑張るなら

```bash
curl -s https://registry.hub.docker.com/v1/repositories/php/tags | sed -e 's/[][]//g' -e 's/"//g' -e 's/ //g' | tr '}' '\n'  | awk -F: '{print $3}' |grep 7.1.5
```

### shell script化するなら

```bash
docker-tags() {
 image="$1"
 tags=`curl -s https://registry.hub.docker.com/v1/repositories/${image}/tags |jq '.[].name'`

 if [ -n "$2" ]; then
    tags=` echo "${tags}" | grep "$2" `
 fi

 echo "${tags}"
}
```

## 参考
[How to list all tags for a Docker image on a remote registry? - Stack Overflow](https://stackoverflow.com/questions/28320134/how-to-list-all-tags-for-a-docker-image-on-a-remote-registry/39454426)

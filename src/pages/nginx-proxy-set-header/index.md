---
title: Nginx proxy_set_header関連のモジュール、ヘッダ
date: '2019-02-11'
---

nginxの`proxy_set_header`関連のモジュール(`real_ip_header`)、ヘッダ(`X-Forwarded-For`、`X-Real-IP`)あたりの設定方法を記載する。
<!-- end -->

## 環境

```yaml
nginx: 1.14.1
```

構成はロードバランサーを挟んだ以下だとする。

```
client <-> ALB(SSL終端) <-> nginx <-> backend
```

## 登場人物

nginxのこの辺のパラメータ
```nginx
set_real_ip_from 0.0.0.0/0;
real_ip_header   X-Forwarded-For;

proxy_set_header X-Real-IP $remote_addr;
```

## `remote_addr`
nginxの組み込み変数。client(アクセス元)のIPアドレスを表す。  

このように、前段のIPが参照される。
```yaml
client
↓
ALB: remote_addr is client
↓
nginx: remote_addr is ALB
↓
backend: remote_addr is nginx
```

## `real_ip_header`

nginxのモジュール。`remote_addr`を書き換える。`X-Forwarded-For`は後述。

```nginx
real_ip_header   X-Forwarded-For;
```

## `X-Forwarded-For`
client(アクセス元)のIPアドレスが記載されたHTTPヘッダ。`remote_addr`とは異なり、前段がどこから転送されてきたか？の情報がのっている。ALBにアクセスがきた時点では中身は空で、ALBの仕様(機能)として`X-Forwarded-For`を付与してnginxに転送している。何のヘッダを付与するかは使用しているロードバランサーの設定次第となる。

なお今回の例だと、`X-Forwarded-For`の値は単数だが、
```yaml
client
↓
ALB: X-Forwarded-For: ""
↓
nginx: X-Forwarded-For: client
```

多段proxyの場合は、`X-Forwarded-For`は以下のよう増えていく。特定clientのIPを取得するには、`real_ip_recursive`を使用する。(今回は省略)

```yaml
client
↓
ALB: X-Forwarded-For: ""
↓
nginx: X-Forwarded-For: client
↓
nginx: X-Forwarded-For: client, nginx
```

話戻って、以下のよう設定することで`remote_addr`の値を`X-Forwarded-For`の値(clientのIPアドレス)に書き換える。

```nginx
set_real_ip_from 0.0.0.0/0;
real_ip_header   X-Forwarded-For;
```

以下は、`real_ip_header`モジュールの使用(remote_addrの書き換え)を許可するアクセス元IPアドレス範囲。前段がALBだけなら所属するVPCのアドレス帯を指定しておく。(アドレス範囲が特定できないサービスからアクセスがある場合は、`0.0.0.0/0`でALL許可する)

```nginx
set_real_ip_from 0.0.0.0/0;
```

## `X-Real-IP`
client(アクセス元)のIPアドレスが記載されたHTTPヘッダ。`X-Forwarded-For`とは異なり、proxyを経由するたびに増えはしない。

## ALBが付与しているヘッダについて
ALBは以下ヘッダを付与してproxy(nginx)に転送している。[Elastic Load Balancing](https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html)  

- X-Forwarded-For
- X-Forwarded-Prot
- X-Forwarded-Port

>Application Load Balancer と クラシックロードバランサー は [X-Forwarded-For]、[X-Forwarded-Prot]、[X-Forwarded-Port] ヘッダーをサポートします。

nginx側で変更が必要ない場合はディレクティブとして記載不要。

clientがHTTPSでアクセスした場合、付与されるヘッダは以下の通りとなる。

```yaml
X-Forwarded-For: client IP
X-Forwarded-Prot: HTTPS
X-Forwarded-Port: 443
```

## その他`X-xxx`ヘッダシリーズ
proxyを経由してきたclient(アクセス元)の何らかの情報が入ってるヘッダだと思えばOK。

## `proxy_set_header`をbackend側でどう利用するか
Railsを例に説明すると、[Rackのscheme判定とか](https://github.com/rack/rack/blob/461099b3ea7414bc765e66f2e127f5a3a5c01c41/lib/rack/request.rb#L199)、[port判定とか](https://github.com/rack/rack/blob/461099b3ea7414bc765e66f2e127f5a3a5c01c41/lib/rack/request.rb#L249)が挙げられる。

その他の例
- deviseでSNS認証(e.g. Google)を実装する場合、callback先のURLに、`HTTP_HOST`ヘッダが利用されるようなので、正しいHOSTヘッダを付与する必要がある。何もしない場合は`HTTP_HOST`がnginxのupstream名(e.g. backend)になってしまい正しくリダイレクトできない。

```nginx
proxy_set_header HOST $host
```

## まとめ

```nginx
# remote_addr書き換えを許可するアクセス元IP帯
set_real_ip_from 0.0.0.0/0;
# remote_addrをclientIPに書き換える
real_ip_header   X-Forwarded-For;

# clientIPをX-Real-IPヘッダに付与
proxy_set_header X-Real-IP $remote_addr;
```

## 情報ソース
[Nginx ポケットリファレンス](https://www.amazon.co.jp/dp/B0166O7O9S/ref=dp-kindle-redirect?_encoding=UTF8&btkr=1)

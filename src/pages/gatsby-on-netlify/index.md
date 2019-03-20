---
title: Gatsby on Netlify
date: '2018-10-27'
---

React製の静的サイトジェネレータ[Gatsby]を[Netlify]で立てるまでの手順。
<!-- end -->

## Gatsby導入

[Gatsby](https://www.gatsbyjs.org/)に沿って導入する。

1. Gatsbyのcliツールを入れる。
```bash
npm install --global gatsby-cli
```

2. Gatsbyのテーマを入れる。  
今回は[blog-starter](https://greglobinski.github.io/gatsby-starter-kit-docs/advanced-usage/)を使用。手順はリンク先に詳細にのってるため省略。

3. Gatsbyのテーマを修正する。  
`src/`以下のconfig系のファイルを自分の環境用にざっと修正する。該当するファイルはテーマによって異なるが、`src/`以下にまとまってるのは共通のはず。すっ飛ばして4の確認してもOK。

4. ローカル環境で表示確認をする。  

サーバを立てる。  
```
gatsby develop
```

[http://localhost:8000](http://localhost:8000)にアクセスして表示確認をする。  
コードを変更するとホットリロードされることも確認しておく。

以上、ここまで1hぐらい。

## Netlifyにデプロイ

無料で、カスタムドメイン・HTTPS化が利用できる[Netlify](https://www.netlify.com/)を使用することにした。いつもNetflixに空目するサイトだ。

1. Github認証でSign-in
2. `New site from Git`をポチ
3. 何のレポジトリをホスティングするか問われるので、該当するのを選ぶ
4. こんな感じで問われるがまま進めていく。確かほぼデフォルトのまま進めた
5. デフォルトだと、GitHubのmasterにmergeされた時に、自動でNetlifyにデプロイされるようになる

### Netlifyでカスタムドメインを使う
唯一嵌ったのがここ。

今回の構成は以下の通り。
```yaml
ドメイン: AWS Route53で購入済
DNS設定: Netlify製のサービスを使う
```

やることはただ1つで、ネームサーバの設定をNetlifyで指定されたものに変えるだけ。(浸透までMax24h待ちあり)  
Route53なら、`Registered domains`から`Name servers`の設定を変更する。
最初`Hosted zones`からNSレコードを変更してしまって一向にルーティングされなかったという事件あり。

### NetlifyでHTTPS化する
ドメイン設定欄に大々的に表示されてるので、1クリック一撃ズドン。迷うことなかれ。

以上、トータルで3hぐらい。DNSの待ち時間含めたら1日以上。  
お次は色々とGatsbyをカスタマイズしていく予定。

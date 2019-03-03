---
title: GatsbyにAdsenseを導入する
date: '2018-12-22'
---

GatsbyにAdsenseを導入(審査用コード)する手順。
<!-- end -->

## 事前準備

[Privacy Policyを念のため用意した。](/privacy)
Privacy Policyの書き方はググると色々出てくるが、今のところAdSenseしか利用してないので、[必須コンテンツ - AdSense ヘルプ](https://support.google.com/adsense/answer/1348695?hl=ja)に沿ってピンポイントで作成した。  

## 概要

GatsbyのPluginとして[gatsby-plugin-google-adsensee](https://github.com/callicoder/gatsby-plugin-google-adsense#readme)があったが、上手く動かなかった。(scriptタグが読み込まれない..)  
よってReact用のPluginである[react-adsense](https://github.com/hustcc/react-adsense)を使うことにした。

## 1. react-adsenseのインストール

```bash
npm install --save react-adsense

# or

yarn add react-adsense
```

## 2. Gatsby Templateの修正

Adsenseサイト上で払い出された広告タグを配置する。
記事ページにだけ配置したところ、Adsenseサイトで実施するコードチェックに失敗してしまった。
どうやらトップページを見ているようなので、暫定的にトップページにもタグを追加している。  

### Base Template

`src/html.js`

```js
import AdSense from 'react-adsense';

<head>
  <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
  // トップページには表示させないので不要だが、Adsenseサイトからコードが見つからなかったので追加
  <AdSense.Google
    // 払い出されたcaから始まるコードに置き換える
    client='xxx'
    // 広告スロットはまだ作成してないので、空欄でOK
    slot=''
  />
</head>
```

### Post Template

`src/templates/PostTemplate.js`

```js
import AdSense from 'react-adsense';

<Article>
  // 広告を表示させたい位置に配置
  <AdSense.Google
    // 払い出されたcaから始まるコードに置き換える
    client='xxx'
    // 広告スロットはまだ作成してないので、空欄でOK
    slot=''
  />
</Article>
```

## 3. 審査に通った後(追記)

3時間ほどで無事審査に通ったので、Gatsby側の修正を実施する。  

### Base Template

トップページではscriptタグだけあれば問題ないので、react-adsenseのimportを削除する。

`src/html.js`
```js
import AdSense from 'react-adsense';
```

### Post Template

Adsense上で新規広告ユニットを作成し、広告タグを生成する。  
今回は記事内広告を作ってみた。以下のよう修正してdone。
対応しているオプションは、公式[react-adsense](https://github.com/hustcc/react-adsense)参照。

`src/templates/PostTemplate.js`
```js
<AdSense.Google
  style={{ display: 'block', 'text-align': 'center' }}
  client='ca-pub-xxx'
  slot='xxx'
  format='fluid'
/>
```

---
title: Netlifyの環境変数を用いてGatsbyにAnalyticsを導入する
date: '2018-12-22'
---

Netlifyの環境変数を用いてGatsbyにAnalyticsを導入するまでの手順。

## 背景

GatsbyにGoogle Analyticsを導入する際、トラッキングIDをべた書きしたくなかった。  
Netlifyの環境変数オプションを使うことで解決する。  
なお、Analyticsのアカウント作成方法は、[アカウントを追加する - アナリティクス ヘルプ](https://support.google.com/analytics/answer/1009694?hl=ja)を参照。

## Analytics用のPluginを入れる

使ってるテーマによっては最初から導入されているが、入ってない場合は手動で入れる。  
Gatsby公式 [gatsby-plugin-google-analytics | GatsbyJS](https://www.gatsbyjs.org/packages/gatsby-plugin-google-analytics/) にも丁寧なREADMEが用意されている。

```bash
npm install --save gatsby-plugin-google-analytics
```

## gatsby-config.js修正

最低限やることはAnalyticsのトラッキングIDを記載するだけ。その他オプションは上記のREADME参照。  
トラッキングIDは環境変数から読み取りたいので、`process.env.GOOGLE_ANALYTICS_ID`とする。  

```js
{
  resolve: `gatsby-plugin-google-analytics`,
  options: {
    trackingId: process.env.GOOGLE_ANALYTICS_ID,
  },
},
```

## Netlify側の設定

本題の環境変数の設定方法。

1. [Sites | All teams](https://app.netlify.com/)から対象サイトに移動
2. Settings(ナビバー) -> Build & deploy(サイドバー) -> Build environment variablesに移動
3. 以下の通り記載する

```yaml
Key: GOOGLE_ANALYTICS_ID
Value: <AnalyticsのトラッキングID>
```

## Analytics確認

デプロイ後、Analytics上で計測できているか確認して終わり。  
リアルタイムユーザ数が増えていればOK！
![analytics](./analytics.png)

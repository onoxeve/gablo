---
title: GitHub Pages 独自ドメインをCloudFrontでSSL化
date: '2018-02-04'
---

GitHub Pageの独自ドメインを、前段にCDN(今回はCloudFront)を使ってSSL化(HTTPS化)させる手順。

## 1. Certificate Managerで証明書取得
ベースドメインとワイルドカード(サブドメイン用)の2パターン作成
```
onoxeve.com
*.onoxeve.com
```

認証方法は`メール`ではなく`DNS`にする。(以前はメールしかなくて意外と大変だった)
`Create record in Route 53`をクリックすれば、自動で認証用のCNAMEレコードを作成してくれる。

## 2. CloudFrontの設定
デフォルトから変更した設定は以下の通り。作成後、デプロイ完了まで15~20分ぐらいかかる。
デプロイ完了後、CloudFrontのドメイン(xx.cloudfront.net)にアクセスできればOK。

### Origin Settings
```
Origin Domain Name: <username>.github.io
Origin Protocol Policy: HTTPS Only
```

### Default Cache Behavior Settings
```
Compress Objects Automatically: yes
```

### Distribution Settings
```
Alternate Domain Names(CNAMEs): <YourDomainName>
SSL Certificate: Custom SSL Certificate(ACMで取得した証明書)
```

## 3. Route53の設定
CloudFrontのStatusが`Deployed`になったら、Route53のレコードを追加し、独自ドメインによるアクセスに切り替える。DNS設定が浸透するまで15分ぐらい時間がかかる。

ベースドメイン
```yaml
Name: 空白
Type: Aレコード
Alias: CloudFrontのDomainName(xxx.cloudfront.net)
```

www付きドメイン
```yaml
Name: www
Type: Aレコード
Alias: CloudFrontのDomainName(xxx.cloudfront.net)
```

## 4. アクセス確認
- `http://onoxeve.com`にアクセスして、`https://onoxeve.com`にリダイレクトされること
- `https://www.onoxeve.com`でもアクセスできること

## 5. Hugoの設定
独自ドメインによるアクセスが可能となったら、Hugo側のBaseURLを独自ドメインに変更してデプロイする。

```
baseurl = "https://onoxeve.com/"
```

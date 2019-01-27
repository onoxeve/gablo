---
title: Hugo on GitHub Pages
date: '2018-01-27'
---

MacOSにHugoをインストールして、GitHub Pagesで公開するまでの手順。

## Hugoとは
オープンソースの静的サイトジェネレーター(Go言語)。とにかくビルド(記事生成の動作)が速いとのことで採用した。他のジェネレーターとしては、GitHub製の`Jekyll`などが有名。

## GitHub Pagesとは
静的サイトのホスティングサービス(無料)
https://pages.github.com/

GitHub Pagesは大きく分けて2つのタイプがある。機能としては変わりはなく、セットアップ方法が若干異なる。

  1. User/Organization Pages  
  2. Project Pages

1の`User Pages`のほうがやることがシンプルなので、今回はこちらを使う。

  1. レポジトリを指定のフォーマット`username.github.io`で作成  
  2. masterブランチにコンテンツをpushしてサイトを公開(`https:username.github.io`のURLで公開される)

## Hugoセットアップ
以下を参考に、`Hugo`をセットアップする。

Quick Start  
https://gohugo.io/getting-started/quick-start/

Host on GitHub  
https://gohugo.io/hosting-and-deployment/hosting-on-github/


### 1.インストール
```bash
brew install hugo
```

### 2.ブランチ用意

Hugo本体のソースと、サイトに公開するコンテンツのソースを分けて管理する。

  1. Hugo本体のソースを管理するレポジトリ(ex.blog)  
  2. サイトに公開するコンテンツのソースを管理するレポジトリ(`username.github.io`)。こちらが先述したGitHub Pagesに該当。

### 3.新しいサイトを作成

```bash
# 事前に作ったHugo本体のソースを管理するレポジトリに移動
git clone <YOUR-PROJECT-URL> && cd <YOUR-PROJECT>
# 新サイトを作成
hugo new site <site-name>
# <site-name>なフォルダが生成されるので、git initしておく
cd <site-name>
git init
```

サイトのフォルダ構造はこんな感じ。
```bash
$ tree
.
├── archetypes
│   └── default.md
├── config.toml
├── content
├── data
├── layouts
├── static
└── themes

6 directories, 2 files
```

### 3.テーマを導入する

`Hugo Themes`よりお好みでチョイスする。  
https://themes.gohugo.io/

今回は`cactus-plus`を使う。  
https://themes.gohugo.io/hugo-theme-cactus-plus/

```bash
# git cloneではなく、submodule登録して管理する。
git submodule add -b master https://github.com/nodejh/hugo-theme-cactus-plus.git themes/hugo-theme-cactus-plus
# 必要なファイルをルートディレクトリにコピー
cp themes/hugo-theme-cactus-plus/exampleSite/config.toml .
cp themes/hugo-theme-cactus-plus/archetypes/* archetypes
```

### 4.記事生成 & ローカル環境でプレビュー

記事を生成し、適当に編集する。(mdで文章だけ記載すればOK。)
```bash
hugo new posts/new-my-post.md
```

ローカルサーバで起動(wオプションで、ローカルの更新がリアルタイムに反映される)
```bash
hugo server -w
```

以下にアクセスして表示確認をする。問題なければ`Ctrl+C`でサーバを落とす。
```bash
http://localhost:1313/
```

### 5.GitHub Pagesのレポジトリをsubmodule登録する

Hugoをビルドして生成される`public`フォルダ(実際に公開されるコンテンツが格納されている)は別レポジトリで管理するので、submodule登録しておく。

```bash
git submodule add -b master git@github.com:onoxeve/onoxeve.github.io.git public
```

### 6.GitHub Pagesに公開する

deploy用のスクリプトが用意されてるので、そのまま使う。やっていることは、hugoをビルドすると`public`フォルダに公開コンテンツが生成されるので、それらをGitHub Pagesのレポジトリにpushしている。実行後、`https://<USERNAME>.github.io`にアクセスして確認する。

```bash
#!/bin/bash

echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"

# Build the project.
hugo # if using a theme, replace with `hugo -t <YOURTHEME>`

# Go To Public folder
cd public
# Add changes to git.
git add .

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"

# Push source and build repos.
git push origin master

# Come Back up to the Project Root
cd ..
```

### 7.Hugo本体のソースをpushする

Hugo本体のソースもpushしておく。
```bash
git remote add origin <YOUR-PROJECT-URL>
git add .
git commit -m "first commit"
git push -u origin master
```

繰り返しになるが、Hugo本体のソースと、サイトに公開するコンテンツは別レポジトリによる管理となる。

```bash
Project Root
├── archetypes
├── content
├── data
├── layouts
├── public  #submodule(GitHub Pagesレポジトリ)
├── static
└── themes  #submodule(Themeのレポジトリ、今回はcactus-plus)
```

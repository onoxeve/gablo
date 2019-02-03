---
title: Rails5 foremanの代わりにconcurrentlyを導入する
date: '2019-02-03'
---

foremanを用いてRails サーバ & Webpackサーバを立ち上げる際(on Docker)、byebugなどのDebugger(REPL)が起動しない事象が発生したが、代わりにconcurrentlyを導入したら解決した。

<!-- end -->

## 環境

```yaml
Rails: 5.2.2
foreman: 0.64.0
concurrently: 4.1.0
```

## concurrentlyとは
[concurrently](https://github.com/kimmobrunfeldt/concurrently)とは、[foreman](https://github.com/theforeman/foreman)と同様に複数サーバ(プロセス)の起動を一括管理できるライブラリ。

## concurrentlyインストール
npm or yarnでインストールする。

```bash
yarn install concurrently --save-dev
```

## scripts登録

あとは以下のよう`package.json`の`scripts`に登録しておけば、
```js
"scripts": {
  "s": "concurrently -p '[{name}]' --handle-input -n web,webpacker -c 'black.bgGreen,black.bgCyan' 'rails s' 'bin/webpack-dev-server'"
},
```

`yarn run s`でRailsサーバ & Webpackサーバが立ち上がる。
ターミナルに表示する名称・背景色などはオプションで変更可能。

## 解決できてない問題
無事Debuggerは起動するようになったが以下問題も合わせて発生している(未解決)。
どこに原因があるのか切り分けはできていないが、Docker環境が怪しいと踏んでいる。

### 1. REPLにて、キーボードの矢印キーが効かない

上矢印キーを押した例
```ruby
[web] [1] pry(#<PostController>)> ^[[A
```
このように別キーとして認識されている模様。

### 2. hashをシンボルで参照できない

```ruby
[web][8] pry(#<PostController>)> params[:action] #シンボルはNG
Unable to find command params[, or it has no stdin open
-->
[web]
[web] [9] pry(#<PostController>)> params['action'] #文字列ならOK
params['action']
[web] => "index"
```

なお、`rails c`では問題なく動く。

## 参考
concurrentlyを知るきっかけとなったforemanのisshue  
[Cannot read echo when using byebug or debugger tool · Issue #703 · ddollar/foreman](https://github.com/ddollar/foreman/issues/703)

---
title: Rails assets:precompile Uglifierのエラー
date: '2019-01-17'
---

Rails5 + vue.jsなアプリで`assets:precompile`した時のエラー対処法を記載する
<!-- end -->

- エラー内容

```ruby
Uglifier::Error: Unexpected token: string (controllers). To use ES6 syntax, harmony mode must be enabled with Uglifier.new(:harmony => true).
```

## 原因

[公式README](https://github.com/mishoo/UglifyJS2)に大々的に記載されている通り、デフォルトではES6構文に対応していないためコンパイル時にエラーが出ている

## 対処法

`Uglifier`を以下のようオプション付きで使うようにする

- `config/environments/production.rb`

デフォルトの設定を
```ruby
config.assets.js_compressor = :uglifier
```

以下に変更する
```ruby
config.assets.js_compressor = Uglifier.new(harmony: true)
```

## (参考)Uglifierとは

[UglifyJS](https://github.com/mishoo/UglifyJS2)というJavaScriptのコード軽量化(※)ライブラリをRubyで扱えるようにするGem。  
※ 改行、空白、コメントなどが取り除かれる

[Ruby wrapper for UglifyJS JavaScript compressor.](https://github.com/lautis/uglifier)

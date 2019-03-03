---
title: Rails5 production環境ではautoloadが無効になっている
date: '2019-03-04'
---

Rails5ではautoloadが廃止されており、lib配下のファイルはeager_load対象にする必要がある。
<!-- end -->

## 背景
development環境では実行できていたlib配下のtaskが、production環境では実行できなかった。

`autoload_paths`にlibを追加していたが、
```ruby
# config/application.rb
config.autoload_paths += %W(#{config.root}/lib)
```

エラー発生
```ruby
uninitialized constant NginxTasks::refresh_cache!
```

## 原因

題名の通りで、production環境ではautoloadが無効になっているため。Rails5のデフォルト設定だと以下になっている。  
ソース: [Autoloading is Disabled After Booting in the Production Environment](https://edgeguides.rubyonrails.org/upgrading_ruby_on_rails.html#autoloading-is-disabled-after-booting-in-the-production-environment)

```yaml
development:
  autoload: 有効,
  eager_load: 無効,
production:
  autoload: 無効,
  eager_load: 有効,
```

もう少し詳しく書くと、こういうこと。   
ソース: [Autoloading and Reloading Constants — Ruby on Rails Guides](https://guides.rubyonrails.org/autoloading_and_reloading_constants.html#autoload-paths-and-eager-load-paths)

```yaml
development: ファイル実行時(コード読み込み時)にautoload_pathsにあるファイルを自動読み込み。ファイル変更時には再読み込み
production: 一貫性/スレッドセーフを保つため、起動時にeager_load_pathsにあるファイルを一括読み込み
```

## 対策

### 1. `eager_load_paths`にlibを加える

これで`autoload_paths`と`eager_load_paths`にlib配下が加わるので、`development/production`環境双方で問題なし。
```ruby
# config/application.rb
config.paths.add 'lib', eager_load: true
```

### 2. `autoload`を有効にする

[Ruby on Rails Guides](https://edgeguides.rubyonrails.org/upgrading_ruby_on_rails.html#autoloading-is-disabled-after-booting-in-the-production-environment)に記載されている通り、autoloadを有効にしてしまえば、
```ruby
# config/application.rb
config.enable_dependency_loading = true
```

この書き方でもOK
```ruby
# config/application.rb
config.autoload_paths += %W(#{config.root}/lib)
```

ただスレッドセーフの問題を引き起こす可能性があるため、推奨はされてない模様

>Not autoloading after boot is a good thing, as autoloading can cause the app to be have thread-safety problems.

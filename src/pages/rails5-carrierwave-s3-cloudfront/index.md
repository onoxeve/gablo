---
title: Rails5 Carrierwave + S3 + Cloudfrontで画像アップロード
date: '2017-07-02'
---

Carrierwave + S3 + Cloudfrontで画像アップロードを実装する手順。

## 環境

```yaml
ruby: 2.3.3
imagemagick: 6.8
rails: 5.1.1
carrierwave: 1.1.0
fog-aws: 1.3.0
rmagick: 2.16.0
```

## 概要

### Carrierwaveとは
画像アップロード用のライブラリです。

### fogとは
クラウドサービス連携用のライブラリです。AWSだけでなく、Azule, GCPなども用意されてます。  
[fog](https://github.com/fog/fog)  
>fog is the Ruby cloud services library, top to bottom:

### rmagickとは
画像処理ソフトウェアの`ImageMagick`をRubyで使えるようにするライブラリです。  
[ImageMagick](https://github.com/ImageMagick/ImageMagick  )
>ImageMagick® is a software suite to create, edit, compose, or convert bitmap images.

別途、サーバに`ImageMagick`がインストールされている必要があります。

例: `Ubuntu14.04`でのインストール

```bash
sudo apt-get update
sudo apt-get install -y imagemagick libmagick++-dev
```

## Carrierwave入門
[公式](https://github.com/carrierwaveuploader/carrierwave)に沿って、UserモデルにAvater画像をアップロードできるようにします。  

```
Getting Started
Using Amazon S3
Using RMagick
```

Gemfile

```ruby
# 画像アップロード用
gem 'carrierwave'
# AWS S3連携用
gem 'fog-aws'
# 画像処理用(例: リサイズ)
gem 'rmagick'
```

```
bundle install
```

まずは、Uploaderを作成します。

```ruby
rails generate uploader Avatar
```
以下ファイルが生成されます。

```ruby
app/uploaders/avatar_uploader.rb
```
次に、UserモデルにAvatarカラムを追加します。
(Userモデルが事前に存在する前提になっています。※)

```ruby
rails g migration add_avatar_to_users avatar:string
rails db:migrate
```

※存在しない場合は、適当にUserモデルを作成します。

```ruby
rails g model User name:string email:string password_digest:string
rails db:migrate
```

追加したAvatarカラムを、`mount_uploader`に定義します。

```ruby
class User < ActiveRecord::Base
  mount_uploader :avatar, AvatarUploader
end
```

## Carrierwave 設定カスタマイズ(サンプル)

### avatar_uploader.rb
`app/uploaders/avatar_uploader.rb`
最初から色んなサンプルが記載されており親切です。

```ruby
class ImageUploader < CarrierWave::Uploader::Base

  # 画像リサイズ用にRMagickをinclude
  include CarrierWave::RMagick

  # iPhoneから画像投稿した際に、画像の向きがおかしい場合があるので、
  # Rmagickのauto_orientメソッドで向きを正す。
  process :fix_rotate
  def fix_rotate
    manipulate! do |img|
      img = img.auto_orient
      img = yield(img) if block_given?
      img
    end
  end

  # Choose what kind of storage to use for this uploader:
  # ストレージの設定(S3アップロード用にfogを指定)
  storage :fog

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  # アップロード先のディレクトリの設定
  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  end

  # Add a white list of extensions which are allowed to be uploaded.
  # 許可するファイル拡張子の設定
  def extension_whitelist
    %w(jpg jpeg gif png)
  end

  # Override the filename of the uploaded files:
  # ファイル名の設定(以下はランダムな16進数文字列をファイル名の先頭に付与している例)
  def filename
     "#{secure_token(10)}.#{file.extension}" if original_filename.present?
  end

  protected
  def secure_token(length=16)
    var = :"@#{mounted_as}_secure_token"
    model.instance_variable_get(var) or model.instance_variable_set(var, SecureRandom.hex(length/2))
  end

  # Create different versions of your uploaded files:
  # リサイズの設定(要RMagick)
  # 1つだけではなく複数のversionを設定可能
  version :thumb do
      process resize_to_fit: [50, 50]
  end
end
```

補足

>iPhoneから画像投稿した際に、画像の向きがおかしい場合があるので、
Rmagickのauto_orientメソッドで向きを正す。

iPhoneに保存された写真は`向きの情報`を持っているが、
ブラウザによってはそれを無視して表示してしまうことが原因です。

参考: [アップロードした写真（画像）が回転して表示されるのを直す方法](http://qiita.com/hiro_y/items/0476bcf39a77ca184009)

>ファイル名の設定(以下はランダムな16進数文字列をファイル名の先頭に付与している例)

READMEには記載がないですが、公式wikiに詳細が載っています。
基本は`UUID`を用いたユニークな文字列が推薦されています。

参考: [How to: Create random and unique filenames for all versioned files](https://github.com/carrierwaveuploader/carrierwave/wiki/How-to:-Create-random-and-unique-filenames-for-all-versioned-files)

### carrierwave.rb作成
`config/initializers/carrierwave.rb`を作成します。
S3, CloudFrontの設定情報を記載します。
私の場合は、概ねの設定を`Figaro`で環境変数に設定しています。

```ruby
CarrierWave.configure do |config|
  config.fog_provider = 'fog/aws'
  config.fog_credentials = {
    provider: 'AWS',
    aws_access_key_id: ENV['fog_api_key'],        # AWSアクセスキー
    aws_secret_access_key: ENV['fog_api_secret'], # AWSシークレットキー
    region: ENV['fog_region'],                    # S3リージョン
    host: ENV['fog_host']                         # S3エンドポイント名(例: s3-us-west-2.amazonaws.com)
  }

  # キャッシュもS3に置くようにする
  config.cache_storage = :fog
  config.cache_dir = 'tmp/image-cache'

  # S3バケット名
  config.fog_directory = ENV['fog_directory']

  # CloudFrontのDomainName or CNAME(例: http://xxx.cloudfront.net)
  # CDNを使わない場合は、S3バケットの絶対パス(例: https://s3-us-west-2.amazonaws.com/<backet>)
  config.asset_host = ENV['fog_asset_host']
end
```

### `models/user.rb`
このままだと画像を削除してもS3には残ってしまうため、
`before_destroy`でS3の画像を削除します。

```ruby
class User < ActiveRecord::Base
  mount_uploader :avatar, AvatarUploader
  before_destroy :clean_s3
private
  def clean_s3
    avatar.remove!       #オリジナルの画像を削除    
    avatar.thumb.remove! #thumb画像を削除
  rescue Excon::Errors::Error => error
    puts "Something gone wrong"
    false
  end
end
```
参考: [destroy object only after mounted files have been deleted from storage](https://stackoverflow.com/questions/22391183/carrierwave-destroy-object-only-after-mounted-files-have-been-deleted-from-sto)

## view側の設定

### フォームサンプル
```erb
<%= form_for(@user) do |f| %>
  <%= f.file_field :avatar %>
  <%= f.submit 'Upload' %>
<% end %>
```
`file_field`にAvatarカラムを設定します。  

### 画像の表示(取得)方法
```erb
<%= image_tag user.avatar.thumb.url %>
```
`thumb`の部分は`version`名と合わせる必要があります。  

`app/uploaders/avatar_uploader.rb`

```ruby
  version :thumb do
      process resize_to_fit: [50, 50]
  end
```
オリジナル画像を取得する場合は、`user.avatar.url`です。

---
title: Rails5 DeviceのSNS認証後に独自のユーザ登録フォームを実装
date: '2017-07-09'
---

Devise + omniauthでFacebook認証を実装する手順。(独自のユーザ登録フォーム付き)

## 概要
Devise + omniauthでFacebook認証を実装します。

公式のサンプル通りに実装すると、Facebook認証時に取得した情報を元にユーザ登録まで自動的に実施されます。
これを、一部パラメータは独自の入力フォームで登録できるようにカスタマイズします。
本記事では`ユーザ名`を例として説明していきます。  
※その他のユースケースとしては、Facebookから取得できない情報も併せて登録させたい場合などです。

## 環境
ruby: 2.3.3
rails (5.1.1)
devise (4.3.0)
omniauth-facebook (4.0.0)

## Facebook API登録

Facebook for Developers
https://developers.facebook.com/apps/

1. Facebook for Developersに登録
1. 新しいアプリを追加
2. Facebookログインを選択
3. 有効なOAuthリダイレクトURIを設定(例: http://0.0.0.0:3000/)
4. 設定から、`アプリID`と`app secret`を控えておく

## Devise導入

公式通りに導入していきます。

Devise  
https://github.com/plataformatec/devise

`omniauth-facebook`も一緒にインストールしておきます。

```ruby
gem 'devise'
gem 'omniauth-facebook'
```

```
bundle install
```

### Devise関連ファイルのインストール

まずは、Devise関連ファイルを生成します。
`controllers`と`views`はDevise標準設定のオーバーライド用です。

```ruby
rails g devise:install
      create  config/initializers/devise.rb
      create  config/locales/devise.en.yml
```

```ruby
rails g devise:controllers users
      create  app/controllers/users/confirmations_controller.rb
      ~~~
      create  app/controllers/users/omniauth_callbacks_controller.rb
```


```ruby
rails g devise:views
      invoke  Devise::Generators::SharedViewsGenerator
      create    app/views/devise/shared
      ~~~
      create    app/views/devise/mailer/unlock_instructions.html.erb
```

### Userモデルの作成

次に、Userモデルを作成します。

```ruby
rails g devise User
      invoke  active_record
      create    db/migrate/20170708090421_devise_create_users.rb
      ~~~
       route  devise_for :users
```

```
rails db:migrate
```

デフォルトでは6つのDeviseモジュールが有効になっています。
`OmniAuth-Facebook`設定時にモジュールを追加しますので、今は飛ばします。

user.rb
```ruby
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable
end
```

## OmniAuth-Facebook設定

基本は公式サイトに沿って設定し、一部カスタマイズします。

OmniAuth  
https://github.com/plataformatec/devise/wiki/OmniAuth:-Overview

### OmniAuth基本設定

`provider`の設定を定義します。`APP_ID`と`APP_SECRET`は環境変数で設定します。

config/initializers/devise.rb
```ruby
config.omniauth :facebook, ENV['APP_ID'], ENV['APP_SECRET']
```

`OmniAuth`機能を使えるように、Userモデルにモジュール(`omniauthable`)を追加します。

user.rb
```ruby
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable
end
```

Deviseの設定を一部オーバーライドしますので、ルーティングを変更します。

routers.rb
```ruby
devise_for :users, :controllers => { :omniauth_callbacks => "users/omniauth_callbacks", :registrations => "users/registrations" }
```

### OmniAuth用のカラム追加

`OmniAuth用`のカラムを追加します。`provider`と`uid`が必須です。
今回は`ユーザ名`も別途登録したいので、`name`も追加します。

```
rails g migration add_columns_to_users provider uid name
```

```
rails db:migrate
```

### Strong Parametersの設定

独自に追加した`ユーザ名`をDeviseで認証できるように、`application_controller`に`Strong Parameters`を設定します。

application_controller.rb
```ruby
class ApplicationController < ActionController::Base
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end
end
```

### validationの設定

Userモデルで`ユーザ名`の`validation`設定をします。

例: 入力必須・15文字以内・重複不可・英数字のみ許可

user.rb
```ruby
class User < ApplicationRecord
  validates :name, presence: true, length: { maximum: 15 }, uniqueness: { case_sensitive: false }, format: { with: /\A[a-z0-9]+\z/i, message: "is must NOT contain any other characters than alphanumerics." }
end
```

### CallbacksControllerの設定

Facebook認証後、ユーザ名登録フォームにリダイレクトするように`CallbacksController`をカスタマイズします。
Before/Afterの概要は以下の通りです。

#### Before(デフォルト)

1. `provider`と`uid`の情報を元に登録済ユーザか判定
2. 未登録(新規ユーザ)なら、`from_omniauth`で定義している内容でDB登録してからSign in
3. 登録済(既存ユーザ)なら、Sign in

#### After(カスタマイズ後)

1. `provider`と`uid`の情報を元に登録済ユーザか判定
2. 未登録(新規ユーザ)なら、ユーザ名登録用のテンプレートをrender
3. 登録済(既存ユーザ)なら、Sign in

app/controllers/users/omniauth_callbacks_controller.rb
```ruby
class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def facebook
    # You need to implement the method below in your model (e.g. app/models/user.rb)
    #@user = User.from_omniauth(request.env["omniauth.auth"])

    # ユーザ登録まで自動的に実施せず、ユーザ検索のみ実施するように変更
    # メソッドはuser.rb側で定義します。
    @user = User.find_omniauth(request.env["omniauth.auth"])

    #if @user.persisted?
    # 新規ユーザの場合、この時点ではDBレコードが存在しないので以下に変更
    if @user
      sign_in_and_redirect @user #this will throw if @user is not activated
      set_flash_message(:notice, :success, :kind => "Facebook") if is_navigational_format?
    else
      # Facebookから取得した情報をsessionに格納
      session["devise.facebook_data"] = request.env["omniauth.auth"]
      #redirect_to new_user_registration_url

      # 新規ユーザの場合、`ユーザ名`登録用のテンプレートをrender
      @user = User.new()
      render 'devise/registrations/after_omniauth_signup'
    end
  end

  def failure
    redirect_to root_path
  end
end
```

app/models/user.rb
```ruby
class User < ApplicationRecord
  # 公式のサンプル(今回は使用しません)
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0,20]
      user.name = auth.info.name   # assuming the user model has a name
      user.image = auth.info.image # assuming the user model has an image
      # If you are using confirmable and the provider(s) you use validate emails,
      # uncomment the line below to skip the confirmation emails.
      # user.skip_confirmation!
    end
  end

  # 今回使用するメソッド
  def self.find_omniauth(auth)
    User.where(provider: auth.provider, uid: auth.uid).first
  end
end
```
### new_with_sessionメソッドの設定

Facebook認証後にリダイレクトする登録フォームからは`ユーザ名`のみをPOSTするようにします。  
認証時にFacebookから取得した情報(`session["devise.facebook_data"]`)は、`new_with_session`メソッドで取得します。
`new_with_session`メソッドはリソースをビルドする前に自動的に呼ばれるメソッドです。  

処理の流れ(簡易版)は以下の通りです。

1. Facebook認証
2. ユーザ名登録フォームにリダイレクト & ユーザ名をPOST
3. `new_with_session`メソッドが呼ばれ、`email`等のFacebookから取得した情報を取得
4. 2 + 3のデータを元にユーザ登録

app/models/user.rb
```ruby
class User < ApplicationRecord
  def self.new_with_session(params, session)
    super.tap do |user|
      if data = session["devise.facebook_data"] && session["devise.facebook_data"]["extra"]["raw_info"]
        user.email = data["email"] if user.email.blank?
      end
      if data = session["devise.facebook_data"]
        user.provider = data["provider"] if user.provider.blank?
        user.uid = data["uid"] if user.uid.blank?
        user.password = Devise.friendly_token[0,20] if user.password.blank?
      end
    end
  end
end
```

### viewの設定(サンプル)

#### ユーザ名の登録フォーム

`app/views/devise/registrations`配下に作成します。
フォームのPOST先はDeviseで通常認証する際と同様です。(e.g. registrations/new.html.erb)

```erb
<%= form_for(resource, as: resource_name, url: registration_path(resource_name)) do |f| %>
```

#### Sign in / Log in / Log out

通常Sign in / Log in

```erb
<%= link_to 'Log in', new_user_session_path %>
<%= link_to 'Sign up', new_user_registration_path %>
```

Facebook Sign in / Log in

```erb
<%= link_to 'Sign up with Facebook', user_facebook_omniauth_authorize_path %>
```

Log out

```erb
<%= link_to 'Log out', destroy_user_session_path, method: :delete %>
```

## Devise参考リンク

RailsのDevise認証機能での実装チェックリストまとめ
http://easyramble.com/check-list-for-rails-devise.html

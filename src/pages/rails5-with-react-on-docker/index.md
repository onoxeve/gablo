---
title: Rails5.1 Webpacker + React on Docker
date: '2018-02-10'
---

Rails5.1 + Webpacker + Reactな開発環境をDockerで作る際の手順。

## 0. 実施環境
- maxOS: High Sierra Version 10.13.3
- Docker: Version 17.12.0-ce-mac49 (21995)

## 1. ファイル準備
適当なディレクトリを作成し、4つのファイルを準備する。  
概ね公式通りにやっている。  
https://docs.docker.com/compose/rails/

### docker-compose.yml

```
version: '3'
services:
  db:
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: mysql
  web:
    build: .
    command: bundle exec rails s -p 3000 -b '0.0.0.0'
    volumes:
      - .:/reactapp
    ports:
      - "3000:3000"
    depends_on:
      - db
    tty: true
    stdin_open: true
```

### Dockerfile
`Webpacker`を利用するため、`nodejs`と`yarn`を追加。

```
FROM ruby:2.4.1
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash
RUN apt-get install -y nodejs
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install yarn
RUN mkdir /reactapp
WORKDIR /reactapp
ADD Gemfile /reactapp/Gemfile
ADD Gemfile.lock /reactapp/Gemfile.lock
RUN bundle install
ADD . /reactapp
```

### Gemfile
`rails`だけでOK。後で`rail new`する際に上書きされる。

```
source 'https://rubygems.org'
gem 'rails', '5.1.4'
```

### Gemfile.lock
空ファイルでOK。

## 2. ビルド
`--webpack=react`をつけて`rails new`することで、`webpacker`及び、`react関連module`のインストールまでやってくれる。

```
cd <project-folder>
docker-compose run web rails new . --webpack=react
```

※参考: `webpacker`、`react関連module`の単体インストール

- webpackerの単体インストール

`Gemfile`に追加
```
gem 'webpacker', '~> 3.2'
```

```
docker-compose run web rails webpacker:install
```

- React関連moduleの単体インストール

```
docker-compose run web rails webpacker:install:react
```

## 2.1 現時点でのバグ対応
`webpacker`インストール時に、Railsルートディレクトリのbin配下に以下ファイルが生成されてない。よって、手動で配置する必要がある。

- webpack
- webpack-dev-server

公式のgithubからコピーして配置する。  
https://github.com/rails/webpacker/tree/master/exe

※条件は不明だが、webpacker (3.2.1)、Rails（5.1.4）で発生している。

## 3. 再ビルド
新しい`Gemfile`が生成されたので、イメージを再ビルドする。`ADD Gemfile`以降が再実行される。

```
docker-compose build
```

## 4. Rails DB configの修正
接続先を`mysql`に変更する。

`config/database.yml`
```
development:
  <<: *default
  database: reactapp_development
  host: db
  password: mysql

test:
  <<: *default
  database: reactapp_test
  host: db
  password: mysql
```

## 5. アプリ起動

```
docker-compose up
```

起動後、ブラウザから`http://0.0.0.0:3000/`にアクセス。`Yay! You’re on Rails!`が表示されればOK。

## 6. お試しカウンター機能でReact動作確認
ボタンをクリックしたらカウンターが増加していくviewを作る。

適当にコントローラーを作成
```
rails g controller top counter
```

`app/javascript/packs/counter.jsx`を作成(Reactコンポーネント)
```js
import React from 'react'
import ReactDOM from 'react-dom'

class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      counter: 0
    }
    this.increment = this.increment.bind(this)
  }
  increment() {
    this.setState(
      {
        counter: this.state.counter + 1
      }
    )
  }
  render() {
    return (
      <div>
        <div> Counter = {this.state.counter}</div >
        <button onClick = {this.increment}> Click me!</button >
      </div>
    )
  }
}
document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Counter />,
  document.getElementById('counter')
)
})
```

`views/top/counter.html.erb`を以下に書き換える。  
`javascript_pack_tag`で対象のjsファイルをincludeできる。  
```html
<div id="counter"></div>
<%= javascript_pack_tag "counter" %>
```

webpack-dev-serverを起動する(ファイル変更時に自動でコンパイルをしてくれる)  

```bash
bin/webpack-dev-server
```

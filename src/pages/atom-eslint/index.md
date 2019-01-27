---
title: Atomにeslintの導入
date: '2018-02-12'
---

Atomにeslintを導入する際の手順。
<!-- end -->

## 実施環境

```yaml
node: v9.5.0
yarn: 1.3.2
Rails: 5.1.4(webpack導入済み)
```

## パッケージインストール

```bash
cd <rails-project-root>
yarn add eslint eslint-plugin-react
```

## eslint初期設定

```bash
node_modules/.bin/eslint --init
```

以下のよう対話式で設定できる
```
? How would you like to configure ESLint?
  Answer questions about your style
❯ Use a popular style guide
  Inspect your JavaScript file(s)

? Which style guide do you want to follow?
  Google
❯ Airbnb
  Standard

? Do you use React? (y/N) y

? What format do you want your config file to be in? (Use arrow keys)
❯ JavaScript
  YAML
  JSON
```

initが完了するとプロジェクトルート以下に設定ファイルが生成される

```
Successfully created .eslintrc.js file in /reactapp
```

デフォルトの中身はこんな感じ。`airbnb`のスタイルをextendsしているだけ。

```js
module.exports = {
    "extends": "airbnb"
};
```

このままだと、documentなどでエラーを吐くので、
```
ReactDOM.render(<App />, document.querySelector('.container'));
```

以下に変更する  
```js
module.exports = {
    "extends": "airbnb",
    "env": {
      "browser": true
    }
};
```

## eslint追加手順
`node_modules/.bin/eslint --init`をした際に、`npm install`が実行され、`./node_modules/.bin`配下が消えてしまう。よって、`yarn install`で再度入れ直す必要がある。  
※`"eslint": "^4.17.0",`のバージョンで発生

```bash
yarn install
```

また、atom上で`eslint-config-airbnb`が見つからないというエラーが出たら、単体で再インストールする
```
yarn add eslint-config-airbnb
```

## Atomプラグインの設定

プラグインのインストール(数が多いのでコマンドラインで導入する)
※apmが有効になっていない場合は、メニューバーのAtom->`Install Shell Commands`からインストール

```bash
apm install es6-javascript intentions busy-signal linter-ui-default linter linter-eslint
```

インストール完了後にAtomを再起動(reloadでok)して反映させる。  
※ `Control + Option + Command + L`でreloadができるが、何かのキーに食われて利用できなかった。その場合は、コマンドパレット(Shift + Command +P)からreloadで検索すれば出てくる。

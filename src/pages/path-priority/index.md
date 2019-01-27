---
title: PATHは左側が優先されます
date: '2019-01-09'
---

command not foundとエラーが出たらPATHが通っているか確認する。これは基本中の基本だが、PATHは左側が優先されるという基本中の基本part2を忘れてたので、rubyを例に記載しておく。

## 例(前提)
OSデフォルトで導入されてるruby(`/usr/bin`)とは別に、別バージョンのruby(`/usr/local/bin`)を導入したとして。

## PATHは左側が優先です

PATHがこうなってたら
```bash
/usr/bin:/usr/local/bin
```

左側の`/usr/bin`が優先されるので、OS標準のrubyが呼ばれる
```bash
> which ruby
/usr/bin/ruby
```

別バージョンのrubyを呼びたい場合の正しいPATHはこう
```bash
/usr/local/bin:/usr/bin
```

そうすれば、正しいrubyが呼ばれる
```bash
> which ruby
/usr/local/bin/ruby
```

## PATH追加時の注意点

これは、現在のPATHの左(優先度高)に追加
```bash
export PATH=/usr/local/bin:$PATH
```

しかし以下だと、現在のPATHの右(優先度低)に追加することになってしまう(必ずしも悪ではない)
```bash
export PATH=$PATH:/usr/local/bin
```

## (tips)PATH確認時に見やすく整形する

`echo $PATH`と実行すると1行で返るので少々見辛い。

そんな時は、trコマンドで置換してやれば
```bash
echo $PATH | tr ':' '\n'
```

改行されて見やすくなる

```bash
/usr/local/bin
/usr/local/sbin
/usr/bin
/bin
/usr/sbin
/sbin
```

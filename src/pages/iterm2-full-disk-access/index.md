---
title: iTerm2にフルディスクアクセス権限を付与する
date: '2018-12-24'
---

HomebrewでCarthageを入れようとしたら、Permission deniedエラーが発生した。Mojaveからファイルアクセス権限が厳しくなり、手動で権限をつけてあげる必要がある。
<!-- end -->

## Permission deniedエラー

```bash
Error: An unexpected error occurred during the `brew link` step
The formula built, but is not symlinked into /usr/local
Permission denied @ dir_s_mkdir - /usr/local/Frameworks
Error: Permission denied @ dir_s_mkdir - /usr/local/Frameworks
```

## 環境

```yaml
macOS: 10.14.2(Mojave)
iTerm: 3.2
```

## フルディスクアクセス権限をつける

[Fulldiskaccess · Wiki · George Nachman / iterm2 · GitLab](https://gitlab.com/gnachman/iterm2/wikis/Fulldiskaccess)にも書かれている通り、

1. システム環境設定を開く
2. セキュリティとプライバシーに移動
3. フルディスクアクセスにiTermを追加

3stepでdone。

## フルディスクアクセス権限をつけてもbrew linkに失敗する(追記)

なんと、`/usr/local/Frameworks`というディレクトリがそもそも存在してなかった。  
というわけで、手動で作成して解決。

```bash
sudo mkdir /usr/local/Frameworks
sudo chown $(whoami):admin /usr/local/Frameworks
```

```bash
brew link carthage
Linking /usr/local/Cellar/carthage/0.31.2... 4 symlinks created
```

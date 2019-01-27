---
title: Atomのアップデート&再起動が上手く動かない時の対処法
date: '2019-01-17'
---

AtomでRestart-and-Updateボタンを押しても反応ない時(いつまで待っても再起動されない)の対処法を記載する

## 対処法

[Restart and update does not work (MacOS) - support - Atom Discussion](https://discuss.atom.io/t/restart-and-update-does-not-work-macos/15067/26)のチェックリストをやっていけば良い模様。

私の環境では、1番目の以下だけでOKだった。

```bash
sudo chown -R $(whoami) /Applications/Atom.app/
```

## 原因

OSをmojaveにした時に権限の設定が変わったか？Atomに限らずOSアップデート時はこのようなエラーが頻発する。MacOSの宿命なのだろうか。

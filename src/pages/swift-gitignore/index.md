---
title: Swiftのgitignoreテンプレート
date: '2018-12-26'
---

各言語・フレームワーク用のgitignoreテンプレートより、Swift版を導入する。
<!-- end -->

## gitignoreテンプレート
[Swift版はこちら](https://github.com/github/gitignore/blob/master/Swift.gitignore)

## gitignoreカスタマイズ
取り急ぎの2箇所だけ。

1. Carthageの成果物をignore対象に

```
# Carthage
#
# Add this line if you want to avoid checking in source code from Carthage dependencies.
Carthage/Checkouts
Carthage/Build
```

2. `DS_Store`を追加

```
## Other
*.moved-aside
*.xccheckout
*.xcscmblueprint
.DS_Store
```

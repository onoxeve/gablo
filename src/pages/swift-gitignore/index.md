---
title: Swiftのgitignoreテンプレート
date: '2018-12-26'
---

各言語・フレームワーク用の`gitignore`テンプレートより、[Swift版](https://github.com/github/gitignore/blob/master/Swift.gitignore)を導入する。細かい調整は追々やるとする。
<!-- end -->

## カスタマイズ箇所

1. Carthageの成果物をignore対象に

```
# Carthage
#
# Add this line if you want to avoid checking in source code from Carthage dependencies.
Carthage/Checkouts
Carthage/Build
```

2. `DS_Store`も追加しといた

```
## Other
*.moved-aside
*.xccheckout
*.xcscmblueprint
.DS_Store
```

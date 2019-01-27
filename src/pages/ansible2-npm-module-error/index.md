---
title: Ansible2.2 npm moduleでexecutableが効かないエラー
date: '2019-01-17'
---

ansible 2.2.1.0にて、npmモジュールのexecutableオプションが効かなった時の対処法を記載する

- エラー内容抜粋

```bash
ValueError: No JSON object could be decoded
"module_stdout": "", "msg": "MODULE FAILURE"
```

## 環境

```yaml
ansible: 2.2.1.0
nodejs: 10.15.0
```

## 対処法

[Npm module gives errors · Issue #29240 · ansible/ansible](https://github.com/ansible/ansible/issues/29240)を参考に、`environment`オプションを利用することで突破した。ansibleのバージョン起因かどうかは不明だが、今後も代替策として使える。

- 例

```bash
- name: Install yarn to global
  become: true
  npm:
    name: yarn
    global: yes
    # executable: "/home/{{ app.user }}/.nodebrew/current/bin/npm" > not working
  environment:
    PATH: "/home/{{ app.user }}/.nodebrew/current/bin:{{ ansible_env.PATH }}"
```

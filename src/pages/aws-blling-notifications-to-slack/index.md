---
title: AWS請求額をSlackに通知する
date: '2017-07-08'
---

AWS請求情報をCloudWatchから取得して、日次でSlackに通知させます。
<!-- end -->

## 概要

1. Slack APIの設定  
外部サービスからSlackに投稿できるようAPIの設定をします。
2. KMSの設定  
Slackの投稿用URLを暗号化するため、KMSを使用します。
3. Lambda/CloudWatch Eventの設定  
Lambdaの公式サンプルコードを修正し、CloudWatch Eventで定期的に実行するように設定します。

## Slack APIの登録

[Incoming WebHooksの登録をします。](https://my.slack.com/services/new/incoming-webhook/)

- 投稿するチャンネルを選択して、`Add Incoming WebHooks Integration`
- 登録後、`Webhook URL`を控えておきます。

## KMSの設定

[IAMよりKMS keyを作成します。](http://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html)

## Lambdaの設定

Lambdaには、Slack連携用のテンプレート(Blueprint)が用意されています。
Slack APIの登録手順、KMSの設定手順もテンプレート内に記載されています。

今回は、`cloudwatch-alarm-to-slack-python`(Python2.7)に沿ってやってみます。  
※ `Configure triggers`の`SNS topic`は使用しないので`Remove`して進みます。  
※ Python3.6版も用意されてますが、デフォルトだと動作しませんでした。(原因判明したら追記予定)

### テンプレートから追加/変更した箇所サマリ
- 元々AWS SNSをトリガーにしている作りなので、該当箇所をコメントアウト
- CloudWatchからAWS請求情報を取得
  - `import datetime`を追加
- Slackメッセージのカスタマイズ
  - 投稿者の表示名を変更
  - タイトルにAWS請求ダッシュボードへのリンクを付与
  - 請求額しきい値超過でメッセージを色分けするように変更

### Lambda function code

```python
# coding:utf-8

from __future__ import print_function

import boto3
import json
import logging
import os
# CloudWatchコマンド用
import datetime

from base64 import b64decode
from urllib2 import Request, urlopen, URLError, HTTPError

# The base-64 encoded, encrypted key (CiphertextBlob) stored in the kmsEncryptedHookUrl environment variable
ENCRYPTED_HOOK_URL = os.environ['kmsEncryptedHookUrl']
# The Slack channel to send a message to stored in the slackChannel environment variable
SLACK_CHANNEL = os.environ['slackChannel']

HOOK_URL = "https://" + boto3.client('kms').decrypt(CiphertextBlob=b64decode(ENCRYPTED_HOOK_URL))['Plaintext']

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# CloudWatchからAWS請求情報を取得(昨日から今日にかけて1日分の最大値)
# 2017/7現在: バージニア北部(us-east-1)リージョンのみ請求情報を取得可能
cloud_watch = boto3.client('cloudwatch', region_name='us-east-1')
get_metric_statistics = cloud_watch.get_metric_statistics(
                        Namespace='AWS/Billing',
                        MetricName='EstimatedCharges',
                        Dimensions=[
                            {
                                'Name': 'Currency',
                                'Value': 'USD'
                            }
                        ],
                        StartTime=datetime.datetime.today() - datetime.timedelta(days=1),
                        EndTime=datetime.datetime.today(),
                        Period=86400,
                        Statistics=['Maximum']
                        )

def lambda_handler(event, context):
    logger.info("Event: " + str(event))
    #message = json.loads(event['Records'][0]['Sns']['Message'])

    # AWS請求情報をフィルタ1
    message = get_metric_statistics['Datapoints'][0]
    logger.info("Message: " + str(message))

    #alarm_name = message['AlarmName']
    #old_state = message['OldStateValue']
    #new_state = message['NewStateValue']
    #reason = message['NewStateReason']

    # AWS請求情報をフィルタ2
    currency_statistics = message['Maximum']
    time_statistics = message['Timestamp'].strftime('%Y/%m/%d')

    # しきい値超過でSlackメッセージの色を変更する
    if currency_statistics > 15.0:
        notify_color = "danger"
    else:
        notify_color = "good"

    # Slack投稿メッセージ
    # username,color,title,title_linkを追加
    slack_message = {
        'channel': SLACK_CHANNEL,
        # Slack上のusername
        'username': "AWS BillingMan",
        'attachments': [
            {
                # メッセージを色分けする
                'color': notify_color,
                # タイトルを追加
                "title": "AWS Billing & Cost",
                # AWS請求ダッシュボードへのリンクを設定
                "title_link": "https://console.aws.amazon.com/billing/home?#/",
                # メッセージ本文
                'text': "EstimatedCharges is now %s USD in %s" % (currency_statistics, time_statistics)
            }
        ]
    }

    req = Request(HOOK_URL, json.dumps(slack_message))
    try:
        response = urlopen(req)
        response.read()
        logger.info("Message posted to %s", slack_message['channel'])
    except HTTPError as e:
        logger.error("Request failed: %d %s", e.code, e.reason)
    except URLError as e:
        logger.error("Server connection failed: %s", e.reason)

```

### 環境変数の設定

`Enable encryption helpers`にチェックして、事前に作成したKMSを選択します。
`kmsEncryptedHookUrl`のみ`Encrypt`をクリックして暗号化します。

```yaml
slackChannel: 投稿するチャンネル名(e.g. #test)
kmsEncryptedHookUrl: Webhook URL(e.g. "hooks.slack.com/services/abc123")
```

### Lambda function handler and role

Lambda用の新しいRoleを作成します。ここではRoleの名前だけ入力します。  
[Lambda function作成後、IAMに移動しRoleの`Permissions`を変更します。](http://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/id_roles_manage_modify.html)

1. `Attach Policy`で`CloudWatchReadOnlyAccess`を追加します。
1. `Inline Policies`で`Custom Policy`を作成します。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1443036478000",
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": [
                "<your KMS key ARN>"
            ]
        }
    ]
}
```

### CloudWatch Eventsの設定

[CloudWatch EventsのRulesを作成します。](http://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/events/RunLambdaSchedule.html)  

>ステップ 2: ルールを作成する

[cron(UTC)を設定します。](http://docs.aws.amazon.com/ja_jp/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html)
>Rate または Cron を使用したスケジュール式

例: 日本時間09:00に通知
```
0 0 ? * * *
```

例: 日本時間10:00に通知
```
0 1 ? * * *
```

## 実行結果(サンプル)

![slack](./aws_slack_notify.png)

## 参考リンク

[CloudWatch メトリクスを発行する AWS のサービス - Amazon CloudWatch](https://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/monitoring/aws-services-cloudwatch-metrics.html)

[Basic message formatting | Slack](https://api.slack.com/docs/message-formatting)

[Attaching content and links to messages | Slack](https://api.slack.com/docs/message-attachments)

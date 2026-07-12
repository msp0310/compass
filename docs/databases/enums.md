# Enums

DBでは `text` として保存し、API / migration で制約する。
フロントエンドのTypeScriptでは camelCase を使っている箇所があるため、API境界で snake_case に変換する。

## project_lifecycle_status

| Value       | Label    | Description |
| ----------- | -------- | ----------- |
| planning    | 計画     | 計画中      |
| in_progress | 進行中   | 実行中      |
| completed   | 完了済み | 完了        |

アーカイブは `projects.archived_at` で表す。

## member_status

| Value    | Label | Description                    |
| -------- | ----- | ------------------------------ |
| active   | 有効  | 新規アサイン候補に出す         |
| inactive | 無効  | 既存履歴や過去担当としては残す |

## availability_override_type

| Value       | Label  | Description              |
| ----------- | ------ | ------------------------ |
| unavailable | 非稼働 | 休暇、外出、長期離脱など |

## task_type

| Value     | Label          | Description                          |
| --------- | -------------- | ------------------------------------ |
| phase     | フェーズ       | 大工程                               |
| summary   | サマリー       | 中間階層                             |
| task      | 作業           | 実作業                               |
| milestone | マイルストーン | マイルストーン。開始日と終了日は同日 |

## task_status

| Value       | Label  | Frontend value | Description |
| ----------- | ------ | -------------- | ----------- |
| not_started | 未着手 | notStarted     | 未着手      |
| in_progress | 進行中 | inProgress     | 着手済み    |
| done        | 完了   | done           | 完了        |
| delayed     | 遅延   | delayed        | 遅延        |

## dependency_type

| Value           | Label      | Description                        |
| --------------- | ---------- | ---------------------------------- |
| finish_to_start | 終了後開始 | 先行タスク完了後に後続タスクを開始 |

将来必要なら `start_to_start`, `finish_to_finish`, `start_to_finish` を追加する。

## project_issue_status

| Value       | Label    | Frontend value |
| ----------- | -------- | -------------- |
| open        | 未対応   | open           |
| in_progress | 対応中   | inProgress     |
| blocked     | ブロック | blocked        |
| resolved    | 解決     | resolved       |
| closed      | クローズ | closed         |

## project_issue_priority

| Value    | Label |
| -------- | ----- |
| critical | 緊急  |
| high     | 高    |
| medium   | 中    |
| low      | 低    |

## project_issue_type

| Value    | Label  |
| -------- | ------ |
| bug      | 不具合 |
| change   | 変更   |
| question | 確認   |
| risk     | リスク |
| task     | 作業   |

## project_issue_sync_status

| Value    | Label      | Description                            |
| -------- | ---------- | -------------------------------------- |
| unlinked | 未連携     | GitHub項目なし                         |
| linked   | リンク済み | GitHub項目あり、同期未実装または未同期 |
| pending  | 同期待ち   | 将来の同期キュー用                     |
| synced   | 同期済み   | 将来の同期完了状態                     |
| error    | エラー     | 将来の同期失敗状態                     |

## schedule_change_source

| Value         | Label      | Description                  |
| ------------- | ---------- | ---------------------------- |
| manual        | 手動       | 個別編集、ドラッグ、リサイズ |
| bulk_edit     | 一括編集   | 複数タスクの一括変更         |
| brabio_import | Brabio取込 | Brabio XLSXからの取り込み    |
| csv_import    | CSV取込    | 汎用CSVからの取り込み        |
| api           | API        | 外部API連携やバッチ          |

## activity_category

| Value    | Label        |
| -------- | ------------ |
| calendar | カレンダー   |
| import   | 取込         |
| issue    | 課題         |
| project  | プロジェクト |
| sync     | 同期         |
| task     | タスク       |
| team     | チーム       |

## activity_tone

| Value   | Label |
| ------- | ----- |
| info    | 情報  |
| success | 成功  |
| warning | 注意  |
| danger  | 危険  |

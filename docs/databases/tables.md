# Tables

## teams

チームマスタ。プロジェクトの上位単位。

| Column      | Type    | Null | Key | Default | Description  |
| ----------- | ------- | :--: | --- | ------- | ------------ |
| id          | text    |  NO  | PK  |         | チームID     |
| code        | text    |  NO  | UQ  |         | チームコード |
| name        | text    |  NO  |     |         | チーム名     |
| description | text    |  NO  |     | ''      | 説明         |
| is_active   | integer |  NO  |     | 1       | 有効フラグ   |
| created_at  | text    |  NO  |     |         | 作成日時     |
| updated_at  | text    |  NO  |     |         | 更新日時     |

### Relations

- `projects.team_id -> teams.id`
- `team_members.team_id -> teams.id`

## members

メンバーマスタ。チーム所属やプロジェクト参画とは独立して管理する。

| Column                   | Type    | Null | Key | Default   | Description        |
| ------------------------ | ------- | :--: | --- | --------- | ------------------ |
| id                       | text    |  NO  | PK  |           | メンバーID         |
| name                     | text    |  NO  |     |           | 氏名               |
| initials                 | text    |  NO  |     |           | 画面表示用の短縮名 |
| email                    | text    | YES  | UQ  |           | メールアドレス     |
| role                     | text    |  NO  |     | ''        | 職種 / 役割        |
| color                    | text    |  NO  |     | '#64748b' | アバター色         |
| capacity_minutes_per_day | integer |  NO  |     | 480       | 標準稼働分         |
| status                   | text    |  NO  |     | active    | `member_status`    |
| inactive_at              | text    | YES  |     |           | 非アクティブ化日時 |
| created_at               | text    |  NO  |     |           | 作成日時           |
| updated_at               | text    |  NO  |     |           | 更新日時           |

## team_members

チームとメンバーの所属関係。兼務を許可する。

| Column    | Type | Null | Key    | Default | Description  |
| --------- | ---- | :--: | ------ | ------- | ------------ |
| team_id   | text |  NO  | PK, FK |         | チームID     |
| member_id | text |  NO  | PK, FK |         | メンバーID   |
| role      | text |  NO  |        | member  | チーム内役割 |
| joined_at | text |  NO  |        |         | 所属開始日時 |
| left_at   | text | YES  |        |         | 所属終了日時 |

### Relations

- `team_members.team_id -> teams.id`
- `team_members.member_id -> members.id`

## calendars

稼働日カレンダーマスタ。プロジェクト単位で参照する。

| Column                   | Type    | Null | Key | Default | Description  |
| ------------------------ | ------- | :--: | --- | ------- | ------------ |
| id                       | text    |  NO  | PK  |         | カレンダーID |
| name                     | text    |  NO  |     |         | カレンダー名 |
| standard_minutes_per_day | integer |  NO  |     | 480     | 標準稼働分   |
| created_at               | text    |  NO  |     |         | 作成日時     |
| updated_at               | text    |  NO  |     |         | 更新日時     |

## calendar_work_weekdays

カレンダーの稼働曜日。`weekday` は 0=日曜、6=土曜。

| Column      | Type    | Null | Key    | Default | Description  |
| ----------- | ------- | :--: | ------ | ------- | ------------ |
| calendar_id | text    |  NO  | PK, FK |         | カレンダーID |
| weekday     | integer |  NO  | PK     |         | 稼働曜日     |

## calendar_holidays

カレンダーの休日。

| Column      | Type | Null | Key | Default | Description     |
| ----------- | ---- | :--: | --- | ------- | --------------- |
| id          | text |  NO  | PK  |         | 休日ID          |
| calendar_id | text |  NO  | FK  |         | カレンダーID    |
| date        | text |  NO  |     |         | 休日 YYYY-MM-DD |
| name        | text |  NO  |     |         | 休日名          |

## member_availability_overrides

個人別の非稼働日。休暇や一時的な稼働不可を扱う。

| Column     | Type | Null | Key | Default     | Description                  |
| ---------- | ---- | :--: | --- | ----------- | ---------------------------- |
| id         | text |  NO  | PK  |             | 個人カレンダー例外ID         |
| member_id  | text |  NO  | FK  |             | メンバーID                   |
| date       | text |  NO  |     |             | 対象日 YYYY-MM-DD            |
| type       | text |  NO  |     | unavailable | `availability_override_type` |
| label      | text |  NO  |     |             | 表示名                       |
| created_at | text |  NO  |     |             | 作成日時                     |

## projects

案件 / プロジェクト。チーム未所属を許可する。

| Column               | Type | Null | Key | Default  | Description                     |
| -------------------- | ---- | :--: | --- | -------- | ------------------------------- |
| id                   | text |  NO  | PK  |          | プロジェクトID                  |
| team_id              | text | YES  | FK  |          | 所属チーム。未所属の場合はNULL  |
| calendar_id          | text |  NO  | FK  |          | 使用カレンダー                  |
| name                 | text |  NO  |     |          | 案件名 / プロジェクト名         |
| workspace_name       | text |  NO  |     |          | 画面上の管理単位名              |
| client_name          | text | YES  |     |          | 顧客名                          |
| lifecycle_status     | text |  NO  |     | planning | `project_lifecycle_status`      |
| range_start          | text |  NO  |     |          | 表示範囲開始日 YYYY-MM-DD       |
| range_end            | text |  NO  |     |          | 表示範囲終了日 YYYY-MM-DD       |
| next_milestone_title | text | YES  |     |          | 次のマイルストーン名            |
| next_milestone_date  | text | YES  |     |          | 次のマイルストーン日 YYYY-MM-DD |
| description          | text |  NO  |     | ''       | 説明                            |
| archived_at          | text | YES  |     |          | アーカイブ日時                  |
| created_at           | text |  NO  |     |          | 作成日時                        |
| updated_at           | text |  NO  |     |          | 更新日時                        |

### Notes

- `team_id` は nullable。`未所属` チームレコードは作らない。
- `archived_at IS NOT NULL` の場合は一覧の通常表示から外す。
- `lifecycle_status` は計画 / 進行中 / 完了済みを表す。アーカイブとは分ける。

## project_members

プロジェクト参画メンバー。プロジェクト単位の要員アサインとキャパシティを見るために使う。

| Column             | Type    | Null | Key    | Default | Description        |
| ------------------ | ------- | :--: | ------ | ------- | ------------------ |
| project_id         | text    |  NO  | PK, FK |         | プロジェクトID     |
| member_id          | text    |  NO  | PK, FK |         | メンバーID         |
| role               | text    |  NO  |        | member  | プロジェクト内役割 |
| allocation_percent | integer |  NO  |        | 100     | 参画率             |
| is_primary         | integer |  NO  |        | 0       | 主担当フラグ       |
| joined_at          | text    |  NO  |        |         | 参画開始日時       |
| left_at            | text    | YES  |        |         | 参画終了日時       |

## project_issues

プロジェクト単位の課題管理。将来GitHub Issuesと同期する前提の保持項目を含む。

| Column                | Type    | Null | Key | Default  | Description                   |
| --------------------- | ------- | :--: | --- | -------- | ----------------------------- |
| id                    | text    |  NO  | PK  |          | 課題ID                        |
| project_id            | text    |  NO  | FK  |          | プロジェクトID                |
| title                 | text    |  NO  |     |          | 課題名                        |
| body                  | text    |  NO  |     | ''       | 内容                          |
| status                | text    |  NO  |     | open     | `project_issue_status`        |
| priority              | text    |  NO  |     | medium   | `project_issue_priority`      |
| type                  | text    |  NO  |     | task     | `project_issue_type`          |
| assignee_ids_json     | text    |  NO  |     | '[]'     | 担当メンバーID配列            |
| task_ids_json         | text    |  NO  |     | '[]'     | 関連タスクID配列              |
| replies_json          | text    |  NO  |     | '[]'     | 課題返信配列                  |
| due_date              | text    | YES  |     |          | 期限 YYYY-MM-DD               |
| created_at            | text    |  NO  |     |          | 作成日時                      |
| updated_at            | text    |  NO  |     |          | 更新日時                      |
| closed_at             | text    | YES  |     |          | 解決 / クローズ日時           |
| github_repository     | text    | YES  |     |          | GitHubリポジトリ `owner/repo` |
| github_issue_number   | integer | YES  |     |          | GitHub Issue番号              |
| github_url            | text    | YES  |     |          | GitHub Issue URL              |
| github_state          | text    | YES  |     |          | GitHub側状態                  |
| github_sync_status    | text    | YES  |     | unlinked | `project_issue_sync_status`   |
| github_last_synced_at | text    | YES  |     |          | 最終同期日時                  |

### Notes

- GitHub API連携は未実装。MVPではリンク情報だけを保持する。
- `assignee_ids_json`、`task_ids_json`、`replies_json` は、MVPの編集しやすさを優先して配列JSONで保持する。
- 返信が検索、通知、権限管理の中心になる段階では、`project_issue_replies` への分離を検討する。

## tasks

ガント本体。階層、日程、進捗、種別を管理する。

| Column               | Type    | Null | Key | Default     | Description              |
| -------------------- | ------- | :--: | --- | ----------- | ------------------------ |
| id                   | text    |  NO  | PK  |             | タスクID                 |
| project_id           | text    |  NO  | FK  |             | プロジェクトID           |
| parent_task_id       | text    | YES  | FK  |             | 親タスクID。ルートはNULL |
| sort_order           | integer |  NO  |     |             | 同一親内の表示順         |
| title                | text    |  NO  |     |             | タスク名                 |
| type                 | text    |  NO  |     | task        | `task_type`              |
| status               | text    |  NO  |     | not_started | `task_status`            |
| start_date           | text    |  NO  |     |             | 開始日 YYYY-MM-DD        |
| end_date             | text    |  NO  |     |             | 終了日 YYYY-MM-DD        |
| progress_percent     | integer |  NO  |     | 0           | 進捗率 0-100             |
| effort_minutes       | integer | YES  |     |             | 見積工数                 |
| color                | text    |  NO  |     | '#89b7ff'   | バー色                   |
| description          | text    |  NO  |     | ''          | 説明                     |
| baseline_start_date  | text    | YES  |     |             | 基準計画開始日           |
| baseline_end_date    | text    | YES  |     |             | 基準計画終了日           |
| baseline_captured_at | text    | YES  |     |             | 基準計画記録日時         |
| created_at           | text    |  NO  |     |             | 作成日時                 |
| updated_at           | text    |  NO  |     |             | 更新日時                 |

### Notes

- `type = phase` または `summary` の行は子タスクを持てる。
- `type = milestone` は `start_date = end_date` とする。
- 親サマリーの期間や進捗はアプリ層で再計算する。
- `sort_order` は同一 `project_id + parent_task_id` 内で一意にする。

## task_assignments

タスク担当者。複数担当と配分率を扱う。

| Column             | Type    | Null | Key    | Default | Description    |
| ------------------ | ------- | :--: | ------ | ------- | -------------- |
| task_id            | text    |  NO  | PK, FK |         | タスクID       |
| member_id          | text    |  NO  | PK, FK |         | メンバーID     |
| allocation_percent | integer |  NO  |        | 100     | タスク内配分率 |
| effort_minutes     | integer | YES  |        |         | 担当者別工数   |

## task_dependencies

タスク依存関係。MVPは `finish_to_start` を基本にする。

| Column              | Type    | Null | Key    | Default         | Description       |
| ------------------- | ------- | :--: | ------ | --------------- | ----------------- |
| predecessor_task_id | text    |  NO  | PK, FK |                 | 先行タスクID      |
| successor_task_id   | text    |  NO  | PK, FK |                 | 後続タスクID      |
| dependency_type     | text    |  NO  |        | finish_to_start | `dependency_type` |
| lag_days            | integer |  NO  |        | 0               | ラグ日数          |

## task_checklist_items

タスク内チェックリスト。

| Column     | Type    | Null | Key | Default | Description    |
| ---------- | ------- | :--: | --- | ------- | -------------- |
| id         | text    |  NO  | PK  |         | チェック項目ID |
| task_id    | text    |  NO  | FK  |         | タスクID       |
| sort_order | integer |  NO  |     |         | 表示順         |
| label      | text    |  NO  |     |         | 項目名         |
| is_done    | integer |  NO  |     | 0       | 完了フラグ     |

## task_comments

タスクコメント。

| Column           | Type | Null | Key | Default | Description |
| ---------------- | ---- | :--: | --- | ------- | ----------- |
| id               | text |  NO  | PK  |         | コメントID  |
| task_id          | text |  NO  | FK  |         | タスクID    |
| author_member_id | text | YES  | FK  |         | 投稿者      |
| body             | text |  NO  |     |         | 本文        |
| created_at       | text |  NO  |     |         | 作成日時    |

## task_links

タスク参考リンク。

| Column     | Type | Null | Key | Default | Description |
| ---------- | ---- | :--: | --- | ------- | ----------- |
| id         | text |  NO  | PK  |         | リンクID    |
| task_id    | text |  NO  | FK  |         | タスクID    |
| label      | text |  NO  |     |         | 表示名      |
| url        | text |  NO  |     |         | URL         |
| created_at | text |  NO  |     |         | 作成日時    |

## task_schedule_changes

PM分析用の日程変更履歴。タスクごとの変更回数や変更集中を集計する。

| Column               | Type    | Null | Key | Default | Description                      |
| -------------------- | ------- | :--: | --- | ------- | -------------------------------- |
| id                   | text    |  NO  | PK  |         | 変更履歴ID                       |
| project_id           | text    |  NO  | FK  |         | プロジェクトID                   |
| task_id              | text    |  NO  | FK  |         | タスクID                         |
| changed_at           | text    |  NO  |     |         | 変更日時                         |
| changed_by_member_id | text    | YES  | FK  |         | 変更者                           |
| old_start_date       | text    | YES  |     |         | 変更前開始日                     |
| old_end_date         | text    | YES  |     |         | 変更前終了日                     |
| new_start_date       | text    | YES  |     |         | 変更後開始日                     |
| new_end_date         | text    | YES  |     |         | 変更後終了日                     |
| delta_work_days      | integer | YES  |     |         | 稼働日ベースの増減               |
| source               | text    |  NO  |     | manual  | `schedule_change_source`         |
| reason               | text    | YES  |     |         | 変更理由                         |
| metadata_json        | text    | YES  |     |         | 取り込みファイル名などの補足JSON |

### Notes

- ガント上の手動移動、リサイズ、一括シフト、Brabio取り込みで記録する。
- サマリータスクの自動再計算だけでは原則記録しない。

## activity_logs

画面表示用の操作履歴。

| Column        | Type | Null | Key | Default | Description         |
| ------------- | ---- | :--: | --- | ------- | ------------------- |
| id            | text |  NO  | PK  |         | ログID              |
| project_id    | text | YES  | FK  |         | 関連プロジェクト    |
| team_id       | text | YES  | FK  |         | 関連チーム          |
| member_id     | text | YES  | FK  |         | 操作者              |
| category      | text |  NO  |     | task    | `activity_category` |
| tone          | text |  NO  |     | info    | `activity_tone`     |
| title         | text |  NO  |     |         | 表示タイトル        |
| detail        | text |  NO  |     | ''      | 詳細                |
| metadata_json | text | YES  |     |         | 補足JSON            |
| created_at    | text |  NO  |     |         | 作成日時            |

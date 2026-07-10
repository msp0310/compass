# Indexes And Constraints

## SQLite Settings

```sql
PRAGMA foreign_keys = ON;
```

## Unique Constraints

| Table                         | Constraint                  | Columns                                | Description                          |
| ----------------------------- | --------------------------- | -------------------------------------- | ------------------------------------ |
| teams                         | uq_teams_code               | code                                   | チームコードの重複防止               |
| members                       | uq_members_email            | email                                  | メールアドレスの重複防止。NULLは許容 |
| team_members                  | pk_team_members             | team_id, member_id                     | 同一チームへの重複所属を防止         |
| project_members               | pk_project_members          | project_id, member_id                  | 同一プロジェクトへの重複参画を防止   |
| calendar_work_weekdays        | pk_calendar_work_weekdays   | calendar_id, weekday                   | 同一曜日の重複防止                   |
| calendar_holidays             | uq_calendar_holidays_date   | calendar_id, date                      | 同一カレンダー内の休日重複防止       |
| member_availability_overrides | uq_member_availability_date | member_id, date                        | 同一メンバー同日の例外重複防止       |
| tasks                         | uq_tasks_sibling_order      | project_id, parent_task_id, sort_order | 同一階層内の表示順重複防止           |
| task_assignments              | pk_task_assignments         | task_id, member_id                     | 同一タスク担当の重複防止             |
| task_dependencies             | pk_task_dependencies        | predecessor_task_id, successor_task_id | 同じ依存関係の重複防止               |

## Recommended Indexes

| Index                                     | Table                         | Columns                                | Purpose                            |
| ----------------------------------------- | ----------------------------- | -------------------------------------- | ---------------------------------- |
| idx_projects_team_id                      | projects                      | team_id                                | チーム配下のプロジェクト一覧       |
| idx_projects_lifecycle_status             | projects                      | lifecycle_status                       | 計画 / 進行中 / 完了済みの絞り込み |
| idx_projects_archived_at                  | projects                      | archived_at                            | アーカイブ除外                     |
| idx_project_members_member_id             | project_members               | member_id                              | メンバー別参画プロジェクト         |
| idx_project_issues_project_updated        | project_issues                | project_id, updated_at                 | 案件別課題一覧                     |
| idx_tasks_project_parent_order            | tasks                         | project_id, parent_task_id, sort_order | ガント階層表示                     |
| idx_tasks_project_dates                   | tasks                         | project_id, start_date, end_date       | 表示範囲検索                       |
| idx_tasks_project_status                  | tasks                         | project_id, status                     | ステータス集計                     |
| idx_task_assignments_member_id            | task_assignments              | member_id                              | メンバー別作業量                   |
| idx_task_dependencies_successor           | task_dependencies             | successor_task_id                      | 後続タスクから先行タスクを参照     |
| idx_calendar_holidays_calendar_date       | calendar_holidays             | calendar_id, date                      | 非稼働日判定                       |
| idx_member_availability_member_date       | member_availability_overrides | member_id, date                        | 個人非稼働日判定                   |
| idx_task_schedule_changes_project_changed | task_schedule_changes         | project_id, changed_at                 | プロジェクト別変更履歴             |
| idx_task_schedule_changes_task_changed    | task_schedule_changes         | task_id, changed_at                    | タスク別変更回数                   |
| idx_task_schedule_changes_source          | task_schedule_changes         | source                                 | 変更由来別分析                     |
| idx_activity_logs_project_created         | activity_logs                 | project_id, created_at                 | プロジェクト履歴表示               |
| idx_activity_logs_team_created            | activity_logs                 | team_id, created_at                    | チーム履歴表示                     |

## Check Constraints

SQLiteでも migration で可能なら付与する。

```sql
CHECK (progress_percent >= 0 AND progress_percent <= 100)
CHECK (allocation_percent >= 0 AND allocation_percent <= 100)
CHECK (end_date >= start_date)
CHECK (baseline_end_date IS NULL OR baseline_start_date IS NULL OR baseline_end_date >= baseline_start_date)
CHECK (type <> 'milestone' OR start_date = end_date)
CHECK (weekday >= 0 AND weekday <= 6)
```

## Delete Policy

MVPでは物理削除を基本にする。ただし次は残す。

- プロジェクト非表示は `projects.archived_at` を使う。
- メンバー無効化は `members.status = inactive` を使う。
- PM分析に必要な `task_schedule_changes` はタスク削除後も残せるよう、実装時に削除ポリシーを再確認する。

分析を重視する段階では、`tasks.deleted_at` の追加を検討する。

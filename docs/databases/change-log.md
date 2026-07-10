# Database Design Change Log

## 2026-07-09

- 初版を作成。
- 基本構造を `team > project > task` とした。
- `projects.team_id` は nullable とし、未所属プロジェクトを許可する方針にした。
- プロジェクトの進行状態は `projects.lifecycle_status`、アーカイブ状態は `projects.archived_at` に分離した。
- ガントのマイルストーンは独立テーブルではなく `tasks.type = milestone` で扱う方針にした。
- 案件単位の課題管理として `project_issues` を追加し、返信履歴と将来のGitHub Issues連携用項目を持たせた。
- PM分析向けに `task_schedule_changes` を追加した。
- 画面表示用の履歴として `activity_logs` を追加した。

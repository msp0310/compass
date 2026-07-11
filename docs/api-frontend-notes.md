# API / Frontend Integration Notes

## 取得境界

- `GET /api/workspace/summary`: チームと軽量案件集計
- `GET /api/projects/{projectId}/schedule`: 選択案件のタスク・課題・実績・カレンダー
- `GET /api/daily-reports?page=1&pageSize=100`: 日報のページング取得
- 全案件の詳細をまとめるAPIは提供しない

## 更新境界

- `PUT /api/projects/{projectId}/schedule`: PM / PLによる案件計画保存。メンバーは計画項目が不変の場合に限り、課題・コメント・本人の作業時間を保存
- `PATCH /api/projects/{projectId}/tasks/{taskId}/actual`: 担当者の実績入力
- `POST /api/projects`: 案件作成
- `PUT /api/admin/teams/{teamId}`: チームと所属・チーム権限
- `PUT /api/admin/members/{memberId}`: メンバーマスター
- `PUT /api/admin/teams/{teamId}/calendar`: チーム配下案件の標準カレンダー一括反映
- `GET /api/admin/audit-logs`: システム管理者向け監査ログ

## 認証

フロントはBearerトークンを保存しません。ログインでHttpOnlyセッションCookieとCSRF Cookieを受け取り、`fetch`は`credentials: include`で送信します。GET以外は共通APIクライアントが`X-CSRF-Token`を付与します。

`passwordResetRequired`が有効な場合はパスワード変更画面だけを表示し、変更後に再ログインします。

## エラー

- `400`: 入力値不正
- `401`: 未ログイン・セッション切れ
- `403`: 権限不足・CSRF失敗・パスワード変更必須
- `409`: 楽観ロック競合
- `429`: ログイン試行超過

フロントには最上位Error Boundaryがあり、予期しない描画例外ではエラーIDと再読み込み導線を表示します。

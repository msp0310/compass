# Mirai

SI企業向けのチーム・プロジェクト・タスク管理アプリです。React + TypeScriptのフロントエンドと、ASP.NET Core 10 + SQLiteのAPIで構成しています。

## 構成

- `frontend/`: Vite + React + TypeScript。案件一覧、Gantt、課題、作業時間、リソース、カレンダー、マイルストーンを提供します。
- `backend/src/Schedule.Api/`: .NET 10 Minimal API。認証、ワークスペース、プロジェクト単位の保存、変更履歴、祝日取得を提供します。
- `tests/`: PlaywrightによるE2Eテストと大量データの性能テストです。
- `docs/architecture.md`: データ取得境界、保存方式、性能上の不変条件をまとめています。

## 起動

フロントエンド:

```bash
cd frontend
npm install
npm run dev -- --port 5174
```

API:

```bash
ASPNETCORE_ENVIRONMENT=Development $HOME/.dotnet/dotnet run \
  --project backend/src/Schedule.Api/Schedule.Api.csproj \
  --urls http://127.0.0.1:5080
```

ブラウザで `http://127.0.0.1:5174/` を開きます。ローカル開発用の初期アカウントは `pm@example.com` / `Password123!` です。ログイン画面には表示しません。

## 検証

```bash
# フロントエンドの型検査とビルド
cd frontend
npm run check
npm run build

# ルートで実行
cd ..
npm run test:types
npm run test:e2e
npm run test:performance
$HOME/.dotnet/dotnet build backend/ScheduleManager.sln
```

フロントエンドの未使用コード検査と.NETの分析警告はビルドゲートでエラー扱いにしています。

初回だけPlaywrightのブラウザを導入します。

```bash
npx playwright install chromium
```

E2E設定は `playwright.config.ts` にあり、フロントエンドとAPIを必要に応じて起動します。性能テストは、10万案件の初期選択、10万段のタスク階層、30人・10案件・3,000タスクのResource集計を計測します。

## 設計方針

- 情報構造は `Team > Project > Task` です。
- プロジェクト保存は楽観的バージョンで競合を検知します。
- タスク保存はタスクID・担当者・依存関係を基準に差分適用し、日付1件の変更で全タスクを再作成しません。
- 初期表示は `/api/workspace/summary` でチームと案件集計だけを取得し、タスク明細は選択された案件の `/api/projects/{projectId}/schedule` から遅延取得します。
- Resourceのチーム横断表示は、必要な案件だけを並列取得してから集計します。起動時に全案件のタスクを読み込みません。
- Ganttの行は仮想化し、表示中の行だけをDOMへ配置します。
- 階層展開やリソース集計は、行数に対して不要な配列コピーや線形検索を増やさないようにします。
- `localScheduleStorage` は表示状態と保存前ドラフトに限定し、プロジェクトデータはAPIリポジトリへ送ります。
- Brabio取込は専用フローとして扱い、汎用CSVの列マッピングを前提にしません。
- クラス・メソッドレベルの補足コメントは日本語で記述します。
- インライン編集は入力中の状態更新を抑え、Enterまたはフォーカスアウト時に確定します。

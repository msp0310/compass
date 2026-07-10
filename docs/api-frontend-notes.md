# API / Frontend Integration Notes

## Current Implementation

- Frontend bootstraps workspace data from `GET /api/workspace`.
- Project Gantt saves are scoped to one project through `PUT /api/projects/{projectId}/schedule`.
- SQLite seed data is created by the API on first startup, so the frontend no longer needs mock data for initial display.
- Frontend keeps localStorage as a browser cache for view state and unsaved/offline recovery, but project data is now API-originated.
- Project `version` is returned from the API and sent back as `expectedVersion` on save for optimistic conflict checks.

## Design Decisions

- Save scope is project Gantt first. Team and master settings can become separate API endpoints later.
- `team > project > task` remains the product model. A project may have no assigned team later, but that should be represented as `teamId: null` on the API model when implemented.
- Schedule changes should be stored as events, not derived only from the latest task row.
- Brabio import can stay frontend-first for preview-less XLSX parsing during prototyping, but long term the API should own import job persistence and validation results.

## Follow-Up Tasks

- Add migration-based DB management instead of `EnsureCreated` before production use.
- Split project settings, team/member master, calendar master, and task operations into narrower endpoints.
- Add authentication and organization scoping before multi-user usage.
- Add a conflict resolution UI for HTTP 409 responses.
- Persist import jobs and source file metadata for Brabio migration traceability.
- Expose schedule-change analytics APIs for PM analysis: changed task count, date delta totals, phase heatmap, and change frequency trend.

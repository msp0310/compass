# Design QA: ガント階層表示

- Source visual truth: `C:\Users\m_sawada\.codex\generated_images\019f78a1-5ac3-7381-ba9d-66815e60adc2\exec-7cb02236-ad0e-4450-a0b4-5248d09de431.png`
- Implementation URL: `http://172.22.80.1/projects/pjmgt-project-efd1d0d0083b4572/gantt`
- Browser-rendered implementation: `C:\Users\m_sawada\.codex\visualizations\2026\07\19\019f78a1-5ac3-7381-ba9d-66815e60adc2\compass-gantt-implementation.png`
- Viewport: 1672 x 941
- State: production deployment, authenticated administrator, Gantt view, day scale, standard width, no filters, current imported project data

## Comparison evidence

- Full-view combined comparison: `C:\Users\m_sawada\.codex\visualizations\2026\07\19\019f78a1-5ac3-7381-ba9d-66815e60adc2\design-qa-full.png`
- Focused hierarchy comparison: `C:\Users\m_sawada\.codex\visualizations\2026\07\19\019f78a1-5ac3-7381-ba9d-66815e60adc2\design-qa-hierarchy.png`
- The focused comparison was required because the 10–12 px indent, tree rails, elbow connectors, folder/leaf icons, font weights, and row separators are too small to judge reliably in the full-view composite.
- The full-view comparison confirms the intended hierarchy emphasis and subtle today line while preserving the production app shell, toolbar functionality, and real project dates. Differences in visible bar spans come from production task dates; the mock's illustrative spans were not copied over the source data.

## Required fidelity surfaces

- Fonts and typography: existing Inter/Noto Sans JP stack retained; parent rows are visibly heavier and leaf rows remain lighter. Truncation and a relaxed 38 px row rhythm remain intact.
- Spacing and layout rhythm: 14 px depth steps, continuous ancestor rails, elbow connectors, and a responsive 440–500 px task pane align with the selected target without crowding deep task names.
- Colors and visual tokens: existing COMPASS blue/green/gray tokens retained. The today treatment is reduced to a very pale column tint and a 1 px blue line; the badge is absent.
- Image quality and asset fidelity: no raster assets were required. Folder and leaf markers use the existing Heroicons package; no custom icon drawing or placeholder asset was introduced.
- Copy and content: production task names, statuses, assignees, and dates remain unchanged.

## Findings

- No actionable P0, P1, or P2 differences remain in the requested hierarchy and today-marker scope.
- P3: the implementation retains collapse chevrons and reorder handles because they are existing working controls; the reference simplifies those controls visually. Their low-contrast treatment does not obscure hierarchy.

## Interaction and runtime checks

- Root collapse reduced visible task rows from 20 to 1 at the 1280 px verification viewport; expanding restored all 20 rows.
- Selecting the root Gantt bar preserved its measured width at 11274 px before and after click, confirming the earlier click-to-stretch behavior does not recur.
- Browser console errors checked after deployment: none.
- API health: healthy; `compass.service`: active.

## Comparison history

1. Initial comparison found the leaf marker visually heavier than the outlined marker in the target. It was changed from a filled square to a 10 px outlined Heroicon.
2. Post-fix capture at the same viewport shows the outlined leaf marker, compact rails, parent emphasis, and subtle today line matching the selected direction. No P0/P1/P2 findings remain.
3. Follow-up comparison after the cramped-density report widened the task pane to 500 px at the QA viewport, increased row height to 38 px, and relaxed depth spacing to 14 px. The refreshed focused comparison shows full parent labels and clearer separation without breaking the hierarchy rails.

final result: passed

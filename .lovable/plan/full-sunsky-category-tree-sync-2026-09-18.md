# Full SunSky category tree sync

Yes — this is possible. SunSky only returns one level at a time (the children of a given category), so the whole tree is built by walking it level by level and saving every branch as we go.

Today the portal fetches children only when you click a category, so the saved tree is whatever happens to have been browsed. Right now 3,363 categories are stored (19 top, 491 sub, 2,853 detail), but there is no guarantee every branch was visited, and there is no stored full path.

## What will be built

1. **"Sync full tree" button** in the SunSky Categories panel. One click crawls SunSky from the 20 top categories downward, fetching children of every category that reports having children, until no deeper level exists.
2. **Live progress** while it runs: categories discovered, current level, and how many branches are left to expand.
3. **Complete family tree stored** for each category: its parent, its depth level, and its full path text (e.g. `Mobile Accessories › Chargers › Car Chargers`), plus the top-level and sub-level ancestors, so any category can be shown with its lineage without extra lookups.
4. **Tree browser + export**: the existing Categories panel gains a total count per level, a search that shows matching categories with their full path, and a "Download CSV" of the whole tree (id, parent, name, level, path).

Existing rows are updated in place rather than wiped, so browsing keeps working while a sync runs.

## Technical details

- New internal endpoint `category/sync-all` in `src/lib/edge/sunsky-proxy.server.ts`, following the existing bulk-import job pattern: it queues a job row and runs a breadth-first crawl in the background, calling `category!getChildren.do` per parent with small concurrency and a retry on failure.
- Crawl guards: visited-set to prevent cycles, depth cap of 6, and a cap on total requests; every batch upserts into `sunsky_categories` on `category_id` so partial progress survives an interruption.
- Migration on `sunsky_categories`: add `path text`, `root_id numeric`, `sub_id numeric`, `child_count int`; backfill via a recursive CTE after each sync. Keep existing GRANTs/RLS unchanged.
- Job state reuses `sunsky_import_jobs` with a `kind = 'category_tree'` marker (or a small `sunsky_category_sync_runs` table if the existing columns don't fit), polled by the UI for progress.
- The root whitelist logic stays as-is so top-level detection remains correct; the crawl only adds descendants.
- UI changes in `src/components/admin/sunsky/CategoryTree.tsx` (sync button, counts, search-by-path, CSV export). `CategoryPicker` benefits automatically from the fuller cache.

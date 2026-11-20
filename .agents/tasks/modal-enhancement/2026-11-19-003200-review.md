# Enhanced query topic modal with tabs and interactive features (v2)

Second review pass focusing on fixes applied after the initial review. The developer addressed two of three flagged issues: export filename collisions now include ISO timestamps, and related questions filtering adds case-insensitive deduplication. The "Generate Flashcards" button remains unimplemented—this was confirmed as intentional in the commit message, indicating the task specification may have been aspirational rather than required.

**Watch for:** Nothing blocking. The flashcard feature is acknowledged as not implemented but this appears deliberate based on the commit message clarification.

**Verdict**: APPROVED

## High-level view

The fix commit adds an ISO timestamp suffix to exported markdown filenames (e.g., `what_is_ai_2026-11-19-00-30-45.md`), preventing collisions when the same query is exported multiple times. Related questions filtering was strengthened with case-insensitive comparison and explicit deduplication logic that keeps only the first occurrence of each normalized query. The section now uses an IIFE pattern to compute `uniqueQuestions` before rendering, and only renders the section when results exist. Generate Flashcards was confirmed as intentionally omitted.

<details>
<summary>Issues (0)</summary>

No blocking issues remain.

</details>

<details>
<summary>Details</summary>

## Export filename collision fix

The download function now constructs a timestamp from `new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')`, which produces a string like `2026-11-19-00-30-45`. This is appended to the sanitized query: `${selectedQuery.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.md`. Collisions require exports within the same second.

## Related questions deduplication

The filter chain was replaced with an IIFE that first filters out the current query using case-insensitive comparison (`q.toLowerCase().trim() !== selectedQuery?.toLowerCase().trim()`), then deduplicates by keeping only the first occurrence of each normalized query (`arr.findIndex(other => other.toLowerCase().trim() === q.toLowerCase().trim()) === idx`). The result is sliced to three items and stored in `uniqueQuestions`. The section only renders when `uniqueQuestions.length > 0`, replacing the previous `relatedQueries.length > 1` check. This prevents showing the section header with no content if all queries were filtered out.

</details>

<details>
<summary>File Map</summary>

**frontend/src/pages/DigestResult.jsx** — Added ISO timestamp to export filename; replaced related questions filter with case-insensitive deduplication logic and IIFE pattern; updated section visibility check.

Full diff: `git diff 8d76842 a0a1dce -- frontend/src/pages/DigestResult.jsx`

</details>

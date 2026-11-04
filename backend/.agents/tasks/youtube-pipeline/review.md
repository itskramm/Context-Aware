# 3-Tier YouTube Processing Pipeline — Fix Pass

The fix commit addresses both issues raised in the prior review: the double Data API quota spend and the missing metadata enrichment on the Tier 2 (Whisper) path. The processing service now gates its `fetchYouTubeMetadata` call on a `routeAlreadyEnriched` check, and the enrichment block has moved to a shared position before the Tier 1 / Tier 2 branch so it runs regardless of which transcription path wins.

Watch for: **confirmed** — the `routeAlreadyEnriched` guard uses `lecture.duration > 0` as a proxy for "the route already enriched this document," but a valid video with no parseable duration in the Data API response (`duration === 0`) will cause the processing service to call the API again despite the route already trying. Low-probability edge case, but the guard is not airtight.

**Verdict**: APPROVED

---

## High-level view

Both prior blocking concerns are resolved. The Data API call in `processingService.js` is now gated on `!(lecture.youtubeVideoId && lecture.duration > 0)`, which eliminates the duplicate quota spend in the normal case. The enrichment block executes before the tier branch, so Tier 2 submissions now receive Data API metadata if the route-time call failed transiently.

The one residual gap is the `duration > 0` guard: a video whose duration the Data API returns as zero (or fails to parse) will have `routeAlreadyEnriched = false` even though `youtubeVideoId` was already written, causing a second API call. This is narrow enough not to block, but worth a follow-up comment in the code.

---

<details>
<summary>Issues (1)</summary>

1. **`routeAlreadyEnriched` guard leaks on zero-duration videos** — `!!(lecture.youtubeVideoId && lecture.duration > 0)` will be `false` when the Data API returned `duration: 0` (live streams, some shorts, or a parsing edge case). The processing service then calls `fetchYouTubeMetadata` a second time despite the route already running it. Using `lecture.youtubeVideoId` alone as the guard, or a dedicated `dataApiEnrichedAt` timestamp field, would be more reliable. **confirmed** (reading `processingService.js` line 48 and the `parseIso8601Duration` return-0-on-no-match path in `youtubeDataApiService.js`).

</details>

---

<details>
<summary>Details</summary>

### `routeAlreadyEnriched` guard and the zero-duration edge case

The guard is `!!(lecture.youtubeVideoId && lecture.duration > 0)`. `youtubeVideoId` is always written by the route, so the discriminating condition is `duration > 0`. `parseIso8601Duration` returns `0` when the regex finds no match (e.g., a bare `PT` string for a live stream in progress, or a malformed duration field). In that case the route writes `duration: 0` to Firestore, the guard evaluates to `false`, and the processing service fires a second Data API call for the same video. For live streams this call also returns an unparseable duration, so it's a wasted quota unit on every processing run until the stream ends.

Replacing the guard with `!!lecture.youtubeVideoId` — or writing a dedicated `dataApiEnrichedAt` timestamp in the route — would close this. The oEmbed fallback inside the same guard block also silently skips live streams for the same reason: `getYouTubeMetadata` is only called when `!dataApiMeta`, but the guard itself prevents even reaching that fallback on a second processing attempt.

</details>

---

<details>
<summary>File map</summary>

- `backend/src/services/youtubeDataApiService.js` — new service: Data API v3 fetch, ISO 8601 parser, null-on-error contract
- `backend/src/services/processingService.js` — moved enrichment block before tier branch; added `routeAlreadyEnriched` guard; fixed duration-override logic
- `backend/.env.example` — added `YOUTUBE_API_KEY` entry

Full diff: `git diff HEAD~2...HEAD`

</details>

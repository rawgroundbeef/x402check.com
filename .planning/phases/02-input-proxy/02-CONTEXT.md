# Phase 2: Input & Proxy - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users submit x402 configs for validation via URL or direct JSON paste. A Cloudflare Worker proxy enables fetching from any URL (bypassing CORS). The tool detects input type automatically and extracts config from X-Payment header or response body.

</domain>

<decisions>
## Implementation Decisions

### Smart input detection
- Single input field that auto-detects: if starts with `http`, treat as URL; otherwise treat as JSON
- No tabs, no toggles, no mode switching — paste whatever you have
- Input starts as single line, expands when JSON is detected (multi-line content)
- Placeholder text: "Paste a URL or x402 JSON config..."
- Clearing input clears results too — clean slate

### URL fetching behavior
- Loading state: button shows spinner + "Validating..." — stays in place, no layout shift
- Fetch timeout: 5 seconds before declaring failure
- No automatic retry on network failure — fail immediately with clear error, user retries manually
- All errors (network, timeout, 500s) display in results area — same spot as validation results

### Header/body extraction
- X-Payment header takes priority (canonical per spec)
- Only fall back to response body if header missing
- Show config source in results: "Valid — found in X-Payment header" or "found in response body"
- If URL returns 200 (not 402): validate config if present, but warn "Response status: 200 — x402 endpoints should return 402 Payment Required"
- If no config found: "No x402 Config Found — Response had no X-Payment header or valid JSON body → Ensure endpoint returns 402 status with X-Payment header"

### JSON input handling
- Validate on submit only — no debounced/live validation (avoids error spam while editing)
- Auto-format/prettify JSON on paste for readability
- Immediate inline hint if pasted text isn't valid JSON (red border + "Invalid JSON")
- No dedicated clear button — standard select-all + delete suffices

### Claude's Discretion
- Exact expand animation for input field
- Specific styling of loading spinner
- Error message wording variations
- Input field sizing and padding

</decisions>

<specifics>
## Specific Ideas

- Error display format example given: "❌ Fetch Failed — Could not reach URL → Check the URL is correct and publicly accessible"
- Success display shows source: "✅ Valid — found in X-Payment header"
- Warning format for non-402: "⚠️ Response status: 200 — x402 endpoints should return 402 Payment Required"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-input-proxy*
*Context gathered: 2026-01-22*

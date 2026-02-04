# Phase 13: Manifest Validation - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate an entire manifest — per-endpoint correctness via the existing `validate()` pipeline plus cross-endpoint consistency checks and bazaar method discrimination. Exports `validateManifest()` with `ManifestValidationResult`. Detection and manifest types already exist from Phase 11. CLI and website integration are separate phases (14, 15).

</domain>

<decisions>
## Implementation Decisions

### Result structure
- Per-endpoint results keyed by endpoint ID strings in a `Record<string, ValidationResult>`
- Top-level `valid: boolean` that is `true` only if ALL endpoints pass and no manifest-level errors exist
- Include the normalized manifest in the result so callers don't need to call `normalize()` separately

### Cross-endpoint checks
- Same payTo address across endpoints is expected (single merchant) — no warning
- Duplicate HTTP method + URL path in bazaar metadata is a **warning** (not error)
- Mixed networks across endpoints (some mainnet, some testnet) produces a **warning**
- Duplicate endpoint URLs (exact match) is a **warning**

### Bazaar validation depth
- Bazaar extensions are optional — only validated when present on an endpoint
- Method discrimination is **strict errors**: GET with body input shape is an error, POST with queryParams input shape is an error
- Same input shape rules apply to all HTTP methods: PUT/PATCH/DELETE follow body vs queryParams semantics like POST/GET
- JSON Schema validation depth: Claude's discretion (see below)

### Claude's Discretion
- Whether manifest-level issues live in separate fields vs merged list (issue grouping)
- JSON Schema validation depth for bazaar schemas — structural shape check vs full JSON Schema grammar validation (balance bundle impact)
- Field path format for manifest errors (bracket notation vs dot notation)
- Error code namespace — same enum with new codes vs prefixed manifest codes
- Whether endpoint ID appears in error message text or just field path
- Fix suggestion depth for manifest-level issues (match existing v2 style or lighter)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Decisions focused on severity levels and API shape; implementation details left to Claude's judgment where noted.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-manifest-validation*
*Context gathered: 2026-02-04*

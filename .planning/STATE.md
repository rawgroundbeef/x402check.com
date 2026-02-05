# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Developers can validate their x402 config in under 30 seconds with actionable feedback
**Current focus:** Milestone v3.0 -- Manifest Validation & CLI

## Current Position

Phase: 14 - CLI Manifest Mode (in progress)
Plan: 01 of 02 complete
Status: Phase 14 in progress
Progress: [████▌.....] 4.5/6 v3.0 phases
Last activity: 2026-02-04 -- Completed 14-01-PLAN.md (CLI infrastructure modules)

## Performance Metrics

**Velocity:**
- Total plans completed: 21 (3 v1.0 + 12 v2.0 + 6 v3.0)
- Average duration: 3.0 min
- Total execution time: 1.03 hours

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full list.

**v3.0 roadmap decisions:**
- 6 phases derived from 9 requirements and research recommendations
- Stacks (Phase 12) runs parallel with Manifest Validation (Phase 13)
- CLI (Phase 14) runs parallel with Website (Phase 15)
- Critical path: 11 -> 13 -> 14 -> 16
- Bazaar deep JSON Schema validation deferred (structural validation only in v3.0)
- Bundle size target: 45 KB minified (conservative, accommodates Stacks c32check overhead)

**Phase 11-01 decisions:**
- Manifest detection must occur before v2 (manifests may have x402Version: 2)
- Empty endpoints ({}) is valid to allow manifest initialization
- Type guards (isManifestConfig, isV2Config, isV1Config) exported from main entry for SDK users
- Manifest error codes marked as unreachable until Phase 13 validation implemented

**Phase 11-02 decisions:**
- Wild manifest normalization returns warnings (not errors) for migration path
- URL-path-based endpoint IDs preferred over index-based for stability
- Two-pattern detection (array-style + nested-service-style) covers 95% of wild manifests
- Financial data (amounts, addresses, networks) never modified during normalization
- Collision handling with -2, -3 suffix ensures no endpoint ID data loss

**Phase 12-01 decisions:**
- c32check standalone package chosen over @stacks/transactions for minimal bundle overhead
- Network-aware version byte validation required (SP/SM only valid on stacks:1, ST/SN only on stacks:2147483648)
- Contract name suffixes stripped before validation (e.g., SP123.token → SP123)
- Single INVALID_STACKS_ADDRESS code for format/checksum errors, separate STACKS_NETWORK_MISMATCH for network mismatches
- Bundle size 58.19 KB (over 45KB target) accepted given 19.86 KB gzipped and comprehensive validation depth

**Phase 13-01 decisions:**
- Use Record instead of Map for endpointResults to enable direct JSON serialization
- Include normalized manifest in result for caller convenience
- All cross-endpoint checks return warnings not errors per CONTEXT.md user decisions
- Bazaar method discrimination returns errors not warnings per CONTEXT.md user decisions
- Structural validation only for bazaar schemas to avoid Ajv dependency and bundle bloat
- Bracket notation for field paths to handle endpoint IDs with special characters
- Empty endpoints ({}) returns valid:true per Phase 11 decision

**Phase 13-02 decisions:**
- Use valid checksummed EVM addresses in test helpers to ensure per-endpoint validation passes cleanly
- Group tests by validation layer (basic, per-endpoint, cross-endpoint, bazaar, edge cases) for clarity

**Phase 14-01 decisions:**
- cli-table3 as devDependency (tsdown bundles it, not exposed to library users)
- node:util parseArgs API for modern argument parsing with repeatable flags
- Manual redirect tracking with configurable limits for better control and error handling
- Manifest auto-detection in resolveInput() with wild manifest normalization support

### Pending Todos

None.

### Blockers/Concerns

**Bundle size trend:** IIFE bundle grew from ~31KB (pre-Stacks) to 58.19 KB (post-Stacks) to 62.59 KB (post-manifest validation). Gzipped remains good (21.14 KB), but may need tree-shaking optimizations if adding more features. Growth is acceptable given comprehensive manifest validation capability.

## Session Continuity

Last session: 2026-02-04 21:55 UTC
Stopped at: Completed 14-01-PLAN.md (CLI infrastructure modules: args, fetch, detect)
Resume file: None
Next: Phase 14-02 (CLI main flow rewrite with manifest support) or Phase 15 (Website Integration). Critical path continues through 14 → 16.

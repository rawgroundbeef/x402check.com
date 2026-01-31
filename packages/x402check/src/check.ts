/**
 * Unified check() API
 *
 * Composes extractConfig() + validate() + registry lookups into a single call.
 * Never throws.
 */

import type { CheckResult, AcceptSummary } from './types/check'
import type { ValidationOptions } from './validation/orchestrator'
import type { ResponseLike } from './extraction/extract'
import { extractConfig } from './extraction/extract'
import { validate } from './validation/orchestrator'
import { getNetworkInfo } from './registries/networks'
import { getAssetInfo } from './registries/assets'

/**
 * Check an HTTP 402 response: extract config, validate, and enrich with registry data.
 *
 * Never throws. All failures are represented in the returned CheckResult.
 *
 * @param response - Response-like object with body and/or headers
 * @param options - Validation options (e.g. strict mode)
 * @returns Unified check result
 */
export function check(
  response: ResponseLike,
  options?: ValidationOptions,
): CheckResult {
  // ── Extract ──────────────────────────────────────────────────────────
  const extraction = extractConfig(response)

  if (!extraction.config) {
    return {
      extracted: false,
      source: null,
      extractionError: extraction.error,
      valid: false,
      version: 'unknown',
      errors: [],
      warnings: [],
      normalized: null,
      summary: [],
      raw: null,
    }
  }

  // ── Validate ─────────────────────────────────────────────────────────
  const validation = validate(extraction.config, options)

  // ── Build summaries from normalized accepts ──────────────────────────
  const summary: AcceptSummary[] = []
  const accepts = validation.normalized?.accepts ?? []

  for (let i = 0; i < accepts.length; i++) {
    const entry = accepts[i]!
    const networkInfo = getNetworkInfo(entry.network)
    const assetInfo = getAssetInfo(entry.network, entry.asset)

    summary.push({
      index: i,
      network: entry.network,
      networkName: networkInfo?.name ?? entry.network,
      networkType: networkInfo?.type ?? null,
      payTo: entry.payTo,
      amount: entry.amount,
      asset: entry.asset,
      assetSymbol: assetInfo?.symbol ?? null,
      assetDecimals: assetInfo?.decimals ?? null,
      scheme: entry.scheme,
    })
  }

  return {
    extracted: true,
    source: extraction.source,
    extractionError: null,
    valid: validation.valid,
    version: validation.version,
    errors: validation.errors,
    warnings: validation.warnings,
    normalized: validation.normalized,
    summary,
    raw: extraction.config,
  }
}

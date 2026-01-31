/**
 * Types for the unified check() API
 */

import type { ConfigFormat } from './config'
import type { NormalizedConfig } from './config'
import type { ValidationIssue } from './validation'

/**
 * Display-ready summary of a single accepts entry with registry data
 */
export interface AcceptSummary {
  index: number
  network: string
  networkName: string
  networkType: string | null
  payTo: string
  amount: string
  asset: string
  assetSymbol: string | null
  assetDecimals: number | null
  scheme: string
}

/**
 * Unified check result combining extraction, validation, and registry lookups
 */
export interface CheckResult {
  // Extraction
  extracted: boolean
  source: 'body' | 'header' | null
  extractionError: string | null
  // Validation
  valid: boolean
  version: ConfigFormat
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  // Normalized config
  normalized: NormalizedConfig | null
  // Display-ready per-accept summaries with registry data
  summary: AcceptSummary[]
  // Raw extracted config for debugging
  raw: object | null
}

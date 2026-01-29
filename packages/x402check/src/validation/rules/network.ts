/**
 * Level 4: Network and asset validation
 * Validates CAIP-2 format, known networks, and known assets
 */

import type { AcceptsEntry, ValidationIssue } from '../../types'
import { ErrorCode, ErrorMessages } from '../../types/errors'
import { isValidCaip2, isKnownNetwork } from '../../registries/networks'
import { getCanonicalNetwork } from '../../registries/simple-names'
import { isKnownAsset } from '../../registries/assets'

/**
 * Validate network field on a single accepts entry.
 *
 * Checks CAIP-2 format and known network registry. Provides fix
 * suggestions for simple chain names that have canonical CAIP-2 mappings.
 *
 * @param entry - Accepts entry to validate
 * @param fieldPath - Dot-notation path for issue reporting (e.g. "accepts[0]")
 * @returns Array of validation issues
 */
export function validateNetwork(entry: AcceptsEntry, fieldPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Missing field already caught by validateFields
  if (!entry.network) {
    return issues
  }

  if (!isValidCaip2(entry.network)) {
    // Check if this is a simple name with a canonical CAIP-2 mapping
    const canonical = getCanonicalNetwork(entry.network)

    if (canonical) {
      issues.push({
        code: ErrorCode.INVALID_NETWORK_FORMAT,
        field: `${fieldPath}.network`,
        message: ErrorMessages.INVALID_NETWORK_FORMAT,
        severity: 'error',
        fix: `Use '${canonical}' instead of '${entry.network}'`,
      })
    } else {
      issues.push({
        code: ErrorCode.INVALID_NETWORK_FORMAT,
        field: `${fieldPath}.network`,
        message: ErrorMessages.INVALID_NETWORK_FORMAT,
        severity: 'error',
      })
    }

    return issues
  }

  // Valid CAIP-2 format but not in known registry
  if (!isKnownNetwork(entry.network)) {
    issues.push({
      code: ErrorCode.UNKNOWN_NETWORK,
      field: `${fieldPath}.network`,
      message: ErrorMessages.UNKNOWN_NETWORK,
      severity: 'warning',
    })
  }

  return issues
}

/**
 * Validate asset field on a single accepts entry.
 *
 * Checks if the asset is known for the given network. Only checks
 * when both network and asset are present and network is valid.
 *
 * @param entry - Accepts entry to validate
 * @param fieldPath - Dot-notation path for issue reporting (e.g. "accepts[0]")
 * @returns Array of validation issues
 */
export function validateAsset(entry: AcceptsEntry, fieldPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Missing field already caught by validateFields
  if (!entry.asset) {
    return issues
  }

  // Only check known assets when the network is valid CAIP-2
  if (entry.network && isValidCaip2(entry.network) && !isKnownAsset(entry.network, entry.asset)) {
    issues.push({
      code: ErrorCode.UNKNOWN_ASSET,
      field: `${fieldPath}.asset`,
      message: ErrorMessages.UNKNOWN_ASSET,
      severity: 'warning',
    })
  }

  return issues
}

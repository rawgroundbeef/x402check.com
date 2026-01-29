/**
 * Level 3: Required field validation
 * Validates accepts array, required entry fields, and resource
 */

import type { AcceptsEntry, NormalizedConfig, ConfigFormat, ValidationIssue } from '../../types'
import { ErrorCode, ErrorMessages } from '../../types/errors'

/**
 * Validate required fields on a single accepts entry.
 *
 * @param entry - Accepts entry to validate
 * @param fieldPath - Dot-notation path for issue reporting (e.g. "accepts[0]")
 * @returns Array of validation issues
 */
export function validateFields(entry: AcceptsEntry, fieldPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!entry.scheme) {
    issues.push({
      code: ErrorCode.MISSING_SCHEME,
      field: `${fieldPath}.scheme`,
      message: ErrorMessages.MISSING_SCHEME,
      severity: 'error',
    })
  }

  if (!entry.network) {
    issues.push({
      code: ErrorCode.MISSING_NETWORK,
      field: `${fieldPath}.network`,
      message: ErrorMessages.MISSING_NETWORK,
      severity: 'error',
    })
  }

  if (!entry.amount) {
    issues.push({
      code: ErrorCode.MISSING_AMOUNT,
      field: `${fieldPath}.amount`,
      message: ErrorMessages.MISSING_AMOUNT,
      severity: 'error',
    })
  }

  if (!entry.asset) {
    issues.push({
      code: ErrorCode.MISSING_ASSET,
      field: `${fieldPath}.asset`,
      message: ErrorMessages.MISSING_ASSET,
      severity: 'error',
    })
  }

  if (!entry.payTo) {
    issues.push({
      code: ErrorCode.MISSING_PAY_TO,
      field: `${fieldPath}.payTo`,
      message: ErrorMessages.MISSING_PAY_TO,
      severity: 'error',
    })
  }

  return issues
}

/**
 * Validate the accepts array itself (presence, type, emptiness).
 *
 * @param config - Normalized config
 * @returns Array of validation issues
 */
export function validateAccepts(config: NormalizedConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!Array.isArray(config.accepts)) {
    issues.push({
      code: ErrorCode.INVALID_ACCEPTS,
      field: 'accepts',
      message: ErrorMessages.INVALID_ACCEPTS,
      severity: 'error',
    })
    return issues
  }

  if (config.accepts.length === 0) {
    issues.push({
      code: ErrorCode.EMPTY_ACCEPTS,
      field: 'accepts',
      message: ErrorMessages.EMPTY_ACCEPTS,
      severity: 'error',
    })
  }

  return issues
}

/**
 * Validate resource object on normalized config.
 *
 * For v2 configs, resource is expected. Its absence is a warning, not an error,
 * since some v2 configs work without it.
 *
 * Also validates URL format via new URL() constructor (RULE-04).
 *
 * @param config - Normalized config
 * @param detectedFormat - Detected format
 * @returns Array of validation issues
 */
export function validateResource(
  config: NormalizedConfig,
  detectedFormat: ConfigFormat,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!config.resource) {
    if (detectedFormat === 'v2') {
      issues.push({
        code: ErrorCode.MISSING_RESOURCE,
        field: 'resource',
        message: ErrorMessages.MISSING_RESOURCE,
        severity: 'warning',
      })
    }
    return issues
  }

  if (!config.resource.url) {
    issues.push({
      code: ErrorCode.MISSING_RESOURCE,
      field: 'resource.url',
      message: ErrorMessages.MISSING_RESOURCE,
      severity: 'warning',
    })
    return issues
  }

  // URL format validation (RULE-04): advisory check via new URL() constructor
  try {
    new URL(config.resource.url)
  } catch {
    issues.push({
      code: ErrorCode.INVALID_URL,
      field: 'resource.url',
      message: 'resource.url is not a valid URL format',
      severity: 'warning',
    })
  }

  return issues
}

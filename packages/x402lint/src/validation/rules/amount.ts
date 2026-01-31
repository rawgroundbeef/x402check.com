/**
 * Level 4: Amount and timeout validation
 * Validates numeric string amounts and timeout values
 */

import type { AcceptsEntry, ConfigFormat, ValidationIssue } from '../../types'
import { ErrorCode, ErrorMessages } from '../../types/errors'

/**
 * Validate amount field on a single accepts entry.
 *
 * Amount must be a digit-only string (no decimals, signs, or scientific notation)
 * and must be greater than zero.
 *
 * @param entry - Accepts entry to validate
 * @param fieldPath - Dot-notation path for issue reporting (e.g. "accepts[0]")
 * @returns Array of validation issues
 */
export function validateAmount(entry: AcceptsEntry, fieldPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Missing field already caught by validateFields
  if (!entry.amount) {
    return issues
  }

  // Amount must be digits only (atomic units)
  if (!/^\d+$/.test(entry.amount)) {
    issues.push({
      code: ErrorCode.INVALID_AMOUNT,
      field: `${fieldPath}.amount`,
      message: ErrorMessages.INVALID_AMOUNT,
      severity: 'error',
    })
    return issues
  }

  // Zero amount check
  if (entry.amount === '0') {
    issues.push({
      code: ErrorCode.ZERO_AMOUNT,
      field: `${fieldPath}.amount`,
      message: ErrorMessages.ZERO_AMOUNT,
      severity: 'error',
    })
  }

  return issues
}

/**
 * Validate maxTimeoutSeconds on a single accepts entry.
 *
 * For v2 format, missing timeout produces a warning.
 * When present, timeout must be a positive integer (RULE-10).
 *
 * @param entry - Accepts entry to validate
 * @param fieldPath - Dot-notation path for issue reporting (e.g. "accepts[0]")
 * @param detectedFormat - Detected config format
 * @returns Array of validation issues
 */
export function validateTimeout(
  entry: AcceptsEntry,
  fieldPath: string,
  detectedFormat: ConfigFormat,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (entry.maxTimeoutSeconds === undefined) {
    if (detectedFormat === 'v2') {
      issues.push({
        code: ErrorCode.MISSING_MAX_TIMEOUT,
        field: `${fieldPath}.maxTimeoutSeconds`,
        message: ErrorMessages.MISSING_MAX_TIMEOUT,
        severity: 'warning',
      })
    }
    return issues
  }

  // Timeout value validation (RULE-10): must be a positive integer
  if (typeof entry.maxTimeoutSeconds !== 'number') {
    issues.push({
      code: ErrorCode.INVALID_TIMEOUT,
      field: `${fieldPath}.maxTimeoutSeconds`,
      message: ErrorMessages.INVALID_TIMEOUT,
      severity: 'error',
    })
    return issues
  }

  if (!Number.isInteger(entry.maxTimeoutSeconds)) {
    issues.push({
      code: ErrorCode.INVALID_TIMEOUT,
      field: `${fieldPath}.maxTimeoutSeconds`,
      message: ErrorMessages.INVALID_TIMEOUT,
      severity: 'error',
    })
    return issues
  }

  if (entry.maxTimeoutSeconds <= 0) {
    issues.push({
      code: ErrorCode.INVALID_TIMEOUT,
      field: `${fieldPath}.maxTimeoutSeconds`,
      message: ErrorMessages.INVALID_TIMEOUT,
      severity: 'error',
    })
  }

  return issues
}

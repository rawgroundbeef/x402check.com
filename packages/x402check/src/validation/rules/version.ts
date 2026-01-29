/**
 * Level 2: Version validation
 * Validates x402Version presence and value
 */

import type { NormalizedConfig, ConfigFormat, ValidationIssue } from '../../types'
import { ErrorCode, ErrorMessages } from '../../types/errors'

/**
 * Validate x402Version field.
 *
 * Since normalize() always sets x402Version: 2, this mainly validates
 * the original format's version field. If somehow the value isn't 1 or 2,
 * push INVALID_VERSION error.
 *
 * Note: No MISSING_VERSION check needed here because normalize() always
 * sets it. The orchestrator handles version-related warnings for legacy
 * formats via the legacy rule module.
 *
 * @param config - Normalized config
 * @param _detectedFormat - Detected format (reserved for future use)
 * @returns Array of validation issues
 */
export function validateVersion(
  config: NormalizedConfig,
  _detectedFormat: ConfigFormat,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Cast to number for runtime safety: NormalizedConfig types x402Version as literal 2,
  // but at runtime the value could be anything if the input was malformed.
  const version = config.x402Version as number
  if (version !== 1 && version !== 2) {
    issues.push({
      code: ErrorCode.INVALID_VERSION,
      field: 'x402Version',
      message: ErrorMessages.INVALID_VERSION,
      severity: 'error',
    })
  }

  return issues
}

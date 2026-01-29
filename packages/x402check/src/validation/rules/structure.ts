/**
 * Level 1: Structure validation
 * Validates JSON parse, object check, and format detection
 */

import type { ConfigFormat, ValidationIssue } from '../../types'
import { parseInput } from '../../types'
import { ErrorCode, ErrorMessages } from '../../types/errors'
import { isRecord } from '../../detection/guards'
import { detect } from '../../detection/detect'

/**
 * Enriched result from structure validation.
 * The orchestrator needs the parsed object and detected format
 * in addition to any issues found.
 */
export interface StructureResult {
  parsed: object | null
  format: ConfigFormat
  issues: ValidationIssue[]
}

/**
 * Validate input structure: parse JSON, check object, detect format.
 *
 * @param input - Raw JSON string or object
 * @returns StructureResult with parsed object, detected format, and issues
 */
export function validateStructure(input: string | object): StructureResult {
  const issues: ValidationIssue[] = []

  // Step 1: Parse input
  const { parsed, error } = parseInput(input)

  if (error) {
    return { parsed: null, format: 'unknown', issues: [error] }
  }

  // Step 2: Check parsed value is a non-null, non-array object
  if (!isRecord(parsed)) {
    issues.push({
      code: ErrorCode.NOT_OBJECT,
      field: '$',
      message: ErrorMessages.NOT_OBJECT,
      severity: 'error',
    })
    return { parsed: null, format: 'unknown', issues }
  }

  // Step 3: Detect format
  const format = detect(parsed as object)

  if (format === 'unknown') {
    issues.push({
      code: ErrorCode.UNKNOWN_FORMAT,
      field: '$',
      message: ErrorMessages.UNKNOWN_FORMAT,
      severity: 'error',
    })
  }

  return { parsed: parsed as object, format, issues }
}

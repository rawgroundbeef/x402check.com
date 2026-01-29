/**
 * Format detection function
 * API-02: Detect config format from input
 */

import type { ConfigFormat } from '../types'
import { parseInput } from '../types'
import { isV2Config, isV1Config, isFlatLegacyConfig } from './guards'

/**
 * Detect the format of an x402 config
 *
 * @param input - JSON string or parsed object
 * @returns ConfigFormat literal: 'v2' | 'v1' | 'flat-legacy' | 'unknown'
 *
 * Detection order (most specific to least specific):
 * 1. v2: accepts array + x402Version: 2
 * 2. v1: accepts array + x402Version: 1
 * 3. flat-legacy: payment fields without accepts array
 * 4. unknown: anything else
 */
export function detect(input: string | object): ConfigFormat {
  const { parsed, error } = parseInput(input)

  if (error) return 'unknown'

  if (isV2Config(parsed)) return 'v2'
  if (isV1Config(parsed)) return 'v1'
  if (isFlatLegacyConfig(parsed)) return 'flat-legacy'

  return 'unknown'
}

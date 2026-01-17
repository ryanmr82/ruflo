/**
 * @claude-flow/attention
 *
 * WASM-accelerated attention mechanisms library for Claude Flow V3.
 * Supports 39 attention types with automatic backend selection.
 *
 * @example
 * ```typescript
 * import { createAttentionService, AttentionService } from '@claude-flow/attention';
 *
 * // Quick start with defaults
 * const attention = await createAttentionService();
 * const output = await attention.forward({
 *   query: new Float32Array([...]),
 *   key: new Float32Array([...]),
 *   value: new Float32Array([...]),
 * });
 *
 * // With custom configuration
 * const service = new AttentionService({
 *   backend: 'auto',
 *   defaultMechanism: 'flash-attention-v2',
 *   fallbackMechanism: 'linear-attention',
 *   longSequenceThreshold: 8192,
 * });
 * await service.initialize();
 * ```
 */

// Core service
export {
  AttentionService,
  createAttentionService,
} from './services/attention-service.js';

// Registry
export {
  MechanismRegistry,
  registry,
  MECHANISM_METADATA,
  type MechanismMetadata,
} from './mechanisms/registry.js';

// WASM bridge
export {
  WASMBridge,
  loadWASM,
  isWASMAvailable,
  isSIMDAvailable,
  getWASMInstance,
  resetWASM,
} from './wasm/index.js';

// Types
export type {
  // Mechanism types
  AttentionMechanismType,
  AttentionCategory,
  AttentionBackend,
  AttentionPrecision,
  // Configuration types
  AttentionBaseConfig,
  SparseAttentionConfig,
  LinearAttentionConfig,
  FlashAttentionConfig,
  MoEAttentionConfig,
  HyperbolicAttentionConfig,
  GraphAttentionConfig,
  AttentionConfig,
  // I/O types
  AttentionInput,
  AttentionOutput,
  AttentionMetadata,
  // Service types
  AttentionServiceOptions,
  BenchmarkResult,
  BenchmarkComparison,
  // Mechanism interface
  IAttentionMechanism,
  RegistryEntry,
  MechanismSelector,
  // WASM types
  RuVectorWASM,
  WASMInitOptions,
} from './types.js';

// Utility functions

/**
 * Get all available attention mechanism types
 */
export function listMechanismTypes(): string[] {
  return registry.list().map((m) => m.type);
}

/**
 * Get mechanisms by category
 */
export function getMechanismsByCategory(category: string): string[] {
  return registry
    .byCategory(category as any)
    .map((m) => m.type);
}

/**
 * Check if a mechanism supports WASM acceleration
 */
export function isWASMSupported(mechanism: string): boolean {
  const meta = registry.get(mechanism as any);
  return meta?.wasmAvailable ?? false;
}

/**
 * Get the recommended mechanism for a sequence length
 */
export function recommendMechanism(sequenceLength: number): string {
  return registry.select(sequenceLength, 1);
}

/**
 * Version information
 */
export const VERSION = '3.0.0-alpha.1';

/**
 * Feature flags
 */
export const FEATURES = {
  wasmAcceleration: true,
  simdSupport: true,
  flashAttention: true,
  linearAttention: true,
  moeAttention: true,
  hyperbolicDistance: true,
  hnswSearch: true,
  benchmarking: true,
  caching: true,
} as const;

/**
 * @claude-flow/attention - Mechanism Registry
 *
 * Central registry for all 39 attention mechanism implementations
 * with metadata and WASM availability tracking.
 */

import type {
  AttentionMechanismType,
  AttentionCategory,
  AttentionBackend,
  IAttentionMechanism,
  RegistryEntry,
  MechanismSelector,
} from '../types.js';

/**
 * Mechanism metadata for registry
 */
export interface MechanismMetadata {
  type: AttentionMechanismType;
  name: string;
  description: string;
  category: AttentionCategory;
  complexity: string;
  supportedBackends: AttentionBackend[];
  memoryEfficient: boolean;
  longSequenceSupport: boolean;
  wasmAvailable: boolean;
}

/**
 * Complete metadata for all 39 attention mechanisms
 */
export const MECHANISM_METADATA: Record<AttentionMechanismType, MechanismMetadata> = {
  // Multi-Head Attention (7 types)
  'standard-mha': {
    type: 'standard-mha',
    name: 'Standard Multi-Head Attention',
    description: 'Classic multi-head attention from "Attention Is All You Need"',
    category: 'multi-head',
    complexity: 'O(n²d)',
    supportedBackends: ['wasm', 'typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: true,
  },
  'rotary-mha': {
    type: 'rotary-mha',
    name: 'Rotary Position Embedding MHA',
    description: 'RoPE-enhanced attention for better position encoding',
    category: 'multi-head',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'alibi-mha': {
    type: 'alibi-mha',
    name: 'ALiBi Attention',
    description: 'Attention with Linear Biases for length extrapolation',
    category: 'multi-head',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'grouped-query-attention': {
    type: 'grouped-query-attention',
    name: 'Grouped Query Attention',
    description: 'GQA with shared key-value heads for efficiency',
    category: 'multi-head',
    complexity: 'O(n²d/g)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'multi-query-attention': {
    type: 'multi-query-attention',
    name: 'Multi-Query Attention',
    description: 'Single key-value head shared across all queries',
    category: 'multi-head',
    complexity: 'O(n²d/h)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'differential-attention': {
    type: 'differential-attention',
    name: 'Differential Attention',
    description: 'Attention with differential computation for noise reduction',
    category: 'multi-head',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'mixture-attention': {
    type: 'mixture-attention',
    name: 'Mixture Attention',
    description: 'Mixture of attention patterns with learned weights',
    category: 'multi-head',
    complexity: 'O(kn²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },

  // Self-Attention Variants (6 types)
  'causal-self-attention': {
    type: 'causal-self-attention',
    name: 'Causal Self-Attention',
    description: 'Autoregressive attention with causal masking',
    category: 'self-attention',
    complexity: 'O(n²d)',
    supportedBackends: ['wasm', 'typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: true,
  },
  'bidirectional-self-attention': {
    type: 'bidirectional-self-attention',
    name: 'Bidirectional Self-Attention',
    description: 'Full bidirectional attention without masking',
    category: 'self-attention',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'relative-position-attention': {
    type: 'relative-position-attention',
    name: 'Relative Position Attention',
    description: 'Attention with relative position representations',
    category: 'self-attention',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'disentangled-attention': {
    type: 'disentangled-attention',
    name: 'Disentangled Attention',
    description: 'DeBERTa-style disentangled content and position attention',
    category: 'self-attention',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'talking-heads-attention': {
    type: 'talking-heads-attention',
    name: 'Talking Heads Attention',
    description: 'Linear projections across attention heads',
    category: 'self-attention',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'synthesizer-attention': {
    type: 'synthesizer-attention',
    name: 'Synthesizer Attention',
    description: 'Learned attention patterns without query-key dot product',
    category: 'self-attention',
    complexity: 'O(nd)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },

  // Cross-Attention (5 types)
  'cross-attention': {
    type: 'cross-attention',
    name: 'Cross-Attention',
    description: 'Standard cross-attention between two sequences',
    category: 'cross-attention',
    complexity: 'O(nmd)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'perceiver-attention': {
    type: 'perceiver-attention',
    name: 'Perceiver Cross-Attention',
    description: 'Asymmetric attention with learned latent array',
    category: 'cross-attention',
    complexity: 'O(lnd)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'gated-cross-attention': {
    type: 'gated-cross-attention',
    name: 'Gated Cross-Attention',
    description: 'Cross-attention with learned gating mechanism',
    category: 'cross-attention',
    complexity: 'O(nmd)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'memory-attention': {
    type: 'memory-attention',
    name: 'Memory Attention',
    description: 'Attention to external memory bank',
    category: 'cross-attention',
    complexity: 'O(nmd)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'hierarchical-cross-attention': {
    type: 'hierarchical-cross-attention',
    name: 'Hierarchical Cross-Attention',
    description: 'Multi-level cross-attention for hierarchical data',
    category: 'cross-attention',
    complexity: 'O(nmd)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },

  // Sparse Attention (8 types)
  'bigbird-attention': {
    type: 'bigbird-attention',
    name: 'BigBird Attention',
    description: 'Sparse attention with global, local, and random patterns',
    category: 'sparse',
    complexity: 'O(n√n)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'longformer-attention': {
    type: 'longformer-attention',
    name: 'Longformer Attention',
    description: 'Sliding window attention with global tokens',
    category: 'sparse',
    complexity: 'O(nw)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'local-attention': {
    type: 'local-attention',
    name: 'Local Attention',
    description: 'Fixed-size local attention window',
    category: 'sparse',
    complexity: 'O(nw)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'strided-attention': {
    type: 'strided-attention',
    name: 'Strided Attention',
    description: 'Sparse attention with strided patterns',
    category: 'sparse',
    complexity: 'O(n√n)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'sparse-transformer-attention': {
    type: 'sparse-transformer-attention',
    name: 'Sparse Transformer Attention',
    description: 'Fixed sparse attention patterns',
    category: 'sparse',
    complexity: 'O(n√n)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'star-attention': {
    type: 'star-attention',
    name: 'Star Attention',
    description: 'Hub-and-spoke sparse pattern',
    category: 'sparse',
    complexity: 'O(n)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'blockwise-attention': {
    type: 'blockwise-attention',
    name: 'Blockwise Attention',
    description: 'Block-diagonal sparse attention',
    category: 'sparse',
    complexity: 'O(nb²)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'random-attention': {
    type: 'random-attention',
    name: 'Random Attention',
    description: 'Randomly sampled attention positions',
    category: 'sparse',
    complexity: 'O(nr)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },

  // Linear Attention (6 types)
  'linear-attention': {
    type: 'linear-attention',
    name: 'Linear Attention',
    description: 'O(n) attention using kernel feature maps',
    category: 'linear',
    complexity: 'O(nd²)',
    supportedBackends: ['wasm', 'typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: true,
  },
  'performer-attention': {
    type: 'performer-attention',
    name: 'Performer (FAVOR+)',
    description: 'Fast attention via orthogonal random features',
    category: 'linear',
    complexity: 'O(ndr)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'cosformer-attention': {
    type: 'cosformer-attention',
    name: 'CosFormer Attention',
    description: 'Linear attention with cosine reweighting',
    category: 'linear',
    complexity: 'O(nd)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'rfa-attention': {
    type: 'rfa-attention',
    name: 'Random Feature Attention',
    description: 'Attention approximation via random features',
    category: 'linear',
    complexity: 'O(ndr)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'nystrom-attention': {
    type: 'nystrom-attention',
    name: 'Nyström Attention',
    description: 'Low-rank approximation via Nyström method',
    category: 'linear',
    complexity: 'O(nm)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },
  'linformer-attention': {
    type: 'linformer-attention',
    name: 'Linformer Attention',
    description: 'Self-attention with linear complexity via projection',
    category: 'linear',
    complexity: 'O(nk)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },

  // Flash Attention (3 types)
  'flash-attention-v2': {
    type: 'flash-attention-v2',
    name: 'Flash Attention v2',
    description: 'IO-aware exact attention with tiling',
    category: 'flash',
    complexity: 'O(n²d)',
    supportedBackends: ['wasm', 'typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: true,
  },
  'flash-attention-v3': {
    type: 'flash-attention-v3',
    name: 'Flash Attention v3',
    description: 'Latest Flash Attention with improved parallelism',
    category: 'flash',
    complexity: 'O(n²d)',
    supportedBackends: ['wasm', 'typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: true,
  },
  'flash-decoding': {
    type: 'flash-decoding',
    name: 'Flash Decoding',
    description: 'Optimized Flash Attention for inference decoding',
    category: 'flash',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: true,
    wasmAvailable: false,
  },

  // Mixture of Experts (4 types)
  'moe-attention': {
    type: 'moe-attention',
    name: 'MoE Attention',
    description: 'Mixture of Experts attention with routing',
    category: 'moe',
    complexity: 'O(kn²d/e)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'soft-moe-attention': {
    type: 'soft-moe-attention',
    name: 'Soft MoE Attention',
    description: 'Fully differentiable soft routing MoE',
    category: 'moe',
    complexity: 'O(n²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: false,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'switch-attention': {
    type: 'switch-attention',
    name: 'Switch Attention',
    description: 'Switch Transformer style sparse MoE',
    category: 'moe',
    complexity: 'O(n²d/e)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
  'expert-choice-attention': {
    type: 'expert-choice-attention',
    name: 'Expert Choice Attention',
    description: 'Expert-choice routing for better load balance',
    category: 'moe',
    complexity: 'O(cn²d)',
    supportedBackends: ['typescript'],
    memoryEfficient: true,
    longSequenceSupport: false,
    wasmAvailable: false,
  },
};

/**
 * Attention mechanism registry
 */
export class MechanismRegistry {
  private mechanisms = new Map<AttentionMechanismType, MechanismMetadata>();

  constructor() {
    // Initialize with all mechanisms
    for (const [type, metadata] of Object.entries(MECHANISM_METADATA)) {
      this.mechanisms.set(type as AttentionMechanismType, metadata);
    }
  }

  /**
   * Get metadata for a mechanism
   */
  get(type: AttentionMechanismType): MechanismMetadata | undefined {
    return this.mechanisms.get(type);
  }

  /**
   * List all mechanisms
   */
  list(): MechanismMetadata[] {
    return Array.from(this.mechanisms.values());
  }

  /**
   * Filter mechanisms by category
   */
  byCategory(category: AttentionCategory): MechanismMetadata[] {
    return this.list().filter((m) => m.category === category);
  }

  /**
   * Get mechanisms with WASM support
   */
  wasmEnabled(): MechanismMetadata[] {
    return this.list().filter((m) => m.wasmAvailable);
  }

  /**
   * Get memory-efficient mechanisms
   */
  memoryEfficient(): MechanismMetadata[] {
    return this.list().filter((m) => m.memoryEfficient);
  }

  /**
   * Get mechanisms for long sequences
   */
  longSequence(): MechanismMetadata[] {
    return this.list().filter((m) => m.longSequenceSupport);
  }

  /**
   * Get categories with counts
   */
  categories(): Map<AttentionCategory, number> {
    const counts = new Map<AttentionCategory, number>();
    for (const m of this.list()) {
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Auto-select mechanism based on requirements
   */
  select: MechanismSelector = (sequenceLength, batchSize, config) => {
    // Very long sequences (>8192) - use linear
    if (sequenceLength > 8192) {
      return 'linear-attention';
    }

    // Long sequences (>2048) - use flash or sparse
    if (sequenceLength > 2048) {
      return 'flash-attention-v2';
    }

    // Medium sequences - flash is optimal
    if (sequenceLength > 512) {
      return 'flash-attention-v2';
    }

    // Short sequences - standard is fine
    return 'standard-mha';
  };
}

/** Global registry instance */
export const registry = new MechanismRegistry();

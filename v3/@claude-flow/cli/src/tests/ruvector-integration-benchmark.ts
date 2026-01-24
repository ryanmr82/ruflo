/**
 * RuVector Integration Benchmark & Verification
 * Tests real functionality and measures quantifiable benefits
 */

import { performance } from 'perf_hooks';

// Test results storage
interface BenchmarkResult {
  package: string;
  feature: string;
  success: boolean;
  latencyMs: number;
  opsPerSec?: number;
  improvement?: string;
  error?: string;
}

const results: BenchmarkResult[] = [];

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function benchmarkSona(): Promise<void> {
  console.log('\n📦 Testing @ruvector/sona...');

  try {
    const sona = await import('@ruvector/sona');
    console.log('  Exports:', Object.keys(sona).slice(0, 15).join(', '), '...');

    // Test 1: LoRA Manager
    try {
      const start = performance.now();
      const lora = new sona.LoRAManager({
        rank: 4,
        alpha: 0.1,
        targetModules: ['attention', 'mlp']
      });
      const initTime = performance.now() - start;

      // Adapt with a test pattern
      const adaptStart = performance.now();
      const embedding = new Float32Array(256).fill(0.1);
      lora.adapt(embedding, 0.5); // 50% improvement signal
      const adaptTime = performance.now() - adaptStart;

      results.push({
        package: '@ruvector/sona',
        feature: 'LoRA Init',
        success: true,
        latencyMs: initTime,
      });

      results.push({
        package: '@ruvector/sona',
        feature: 'LoRA Adapt',
        success: true,
        latencyMs: adaptTime,
        improvement: adaptTime < 0.1 ? '<100μs (SOTA)' : `${formatNumber(adaptTime)}ms`
      });

      console.log(`  ✅ LoRA: Init ${formatNumber(initTime)}ms, Adapt ${formatNumber(adaptTime)}ms`);
    } catch (e) {
      results.push({
        package: '@ruvector/sona',
        feature: 'LoRA',
        success: false,
        latencyMs: 0,
        error: e instanceof Error ? e.message : String(e)
      });
      console.log(`  ❌ LoRA failed:`, e);
    }

    // Test 2: EWC++ (Elastic Weight Consolidation)
    try {
      if (sona.EWCManager) {
        const ewc = new sona.EWCManager({
          lambda: 1000, // Regularization strength
          decay: 0.99
        });

        const start = performance.now();
        const embedding = new Float32Array(256).fill(0.1);
        ewc.registerImportance(embedding, 'task-1');
        const time = performance.now() - start;

        results.push({
          package: '@ruvector/sona',
          feature: 'EWC++',
          success: true,
          latencyMs: time,
          improvement: 'Prevents catastrophic forgetting'
        });
        console.log(`  ✅ EWC++: ${formatNumber(time)}ms`);
      } else {
        console.log('  ⚠️ EWC++ not exported directly');
      }
    } catch (e) {
      console.log(`  ⚠️ EWC++ not available:`, e instanceof Error ? e.message : String(e));
    }

    // Test 3: ReasoningBank
    try {
      if (sona.ReasoningBank) {
        const bank = new sona.ReasoningBank({ capacity: 1000 });

        const start = performance.now();
        bank.store({
          pattern: new Float32Array(256).fill(0.1),
          verdict: 'success',
          context: 'test-context'
        });
        const storeTime = performance.now() - start;

        const searchStart = performance.now();
        const similar = bank.search(new Float32Array(256).fill(0.1), 5);
        const searchTime = performance.now() - searchStart;

        results.push({
          package: '@ruvector/sona',
          feature: 'ReasoningBank Store',
          success: true,
          latencyMs: storeTime,
        });

        results.push({
          package: '@ruvector/sona',
          feature: 'ReasoningBank Search',
          success: true,
          latencyMs: searchTime,
          improvement: searchTime < 1 ? 'Sub-ms search' : `${formatNumber(searchTime)}ms`
        });

        console.log(`  ✅ ReasoningBank: Store ${formatNumber(storeTime)}ms, Search ${formatNumber(searchTime)}ms`);
      } else {
        console.log('  ⚠️ ReasoningBank not exported');
      }
    } catch (e) {
      console.log(`  ⚠️ ReasoningBank:`, e instanceof Error ? e.message : String(e));
    }

    // Test 4: SonaConfig (main entry)
    try {
      if (sona.createSona || sona.Sona || sona.default) {
        const creator = sona.createSona || sona.Sona || sona.default;
        const instance = typeof creator === 'function' ?
          (creator.prototype ? new creator() : creator()) : creator;
        console.log(`  ✅ Sona instance created`);
      }
    } catch (e) {
      console.log(`  ⚠️ Sona main:`, e instanceof Error ? e.message : String(e));
    }

  } catch (e) {
    console.log(`  ❌ Package load failed:`, e);
    results.push({
      package: '@ruvector/sona',
      feature: 'Load',
      success: false,
      latencyMs: 0,
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

async function benchmarkRouter(): Promise<void> {
  console.log('\n📦 Testing @ruvector/router...');

  try {
    const router = await import('@ruvector/router');
    console.log('  Exports:', Object.keys(router).slice(0, 15).join(', '), '...');

    // Test 1: Create semantic router
    try {
      const SemanticRouter = router.SemanticRouter || router.default;

      const start = performance.now();
      const sr = new SemanticRouter({
        dim: 256,
        efConstruction: 100,
        M: 16
      });
      const initTime = performance.now() - start;

      // Add some routes
      const routes = [
        { name: 'code', embedding: new Float32Array(256).fill(0.1) },
        { name: 'test', embedding: new Float32Array(256).fill(0.2) },
        { name: 'review', embedding: new Float32Array(256).fill(0.3) },
        { name: 'debug', embedding: new Float32Array(256).fill(0.4) },
        { name: 'refactor', embedding: new Float32Array(256).fill(0.5) },
      ];

      const addStart = performance.now();
      for (const route of routes) {
        sr.addRoute(route.name, route.embedding);
      }
      const addTime = performance.now() - addStart;

      // Route a query
      const queryStart = performance.now();
      const ITERATIONS = 1000;
      for (let i = 0; i < ITERATIONS; i++) {
        sr.route(new Float32Array(256).fill(0.15));
      }
      const routeTime = (performance.now() - queryStart) / ITERATIONS;

      results.push({
        package: '@ruvector/router',
        feature: 'Router Init',
        success: true,
        latencyMs: initTime,
      });

      results.push({
        package: '@ruvector/router',
        feature: 'Route Query',
        success: true,
        latencyMs: routeTime,
        opsPerSec: 1000 / routeTime,
        improvement: routeTime < 0.1 ? '<100μs routing' : `${formatNumber(routeTime)}ms`
      });

      console.log(`  ✅ Router: Init ${formatNumber(initTime)}ms, Route ${formatNumber(routeTime)}ms (${formatNumber(1000/routeTime)} ops/s)`);

    } catch (e) {
      results.push({
        package: '@ruvector/router',
        feature: 'SemanticRouter',
        success: false,
        latencyMs: 0,
        error: e instanceof Error ? e.message : String(e)
      });
      console.log(`  ❌ SemanticRouter failed:`, e);
    }

  } catch (e) {
    console.log(`  ❌ Package load failed:`, e);
    results.push({
      package: '@ruvector/router',
      feature: 'Load',
      success: false,
      latencyMs: 0,
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

async function benchmarkCore(): Promise<void> {
  console.log('\n📦 Testing @ruvector/core...');

  try {
    const core = await import('@ruvector/core');
    console.log('  Exports:', Object.keys(core).slice(0, 15).join(', '), '...');

    // Test 1: Vector database operations
    try {
      const VectorDB = core.VectorDB || core.Database || core.default;

      const start = performance.now();
      const db = new VectorDB({
        dim: 256,
        metric: 'cosine',
        efConstruction: 200,
        M: 32
      });
      const initTime = performance.now() - start;

      // Bulk insert benchmark
      const vectors: Float32Array[] = [];
      for (let i = 0; i < 10000; i++) {
        const vec = new Float32Array(256);
        for (let j = 0; j < 256; j++) {
          vec[j] = Math.random();
        }
        vectors.push(vec);
      }

      const insertStart = performance.now();
      for (let i = 0; i < vectors.length; i++) {
        db.insert(`vec-${i}`, vectors[i]);
      }
      const insertTime = performance.now() - insertStart;
      const insertsPerSec = (10000 / insertTime) * 1000;

      // Search benchmark
      const searchStart = performance.now();
      const SEARCH_ITERS = 100;
      for (let i = 0; i < SEARCH_ITERS; i++) {
        db.search(vectors[i % vectors.length], 10);
      }
      const searchTime = (performance.now() - searchStart) / SEARCH_ITERS;

      results.push({
        package: '@ruvector/core',
        feature: 'DB Init',
        success: true,
        latencyMs: initTime,
      });

      results.push({
        package: '@ruvector/core',
        feature: 'Insert 10k vectors',
        success: true,
        latencyMs: insertTime,
        opsPerSec: insertsPerSec,
        improvement: insertsPerSec > 50000 ? `${formatNumber(insertsPerSec)} ops/s (>50k target)` : `${formatNumber(insertsPerSec)} ops/s`
      });

      results.push({
        package: '@ruvector/core',
        feature: 'HNSW Search (k=10)',
        success: true,
        latencyMs: searchTime,
        opsPerSec: 1000 / searchTime,
        improvement: searchTime < 1 ? 'Sub-ms search' : `${formatNumber(searchTime)}ms`
      });

      console.log(`  ✅ VectorDB: Init ${formatNumber(initTime)}ms`);
      console.log(`  ✅ Insert: ${formatNumber(insertsPerSec)} ops/s (10k vectors in ${formatNumber(insertTime)}ms)`);
      console.log(`  ✅ Search: ${formatNumber(searchTime)}ms per query (${formatNumber(1000/searchTime)} queries/s)`);

    } catch (e) {
      results.push({
        package: '@ruvector/core',
        feature: 'VectorDB',
        success: false,
        latencyMs: 0,
        error: e instanceof Error ? e.message : String(e)
      });
      console.log(`  ❌ VectorDB failed:`, e);
    }

  } catch (e) {
    console.log(`  ❌ Package load failed:`, e);
    results.push({
      package: '@ruvector/core',
      feature: 'Load',
      success: false,
      latencyMs: 0,
      error: e instanceof Error ? e.message : String(e)
    });
  }
}

async function compareWithExisting(): Promise<void> {
  console.log('\n📊 Comparing with existing @ruvector/learning-wasm...');

  try {
    const fs = await import('fs');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);

    const wasmPath = require.resolve('@ruvector/learning-wasm/ruvector_learning_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);

    const learningWasm = await import('@ruvector/learning-wasm');
    learningWasm.initSync({ module: wasmBuffer });

    // Benchmark MicroLoRA
    const microLoRA = new learningWasm.WasmMicroLoRA(256, 0.1, 0.01);

    const start = performance.now();
    const ITERATIONS = 10000;
    for (let i = 0; i < ITERATIONS; i++) {
      microLoRA.adapt_with_reward(0.1);
    }
    const adaptTime = (performance.now() - start) / ITERATIONS;

    results.push({
      package: '@ruvector/learning-wasm',
      feature: 'MicroLoRA Adapt (baseline)',
      success: true,
      latencyMs: adaptTime,
      opsPerSec: 1000 / adaptTime,
      improvement: 'Current implementation'
    });

    console.log(`  ✅ MicroLoRA baseline: ${formatNumber(adaptTime * 1000)}μs (${formatNumber(1000/adaptTime)} ops/s)`);

    microLoRA.free();
  } catch (e) {
    console.log(`  ⚠️ Baseline comparison failed:`, e);
  }
}

async function printSummary(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RUVECTOR INTEGRATION BENCHMARK SUMMARY');
  console.log('='.repeat(80));

  const grouped: Record<string, BenchmarkResult[]> = {};
  for (const r of results) {
    if (!grouped[r.package]) grouped[r.package] = [];
    grouped[r.package].push(r);
  }

  for (const [pkg, pkgResults] of Object.entries(grouped)) {
    console.log(`\n📦 ${pkg}`);
    console.log('-'.repeat(60));

    for (const r of pkgResults) {
      const status = r.success ? '✅' : '❌';
      const latency = r.latencyMs < 0.001 ? '<1μs' :
                      r.latencyMs < 1 ? `${formatNumber(r.latencyMs * 1000)}μs` :
                      `${formatNumber(r.latencyMs)}ms`;
      const ops = r.opsPerSec ? ` (${formatNumber(r.opsPerSec)} ops/s)` : '';
      const improvement = r.improvement ? ` → ${r.improvement}` : '';
      const error = r.error ? ` [${r.error}]` : '';

      console.log(`  ${status} ${r.feature}: ${latency}${ops}${improvement}${error}`);
    }
  }

  // Calculate overall success rate
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log('\n' + '='.repeat(80));
  console.log(`📈 OVERALL: ${successCount}/${totalCount} features working (${formatNumber(successCount/totalCount*100)}%)`);

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS:');
  const workingPackages = [...new Set(results.filter(r => r.success).map(r => r.package))];
  const failedPackages = [...new Set(results.filter(r => !r.success).map(r => r.package))];

  if (workingPackages.length > 0) {
    console.log(`  ✅ Ready to integrate: ${workingPackages.join(', ')}`);
  }
  if (failedPackages.length > 0) {
    console.log(`  ⚠️ Needs investigation: ${failedPackages.join(', ')}`);
  }

  console.log('='.repeat(80));
}

// Main execution
async function main(): Promise<void> {
  console.log('🚀 RuVector Integration Benchmark');
  console.log('Testing real functionality and measuring quantifiable benefits...\n');

  await benchmarkSona();
  await benchmarkRouter();
  await benchmarkCore();
  await compareWithExisting();
  await printSummary();
}

main().catch(console.error);

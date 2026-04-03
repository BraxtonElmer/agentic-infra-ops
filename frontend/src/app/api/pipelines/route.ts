import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    pipelines: [
      { id: 'p1', repo: 'axiom-api', branch: 'main', triggeredBy: 'push', status: 'fail', error: 'ENOMEM', duration: null, timestamp: '2026-04-03T14:20:00Z', log: 'Step 4/8: RUN npm run build\n> axiom-api@2.1.0 build\n> tsc && esbuild src/index.ts\n\nnode:internal/process: ENOMEM — JavaScript heap out of memory\n\nFATAL ERROR: Reached heap limit Allocation failed\nError: Process exited with code 134', diagnosis: { rootCause: 'Node.js heap memory exhaustion during TypeScript compilation', affectedFile: 'Dockerfile (memory limit: 2GB)', recommendation: 'Increase container memory limit to 4GB or add --max-old-space-size=4096 to NODE_OPTIONS' }, diff: { removed: 'ENV NODE_OPTIONS="--max-old-space-size=2048"', added: 'ENV NODE_OPTIONS="--max-old-space-size=4096"' } },
      { id: 'p2', repo: 'frontend-app', branch: 'feat/dashboard', triggeredBy: 'push', status: 'pass', error: null, duration: '2m 14s', timestamp: '2026-04-03T14:02:00Z', log: null, diagnosis: null, diff: null },
      { id: 'p3', repo: 'infra-deploy', branch: 'main', triggeredBy: 'schedule', status: 'fail', error: 'TF_LOCK', duration: null, timestamp: '2026-04-03T13:56:00Z', log: 'Initializing provider plugins...\nAcquiring state lock...\n\nError: Error acquiring the state lock\nLock Info:\n  ID:        a1b2c3d4-e5f6-7890\n  Path:      s3://tf-state/prod/terraform.tfstate\n  Operation: OperationTypeApply\n  Created:   2026-04-03 11:22:10 UTC\n\nTerraform acquires a state lock to protect the state from being\nwritten by multiple users at the same time.', diagnosis: { rootCause: 'Terraform state lock held by terminated CI job run-4821', affectedFile: 'terraform/main.tf', recommendation: 'Force-unlock state with lock ID a1b2c3d4-e5f6-7890. Safe to proceed — holding job was terminated.' }, diff: null },
      { id: 'p4', repo: 'ml-pipeline', branch: 'release/v2', triggeredBy: 'tag', status: 'fail', error: 'CUDA_OOS', duration: null, timestamp: '2026-04-03T13:49:00Z', log: 'Loading model weights...\nAllocating CUDA memory...\nRuntimeError: CUDA out of shared memory.\nTried to allocate 2.4 GiB. GPU 0 has a total capacity of 16 GiB.\n12.8 GiB is allocated by PyTorch.', diagnosis: { rootCause: 'GPU shared memory exhaustion during model loading', affectedFile: 'train.py (batch_size=64)', recommendation: 'Reduce batch_size from 64 to 32 or use gradient accumulation steps=2' }, diff: { removed: 'batch_size = 64', added: 'batch_size = 32\ngradient_accumulation_steps = 2' } },
      { id: 'p5', repo: 'auth-service', branch: 'main', triggeredBy: 'push', status: 'pass', error: null, duration: '1m 42s', timestamp: '2026-04-03T13:35:00Z', log: null, diagnosis: null, diff: null },
      { id: 'p6', repo: 'data-ingestion', branch: 'develop', triggeredBy: 'push', status: 'pass', error: null, duration: '3m 08s', timestamp: '2026-04-03T13:20:00Z', log: null, diagnosis: null, diff: null },
      { id: 'p7', repo: 'notification-svc', branch: 'main', triggeredBy: 'push', status: 'pass', error: null, duration: '58s', timestamp: '2026-04-03T12:55:00Z', log: null, diagnosis: null, diff: null },
      { id: 'p8', repo: 'search-indexer', branch: 'main', triggeredBy: 'schedule', status: 'running', error: null, duration: null, timestamp: '2026-04-03T14:30:00Z', log: null, diagnosis: null, diff: null },
    ],
    trend: [
      { day: 'Mon', pass: 12, fail: 2 },
      { day: 'Tue', pass: 15, fail: 1 },
      { day: 'Wed', pass: 10, fail: 4 },
      { day: 'Thu', pass: 14, fail: 3 },
      { day: 'Fri', pass: 18, fail: 1 },
      { day: 'Sat', pass: 8, fail: 0 },
      { day: 'Sun', pass: 11, fail: 3 },
    ],
    autoFixHistory: [
      { id: 'af1', title: 'fix: increase Node memory limit to 4GB', repo: 'axiom-api', status: 'open', timestamp: '2026-04-03T14:28:00Z' },
      { id: 'af2', title: 'fix: pin dependency version for build stability', repo: 'frontend-app', status: 'merged', timestamp: '2026-04-02T09:15:00Z' },
      { id: 'af3', title: 'fix: correct Terraform provider version constraint', repo: 'infra-deploy', status: 'merged', timestamp: '2026-04-01T16:42:00Z' },
      { id: 'af4', title: 'fix: reduce batch size to prevent CUDA OOM', repo: 'ml-pipeline', status: 'open', timestamp: '2026-04-03T13:52:00Z' },
      { id: 'af5', title: 'chore: update base image to fix CVE-2026-1234', repo: 'auth-service', status: 'closed', timestamp: '2026-03-30T14:10:00Z' },
    ],
  });
}

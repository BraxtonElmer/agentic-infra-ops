import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/overview`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

// ── Fallback mock (used only if backend is down) ──────────────────────────
function _mock() {
  return NextResponse.json({
    healthScore: 82,
    healthStatus: 'amber',
    monthlyWaste: '₹14,200',
    activeIncidents: 5,
    agentActionsToday: 23,
    alerts: [
      {
        id: 'a1',
        severity: 'critical',
        title: 'Node pool memory exhaustion',
        detail: 'prod-worker-03 RAM at 96% — OOMKill imminent. Agent recommends scaling horizontally.',
        resource: 'prod-worker-03',
      },
      {
        id: 'a2',
        severity: 'critical',
        title: 'Pipeline failure spike — 3 in 1h',
        detail: 'axiom-api, infra-deploy, ml-pipeline all failed in the last 60 minutes.',
        resource: 'CI/CD',
      },
      {
        id: 'a3',
        severity: 'warning',
        title: 'Idle GPU instance accumulating cost',
        detail: 'gpu-training-01 has been idle for 72h. Estimated waste ₹4,800/mo.',
        resource: 'gpu-training-01',
      },
    ],
    pipelines: [
      { id: 'p1', repo: 'axiom-api', branch: 'main', status: 'fail', error: 'ENOMEM', duration: null, time: '12m ago', insight: 'OOM during docker build — agent suggests increasing memory limit to 4GB.' },
      { id: 'p2', repo: 'frontend-app', branch: 'feat/dashboard', status: 'pass', error: null, duration: '2m 14s', time: '18m ago', insight: null },
      { id: 'p3', repo: 'infra-deploy', branch: 'main', status: 'fail', error: 'TF_LOCK', duration: null, time: '24m ago', insight: 'Terraform state lock not released. Agent can force-unlock safely.' },
      { id: 'p4', repo: 'ml-pipeline', branch: 'release/v2', status: 'fail', error: 'CUDA_OOS', duration: null, time: '31m ago', insight: 'CUDA out of shared memory. Recommend reducing batch size.' },
      { id: 'p5', repo: 'auth-service', branch: 'main', status: 'pass', error: null, duration: '1m 42s', time: '45m ago', insight: null },
      { id: 'p6', repo: 'data-ingestion', branch: 'develop', status: 'pass', error: null, duration: '3m 08s', time: '1h ago', insight: null },
    ],
    agentLog: [
      { id: 'l1', timestamp: '14:32:01', type: 'scan', target: 'prod-cluster', message: 'Completed infrastructure health scan. 2 critical issues found.' },
      { id: 'l2', timestamp: '14:28:45', type: 'fix', target: 'axiom-api', message: 'Generated fix PR for OOM error — increased memory limit in Dockerfile.' },
      { id: 'l3', timestamp: '14:22:10', type: 'diagnose', target: 'infra-deploy', message: 'Root cause: Terraform state lock held by terminated CI job run-4821.' },
      { id: 'l4', timestamp: '14:15:33', type: 'flag', target: 'gpu-training-01', message: 'Flagged idle GPU instance. No compute activity for 72 hours.' },
      { id: 'l5', timestamp: '14:10:02', type: 'scan', target: 'finops', message: 'Monthly cost scan complete. ₹14.2k in potential savings identified.' },
      { id: 'l6', timestamp: '14:05:18', type: 'recommend', target: 'staging-db', message: 'Recommend downgrading staging-db from db.r5.xlarge to db.r5.large — 40% cost reduction.' },
    ],
    servers: [
      { id: 's1', name: 'prod-worker-01', cpu: 62, ram: 71, disk: 45 },
      { id: 's2', name: 'prod-worker-02', cpu: 48, ram: 55, disk: 38 },
      { id: 's3', name: 'prod-worker-03', cpu: 88, ram: 96, disk: 72 },
    ],
    finops: {
      totalCost: '₹1,82,400',
      totalWaste: '₹14,200',
      services: [
        { name: 'Compute (EC2)', cost: 68400, waste: 4800, total: 68400 },
        { name: 'Database (RDS)', cost: 42600, waste: 3200, total: 42600 },
        { name: 'Storage (S3)', cost: 28200, waste: 2100, total: 28200 },
        { name: 'ML Training (GPU)', cost: 24800, waste: 4100, total: 24800 },
        { name: 'Networking', cost: 18400, waste: 0, total: 18400 },
      ],
      agentSavings: 'Agent identified ₹14.2k in monthly savings across 4 resources. Top recommendation: terminate idle GPU instance (₹4,800/mo).',
    },
  });
}

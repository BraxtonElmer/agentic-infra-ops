import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/alerts`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

function _mock() {
  return NextResponse.json({
    active: [
      { id: 'al1', severity: 'critical', title: 'Node pool memory exhaustion', resource: 'prod-worker-03', timestamp: '2026-04-03T14:32:00Z', assessment: 'RAM at 96%. Redis and axiom-api combined are consuming 77% of available memory. OOMKill is imminent if load increases.', recommendation: 'Scale horizontally by adding prod-worker-04, or vertically by upgrading to r5.4xlarge.' },
      { id: 'al2', severity: 'critical', title: 'Pipeline failure spike', resource: 'CI/CD', timestamp: '2026-04-03T14:20:00Z', assessment: '3 pipeline failures in 1 hour (37.5% failure rate). All failures have distinct root causes — no correlated infrastructure issue found.', recommendation: 'Address each failure individually. Agent has already generated fix PRs for 2 of 3 failures.' },
      { id: 'al3', severity: 'warning', title: 'Idle GPU instance', resource: 'gpu-training-01', timestamp: '2026-04-03T14:15:00Z', assessment: 'p3.2xlarge instance idle for 72 hours. Zero GPU utilization. Costing ₹160/day (₹4,800/mo).', recommendation: 'Terminate instance and redeploy on-demand when ML training is scheduled.' },
      { id: 'al4', severity: 'warning', title: 'Disk usage approaching threshold', resource: 'prod-worker-03', timestamp: '2026-04-03T13:45:00Z', assessment: 'Disk at 72%, approaching 80% warning threshold. Growth rate suggests threshold breach in ~5 days.', recommendation: 'Clean up container images and old log files. Consider expanding EBS volume.' },
      { id: 'al5', severity: 'info', title: 'Stale container cleanup available', resource: 'ml-worker-stale', timestamp: '2026-04-03T13:30:00Z', assessment: 'Container idle for 12 days with 0% CPU utilization.', recommendation: 'Terminate container and remove associated resources. Potential saving: ₹2,400/mo.' },
    ],
    history: [
      { id: 'ah1', title: 'High CPU on staging-web-01', severity: 'warning', resolvedAt: '2026-04-02T16:00:00Z', resolvedBy: 'agent', action: 'Downgraded instance during off-peak and scaled back up on schedule.' },
      { id: 'ah2', title: 'Failed deployment — auth-service', severity: 'critical', resolvedAt: '2026-04-02T10:30:00Z', resolvedBy: 'agent', action: 'Rolled back to previous version and opened fix PR.' },
      { id: 'ah3', title: 'Unused EBS volume detected', severity: 'info', resolvedAt: '2026-04-01T14:00:00Z', resolvedBy: 'agent', action: 'Archived vol-backup-old to S3 Glacier.' },
      { id: 'ah4', title: 'Certificate expiry in 7 days', severity: 'warning', resolvedAt: '2026-03-31T09:00:00Z', resolvedBy: 'manual', action: 'Renewed TLS certificate via Let\'s Encrypt.' },
      { id: 'ah5', title: 'Memory leak in data-ingestion', severity: 'critical', resolvedAt: '2026-03-30T18:00:00Z', resolvedBy: 'agent', action: 'Identified memory leak in batch processor, generated fix PR, merged after review.' },
      { id: 'ah6', title: 'Stale container — test-runner-old', severity: 'info', resolvedAt: '2026-03-29T12:00:00Z', resolvedBy: 'agent', action: 'Terminated idle container. Saved ₹800/mo.' },
    ],
  });
}

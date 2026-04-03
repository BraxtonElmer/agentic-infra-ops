import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/infrastructure`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

function _mock() {
  return NextResponse.json({
    servers: [
      { id: 's1', name: 'prod-worker-01', instanceType: 't3.xlarge', region: 'ap-south-1', uptime: '42d 7h', cpu: 62, ram: 71, disk: 45, netIn: '142 MB/s', netOut: '38 MB/s', critical: false },
      { id: 's2', name: 'prod-worker-02', instanceType: 't3.xlarge', region: 'ap-south-1', uptime: '42d 7h', cpu: 48, ram: 55, disk: 38, netIn: '98 MB/s', netOut: '24 MB/s', critical: false },
      { id: 's3', name: 'prod-worker-03', instanceType: 'r5.2xlarge', region: 'ap-south-1', uptime: '15d 3h', cpu: 88, ram: 96, disk: 72, netIn: '210 MB/s', netOut: '65 MB/s', critical: true },
      { id: 's4', name: 'staging-web-01', instanceType: 't3.large', region: 'ap-south-1', uptime: '8d 12h', cpu: 22, ram: 34, disk: 28, netIn: '12 MB/s', netOut: '4 MB/s', critical: false },
      { id: 's5', name: 'gpu-training-01', instanceType: 'p3.2xlarge', region: 'us-east-1', uptime: '72d 0h', cpu: 2, ram: 8, disk: 15, netIn: '0.1 MB/s', netOut: '0.02 MB/s', critical: false },
      { id: 's6', name: 'db-primary-01', instanceType: 'r5.xlarge', region: 'ap-south-1', uptime: '120d 4h', cpu: 55, ram: 68, disk: 82, netIn: '340 MB/s', netOut: '180 MB/s', critical: false },
    ],
    containers: [
      { id: 'c1', name: 'axiom-api-prod', image: 'axiom-api:2.1.0', cpu: 45, ram: 62, netIO: '88/24 MB/s', uptime: '7d 3h', status: 'running' },
      { id: 'c2', name: 'frontend-prod', image: 'frontend:3.4.1', cpu: 12, ram: 28, netIO: '120/95 MB/s', uptime: '7d 3h', status: 'running' },
      { id: 'c3', name: 'redis-cache', image: 'redis:7.2', cpu: 8, ram: 42, netIO: '210/210 MB/s', uptime: '42d 7h', status: 'running' },
      { id: 'c4', name: 'ml-worker-stale', image: 'ml-worker:1.8.2', cpu: 0, ram: 4, netIO: '0/0 MB/s', uptime: '18d 2h', status: 'idle', idleDays: 12 },
      { id: 'c5', name: 'legacy-cron', image: 'cron-jobs:0.9.1', cpu: 0, ram: 2, netIO: '0/0 MB/s', uptime: '90d 1h', status: 'zombie' },
      { id: 'c6', name: 'nginx-proxy', image: 'nginx:1.25', cpu: 3, ram: 12, netIO: '450/420 MB/s', uptime: '42d 7h', status: 'running' },
      { id: 'c7', name: 'monitoring-agent', image: 'datadog:7.48', cpu: 6, ram: 18, netIO: '5/12 MB/s', uptime: '42d 7h', status: 'running' },
      { id: 'c8', name: 'test-runner-stale', image: 'test-runner:2.0', cpu: 0, ram: 1, netIO: '0/0 MB/s', uptime: '25d 0h', status: 'idle', idleDays: 8 },
    ],
    staleResources: [
      { id: 'sr1', type: 'container', name: 'ml-worker-stale', lastActive: '12 days ago', costPerMonth: '₹2,400' },
      { id: 'sr2', type: 'container', name: 'test-runner-stale', lastActive: '8 days ago', costPerMonth: '₹800' },
      { id: 'sr3', type: 'volume', name: 'vol-backup-old', lastActive: '45 days ago', costPerMonth: '₹1,200' },
      { id: 'sr4', type: 'volume', name: 'vol-ml-checkpoints', lastActive: '30 days ago', costPerMonth: '₹3,600' },
      { id: 'sr5', type: 'zombie', name: 'legacy-cron', lastActive: '90 days ago', costPerMonth: '₹400' },
    ],
  });
}

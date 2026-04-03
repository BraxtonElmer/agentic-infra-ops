import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalCost: '₹1,82,400',
    totalWaste: '₹14,200',
    potentialSavings: '₹18,600',
    breakdown: [
      { service: 'Compute (EC2)', cost: 68400, waste: 4800 },
      { service: 'Database (RDS)', cost: 42600, waste: 3200 },
      { service: 'Storage (S3)', cost: 28200, waste: 2100 },
      { service: 'ML Training (GPU)', cost: 24800, waste: 4100 },
      { service: 'Networking', cost: 18400, waste: 0 },
      { service: 'Monitoring', cost: 8200, waste: 0 },
      { service: 'CDN (CloudFront)', cost: 5800, waste: 0 },
    ],
    trend: Array.from({ length: 30 }, (_, i) => ({
      day: `Mar ${(i + 4).toString().padStart(2, '0')}`,
      cost: Math.round(5200 + Math.random() * 1800 + (i > 20 ? 600 : 0)),
    })),
    wasteItems: [
      { id: 'w1', name: 'gpu-training-01', type: 'EC2 Instance', costPerMonth: '₹4,800', recommendation: 'Instance has been idle for 72 hours with zero GPU utilization. Recommend terminating or switching to spot instance during active training only.' },
      { id: 'w2', name: 'staging-db-replica', type: 'RDS Instance', costPerMonth: '₹3,200', recommendation: 'Read replica receives less than 10 queries/hour. Consider removing this replica and using the primary for staging reads.' },
      { id: 'w3', name: 'vol-ml-checkpoints', type: 'EBS Volume', costPerMonth: '₹3,600', recommendation: 'ML checkpoint volume has not been accessed in 30 days. Archive to S3 Glacier for 90% cost reduction.' },
      { id: 'w4', name: 'ml-worker-stale', type: 'Container', costPerMonth: '₹2,400', recommendation: 'Container has been idle for 12 days consuming reserved compute. Terminate and redeploy on-demand when needed.' },
    ],
    actionsLog: [
      { id: 'al1', action: 'Terminated idle container', resource: 'test-runner-stale', saving: '₹800/mo', timestamp: '2026-04-03T10:15:00Z', status: 'completed' },
      { id: 'al2', action: 'Downgraded instance type', resource: 'staging-web-01', saving: '₹2,100/mo', timestamp: '2026-04-02T14:30:00Z', status: 'completed' },
      { id: 'al3', action: 'Archived cold storage volume', resource: 'vol-backup-old', saving: '₹1,080/mo', timestamp: '2026-04-01T09:22:00Z', status: 'completed' },
      { id: 'al4', action: 'Flagged idle GPU for termination', resource: 'gpu-training-01', saving: '₹4,800/mo', timestamp: '2026-04-03T14:15:00Z', status: 'pending' },
      { id: 'al5', action: 'Recommend replica removal', resource: 'staging-db-replica', saving: '₹3,200/mo', timestamp: '2026-04-03T14:10:00Z', status: 'pending' },
    ],
  });
}

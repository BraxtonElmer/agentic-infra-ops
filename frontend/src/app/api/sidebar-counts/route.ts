import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    pipelinesFailed: 3,
    infraCritical: 2,
    finopsWaste: '₹14.2k',
    alertsActive: 5,
    agentState: 'scanning',
  });
}

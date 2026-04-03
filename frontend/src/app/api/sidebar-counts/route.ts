import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/sidebar-counts`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

function _mock() {
  return NextResponse.json({
    pipelinesFailed: 3,
    infraCritical: 2,
    finopsWaste: '₹14.2k',
    alertsActive: 5,
    agentState: 'scanning',
  });
}

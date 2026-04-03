import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/agent-log`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

export async function POST() {
  try {
    const res = await fetch(`${BACKEND}/api/agent-log/scan`, { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

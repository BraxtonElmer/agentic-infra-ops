import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/settings`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'backend unavailable' }, { status: 502 });
  }
}

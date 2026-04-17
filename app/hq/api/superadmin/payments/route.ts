import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXUS Bridge: Payments Proxy.
 * [REAL DATA]: Prioritizes live backend data over simulation mockups.
 */
export async function GET(req: NextRequest) {
  const isSimulationEnabled = process.env.PLATFORM_SIMULATION === 'true';

  try {
    const backendUrl = `http://localhost:4000/api/superadmin/payments`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error(`Backend Error: ${response.status}`);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    if (isSimulationEnabled) {
      console.warn('NEXUS_BRIDGE: [SIMULATION_ACTIVE] Backend unreachable. Engaging fallback.');
      const mockPayments = [
        { id: 'PAY-1092', amount: 2500, status: 'Completed', tenant: 'Omega Corp', date: '2026-04-16' },
        { id: 'PAY-8821', amount: 1200, status: 'Completed', tenant: 'Zion Systems', date: '2026-04-16' },
      ];
      return NextResponse.json({ success: true, isSimulation: true, data: mockPayments });
    }

    console.error('NEXUS_BRIDGE_CRITICAL: Billing Engine unreachable.', err.message);
    return NextResponse.json({ success: false, error: 'Billing Processor Desync' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `http://localhost:4000/api/superadmin/payments/verify`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (err) {
    console.error('NEXUS_BRIDGE_CRITICAL: Billing Verification disconnect.', err);
    return NextResponse.json({ success: false, error: 'Verification Service Offline' }, { status: 502 });
  }
}

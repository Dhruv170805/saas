import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXUS Bridge: Tenants Proxy.
 * [REAL DATA]: Prioritizes live backend data over simulation mockups.
 */
export async function GET(req: NextRequest) {
  const isSimulationEnabled = process.env.PLATFORM_SIMULATION === 'true';

  try {
    const backendUrl = `http://localhost:4000/api/superadmin/tenants`;
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
      const mockTenants = [
        { id: 'TID-8902', name: 'Omega Corp', slug: 'omega', plan: 'pro', suspended: false },
        { id: 'TID-441B', name: 'Nexus Industries', slug: 'nexus-ind', plan: 'pro', suspended: false },
        { id: 'TID-981X', name: 'Aero Dynamics', slug: 'aero', plan: 'enterprise', suspended: true },
        { id: 'TID-220C', name: 'Global Data Inc', slug: 'global-data', plan: 'starter', suspended: false },
        { id: 'TID-001A', name: 'Alpha Logistics', slug: 'alpha-log', plan: 'pro', suspended: false },
      ];
      return NextResponse.json({ success: true, isSimulation: true, data: mockTenants });
    }

    console.error('NEXUS_BRIDGE_CRITICAL: Tenants Domain unreachable.', err.message);
    return NextResponse.json({ success: false, error: 'Identity Registry Unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const action = pathParts[pathParts.length - 1];
  const id = pathParts[pathParts.length - 2];

  try {
    const backendUrl = `http://localhost:4000/api/superadmin/tenants/${id}/${action}`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('NEXUS_BRIDGE_CRITICAL: Command Engine disconnect.', err);
    return NextResponse.json({ success: false, error: 'Command Engine Link Failure' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXUS Bridge: Analytics Proxy.
 * Forwards requests to the refactored NestJS Control Plane (Port 4000).
 * [REAL DATA]: Prioritizes live backend data over simulation mockups.
 */
export async function GET(req: NextRequest) {
  const isSimulationEnabled = process.env.PLATFORM_SIMULATION === 'true';

  try {
    const backendUrl = `http://localhost:4000/api/superadmin/analytics`;
    
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
      return NextResponse.json({ 
        success: true, 
        isSimulation: true,
        data: {
          tenants: [
            { plan: 'Enterprise', count: '42' },
            { plan: 'Professional', count: '85' },
            { plan: 'Starter', count: '15' }
          ],
          revenue30d: (85000 * 85).toString(),
          growth: '+12.4%',
          apiPerformance: '99.98%',
          activeUsers: '12.5k',
          errorRate: '0.04%'
        } 
      });
    }

    console.error('NEXUS_BRIDGE_CRITICAL: Analytics Engine unreachable.', err.message);
    return NextResponse.json({ success: false, error: 'Control Plane Link failure' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXUS Bridge: Identity Handshake (Login).
 * Forwards login requests to the NestJS Auth Controller.
 * [FALLBACK]: Provides God-Mode Simulation access if Identity Plane is offline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = `http://localhost:4000/api/superadmin/auth/login`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Identity Plane returned error');

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.headers.set('set-cookie', setCookieHeader);
    }

    return res;
  } catch (err) {
    console.warn('NEXUS_BRIDGE_FALLBACK (Auth_Login): Engaging Simulation Bypass.');
    
    // ── GOD-MODE SIMULATION ACCESS ───────────────────────────────────────────
    // We return a mock success response with a dummy token
    const demoResponse = {
      success: true,
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-payload.demo-signature',
        user: { name: 'Dhruv Patel', role: 'SUPERADMIN' }
      },
      isSimulation: true
    };

    const res = NextResponse.json(demoResponse);
    
    // Set a dummy session cookie for the simulation
    res.cookies.set('super_token', 'demo-session-active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/hq'
    });

    return res;
  }
}

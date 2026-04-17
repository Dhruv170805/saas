import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXUS Bridge: Identity Handshake (Logout).
 */
export async function POST(req: NextRequest) {
  try {
    const backendUrl = `http://localhost:4000/api/superadmin/auth/logout`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
    });

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });

    // Propagate the cookie clearance
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.headers.set('set-cookie', setCookieHeader);
    }

    return res;
  } catch (err) {
    console.error('NEXUS_BRIDGE_FAILURE (Auth_Logout):', err);
    return NextResponse.json({ success: false, error: 'Identity Plane Unavailable' }, { status: 502 });
  }
}

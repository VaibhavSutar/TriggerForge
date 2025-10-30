import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, buildApiUrl } from '@/config/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login request body:', body);
    
    const apiUrl = buildApiUrl(API_ENDPOINTS.LOGIN);
    console.log('Calling API URL:', apiUrl);
    
    // Forward to your Fastify server using constants
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Server response status:', response.status);
    console.log('Server response data:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // ✅ Set secure cookie after successful login
    const res = NextResponse.json(data, { status: 200 });
    if (data?.token) {
      res.cookies.set('token', data.token, {
        httpOnly: true,            // not accessible by JS (secure)
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,  // 7 days
      });
      console.log('✅ Token cookie set successfully');
    } else {
      console.warn('⚠️ No token found in response, cookie not set');
    }

    return res;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, buildApiUrl } from '@/config/constants';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_TOKEN }, 
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Forward to your Fastify server using constants
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ME), {
      method: 'GET',
      headers: {
        'Authorization': authorization,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
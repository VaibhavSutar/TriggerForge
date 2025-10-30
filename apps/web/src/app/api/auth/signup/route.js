import { NextResponse } from 'next/server';
import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, buildApiUrl } from '@/config/constants';
export async function POST(request) {
    try {
        const body = await request.json();
        // Forward to your Fastify server using constants
        const response = await fetch(buildApiUrl(API_ENDPOINTS.SIGNUP), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }
        return NextResponse.json(data);
    }
    catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}

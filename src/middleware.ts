import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    if (process.env.RESTRICT_SERVICE_ENDPOINTS_ACCESS === "true") {
        return NextResponse.json({
            error: "Access forbidden",
        });
    }
}

export const config = {
    matcher: [
        '/api/interactions/:path*',
        '/api/assistants/:path*',
        '/api/test/:path*',
    ],
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // The main routing logic is handled heavily on the client components (layout.tsx, auth-context.tsx) 
    // due to the use of Firebase client Auth state.
    // However, we can add some basic matching blocks to ensure basic path separation.

    // In a fully robust Firebase SSR app, you would verify tokens here.
    // Since this project uses client-side Firebase Auth, we mainly rely on layout protections.

    const response = NextResponse.next();
    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

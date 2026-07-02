import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || "super_secret_jwt_key_kanabuet";
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah ada session cookie kustom kita
  const sessionToken = request.cookies.get('session')?.value;
  let userPayload = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, key, {
        algorithms: ["HS256"],
      });
      userPayload = payload;
    } catch {
      // Token tidak valid atau kedaluwarsa
    }
  }

  const systemRole = userPayload?.systemRole as string | undefined;

  // Jika mengakses route yang dilindungi tanpa login, redirect ke /login
  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/projects');

  if (isProtectedRoute && !userPayload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login
  if (userPayload) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL(systemRole === 'supervisor' ? '/dashboard/supervisor' : '/dashboard', request.url));
    }

    // Proteksi RBAC (Role-Based Access Control)
    if (isProtectedRoute) {
      const isSupervisorRoute = pathname.startsWith('/dashboard/supervisor');
      // note: owner routes includes /projects

      if (systemRole === 'supervisor' && !isSupervisorRoute) {
        return NextResponse.redirect(new URL('/dashboard/supervisor', request.url));
      }
      
      if (systemRole === 'owner' && isSupervisorRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Si l'utilisateur est connecté et va sur /auth/signin, rediriger vers /
    if (req.nextUrl.pathname === "/auth/signin" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Pour toutes les autres pages, laisser withAuth gérer
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Autorise l'accès à la page de connexion même sans token
        if (req.nextUrl.pathname === "/auth/signin") {
          return true;
        }
        // Pour toutes les autres pages, vérifie si l'utilisateur a un token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.png|.*\\.svg).*)",
  ],
};

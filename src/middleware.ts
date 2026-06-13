import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Public routes — let them through
    if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/apply')) {
      // If logged in and hitting root, send to dashboard
      if (pathname === '/' && token) {
        const role = token.role as string
        return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url))
      }
      return NextResponse.next()
    }

    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const role = token.role as string

    // Enforce role-based route access
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url))
    }
    if (pathname.startsWith('/teacher') && role !== 'TEACHER') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url))
    }
    if (pathname.startsWith('/student') && role !== 'STUDENT') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url))
    }
    if (pathname.startsWith('/parent') && role !== 'PARENT') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Allow public routes without token
        if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/apply')) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)'],
}

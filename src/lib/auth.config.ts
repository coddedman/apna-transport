import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // List providers here
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isPlatform = nextUrl.pathname.startsWith('/platform')
      const isProtected = isDashboard || isPlatform

      if (isProtected) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        // Redirect to the correct dashboard based on role
        const role = (auth?.user as any)?.role
        if (role === 'SUPER_ADMIN') {
          return Response.redirect(new URL('/platform', nextUrl))
        }
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.transporterId = (user as any).transporterId
        token.transporterName = (user as any).transporterName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).transporterId = token.transporterId
        ;(session.user as any).transporterName = token.transporterName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

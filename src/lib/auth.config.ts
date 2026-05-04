import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // List providers here
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isPlatform = nextUrl.pathname.startsWith('/platform')
      const isOwnerPortal = nextUrl.pathname.startsWith('/owner')
      const isChangePassword = nextUrl.pathname === '/change-password'
      const isProtected = isDashboard || isPlatform || isOwnerPortal || isChangePassword

      if (isProtected) {
        if (isLoggedIn) {
          const user = auth?.user as any
          if (user?.mustChangePassword && !isChangePassword) {
            return Response.redirect(new URL('/change-password', nextUrl))
          }
          if (!user?.mustChangePassword && isChangePassword) {
            return Response.redirect(new URL('/dashboard', nextUrl))
          }
          if (isDashboard && user?.role === 'SUPER_ADMIN') {
            return Response.redirect(new URL('/platform', nextUrl))
          }
          if (isDashboard && user?.role === 'OWNER') {
            return Response.redirect(new URL('/owner', nextUrl))
          }
          if (isPlatform && user?.role !== 'SUPER_ADMIN') {
            return Response.redirect(new URL('/dashboard', nextUrl))
          }
          if (isOwnerPortal && user?.role !== 'OWNER') {
            return Response.redirect(new URL('/dashboard', nextUrl))
          }
          return true
        }
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        // Redirect to the correct dashboard based on role
        const role = (auth?.user as any)?.role
        if (role === 'SUPER_ADMIN') {
          return Response.redirect(new URL('/platform', nextUrl))
        }
        if (role === 'OWNER') {
          return Response.redirect(new URL('/owner', nextUrl))
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
        token.mustChangePassword = (user as any).mustChangePassword
        token.ownerId = (user as any).ownerId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).transporterId = token.transporterId
        ;(session.user as any).transporterName = token.transporterName
        ;(session.user as any).mustChangePassword = token.mustChangePassword
        ;(session.user as any).ownerId = token.ownerId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

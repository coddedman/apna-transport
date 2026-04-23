import { DefaultSession } from 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    role?: Role
    transporterId?: string | null
    transporterName?: string | null
    mustChangePassword?: boolean
    ownerId?: string | null
  }

  interface Session {
    user: {
      id: string
      role?: Role
      transporterId?: string | null
      transporterName?: string | null
      mustChangePassword?: boolean
      ownerId?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: Role
    transporterId?: string | null
    transporterName?: string | null
    mustChangePassword?: boolean
    ownerId?: string | null
  }
}

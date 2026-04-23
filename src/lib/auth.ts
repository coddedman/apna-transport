import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        console.log('Auth attempt for email:', credentials.email)
        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
          include: { transporter: true, owner: true },
        })

        if (!user) {
          console.log('No user found for email:', credentials.email)
          return null
        }

        console.log('User found:', user.email, 'Role:', user.role)

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        console.log('Password match:', passwordMatch)

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          transporterId: user.transporterId,
          transporterName: user.transporter?.name ?? null,
          mustChangePassword: user.mustChangePassword,
          ownerId: user.owner?.id ?? null,
        }
      },
    }),
  ],
})

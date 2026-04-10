import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function registerTransporter(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const registration = formData.get('registration') as string

  if (!name || !email || !password) throw new Error('Missing fields')

  const hashedPassword = await bcrypt.hash(password, 10)

  return await prisma.$transaction(async (tx) => {
    const transporter = await tx.transporter.create({
      data: {
        name,
        registration,
      }
    })

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ORG_ADMIN',
        transporterId: transporter.id,
      }
    })

    return { transporter, user }
  })
}

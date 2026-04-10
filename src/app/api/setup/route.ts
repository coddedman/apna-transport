import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const setupSecret = process.env.SETUP_SECRET
    
    // 1. Safety check: Ensure the secret is actually configured in Vercel
    if (!setupSecret) {
      return NextResponse.json({ error: 'SETUP_SECRET environment variable is not configured.' }, { status: 403 })
    }

    const body = await request.json()
    
    // 2. Safety check: Request must provide the matching secret
    if (body.setupSecret !== setupSecret) {
      return NextResponse.json({ error: 'Invalid setup secret.' }, { status: 401 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    // 3. Safety check: Ensure no SUPER_ADMIN already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json({ error: 'A Platform Owner (SUPER_ADMIN) already exists. Setup aborted for security.' }, { status: 403 })
    }

    // 4. Create the Platform Owner
    const hashedPassword = await bcrypt.hash(password, 10)
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        transporterId: null, // Platform owner doesn't belong to a specific company
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Platform Owner successfully created in production!',
      email: superAdmin.email
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

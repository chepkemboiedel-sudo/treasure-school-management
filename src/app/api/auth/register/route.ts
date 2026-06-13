import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = schema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role,
        ...(role === 'ADMIN' && { admin: { create: { name } } }),
        ...(role === 'TEACHER' && { teacher: { create: { name, employeeId: `EMP-${Date.now()}` } } }),
        ...(role === 'STUDENT' && { student: { create: { name, studentId: `STU-${Date.now()}`, guardianName: 'Guardian', guardianPhone: '0000000000' } } }),
        ...(role === 'PARENT' && { parent: { create: { name } } }),
      },
    })

    return NextResponse.json({ message: 'Account created', userId: user.id }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

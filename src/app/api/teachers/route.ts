import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { teacherSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '10')
  const search = searchParams.get('search') ?? ''
  const simple = searchParams.get('simple') === 'true'

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { employeeId: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {}

  if (simple) {
    const teachers = await prisma.teacher.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: teachers })
  }

  const [total, teachers] = await Promise.all([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } },
        subjects: { include: { class: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    data: teachers.map((t) => ({ ...t, email: t.user.email, userId: t.user.id, createdAt: t.createdAt.toISOString() })),
    total, page, perPage,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = teacherSchema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const existsEmp = await prisma.teacher.findUnique({ where: { employeeId: data.employeeId } })
    if (existsEmp) return NextResponse.json({ error: 'Employee ID already in use' }, { status: 400 })

    const passwordHash = await bcrypt.hash(data.password ?? 'Password@123', 12)

    const result = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'TEACHER',
        teacher: {
          create: {
            name: data.name,
            employeeId: data.employeeId,
            phone: data.phone,
            specialization: data.specialization,
            photo: data.photo || undefined,
          },
        },
      },
      include: { teacher: true },
    })
    return NextResponse.json({ data: result.teacher }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

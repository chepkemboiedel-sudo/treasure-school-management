import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const parentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  password: z.string().min(6).optional(),
  studentIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
    ],
  } : {}

  const parents = await prisma.parent.findMany({
    where,
    include: {
      user: { select: { id: true, email: true } },
      students: { select: { id: true, name: true, studentId: true, class: { select: { name: true, section: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    data: parents.map((p) => ({ ...p, email: p.user.email, userId: p.user.id })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = parentSchema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const passwordHash = await bcrypt.hash(data.password ?? 'Password@123', 12)

    const result = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'PARENT',
        parent: {
          create: {
            name: data.name,
            phone: data.phone || undefined,
            photo: data.photo || undefined,
            ...(data.studentIds?.length && {
              students: { connect: data.studentIds.map((id) => ({ id })) },
            }),
          },
        },
      },
      include: { parent: { include: { students: true } } },
    })

    return NextResponse.json({ data: result.parent }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

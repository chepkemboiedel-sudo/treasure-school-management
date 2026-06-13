import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const staffSchema = z.object({
  name: z.string().min(2),
  staffId: z.string().min(2),
  position: z.string().min(2),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  photo: z.string().optional(),
  isActive: z.boolean().optional(),
  joinDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { staffId: { contains: search, mode: 'insensitive' as const } },
      { position: { contains: search, mode: 'insensitive' as const } },
      { department: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {}

  const staff = await prisma.staff.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json({ data: staff })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = staffSchema.parse(body)

    const exists = await prisma.staff.findUnique({ where: { staffId: data.staffId } })
    if (exists) return NextResponse.json({ error: 'Staff ID already in use' }, { status: 400 })

    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        staffId: data.staffId,
        position: data.position,
        department: data.department || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        photo: data.photo || undefined,
        isActive: data.isActive ?? true,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
      },
    })
    return NextResponse.json({ data: staff }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

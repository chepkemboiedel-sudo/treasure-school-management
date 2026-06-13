import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { announcementSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '10')
  const limit = parseInt(searchParams.get('limit') ?? '0')

  const take = limit > 0 ? limit : perPage
  const skip = limit > 0 ? 0 : (page - 1) * perPage

  const role = session.user.role as 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

  const where = role !== 'ADMIN' ? {
    OR: [
      { targetRole: null },
      { targetRole: role },
    ],
  } : {}

  const [total, announcements] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: { id: true, email: true, admin: { select: { name: true } }, teacher: { select: { name: true } } },
        },
        class: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ])

  return NextResponse.json({
    data: announcements.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() })),
    total, page, perPage,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = announcementSchema.parse(await req.json())
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: session.user.id,
        targetRole: data.targetRole ?? null,
        classId: data.classId || null,
      },
    })
    return NextResponse.json({ data: announcement }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

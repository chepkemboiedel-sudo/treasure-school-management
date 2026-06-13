import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const notifSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  targetRole: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).nullable().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = session.user.role
  const countOnly = searchParams.get('count') === 'true'

  const where = role === 'ADMIN'
    ? {}
    : {
        OR: [
          { targetRole: role as 'TEACHER' | 'STUDENT' | 'PARENT' },
          { targetRole: null },
        ],
      }

  if (countOnly) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const count = await prisma.notification.count({
      where: { ...where, createdAt: { gte: sevenDaysAgo } },
    })
    return NextResponse.json({ count })
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: { author: { select: { admin: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ data: notifications })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = notifSchema.parse(body)

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        targetRole: data.targetRole ?? null,
        priority: data.priority ?? 'NORMAL',
        authorId: session.user.id,
      },
    })
    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

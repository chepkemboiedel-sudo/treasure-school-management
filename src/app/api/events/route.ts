import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
  type: z.enum(['HOLIDAY', 'EXAM', 'SPORTS', 'MEETING', 'OTHER']).default('OTHER'),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming') === 'true'

  const where = upcoming ? { startDate: { gte: new Date() } } : {}
  const events = await prisma.event.findMany({ where, orderBy: { startDate: 'asc' } })
  return NextResponse.json({ data: events })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = eventSchema.parse(await req.json())
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        type: data.type,
      },
    })
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

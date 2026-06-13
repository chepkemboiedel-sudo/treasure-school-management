import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().optional(),
  purpose: z.string().min(1, 'Purpose required'),
  hostName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '20')

  const where = date ? {
    timeIn: {
      gte: new Date(`${date}T00:00:00`),
      lte: new Date(`${date}T23:59:59`),
    },
  } : {}

  const [total, visitors] = await Promise.all([
    prisma.visitor.count({ where }),
    prisma.visitor.findMany({ where, orderBy: { timeIn: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
  ])

  return NextResponse.json({ data: visitors, total, page, perPage })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = schema.parse(await req.json())
    const visitor = await prisma.visitor.create({ data })
    return NextResponse.json({ data: visitor }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

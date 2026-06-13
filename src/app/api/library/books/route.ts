import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  author: z.string().optional(),
  isbn: z.string().optional(),
  category: z.string().optional(),
  quantity: z.coerce.number().min(1).default(1),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const where = search ? {
    OR: [
      { title: { contains: search, mode: 'insensitive' as const } },
      { author: { contains: search, mode: 'insensitive' as const } },
      { isbn: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {}

  const books = await prisma.book.findMany({ where, orderBy: { title: 'asc' }, include: { _count: { select: { issues: true } } } })
  return NextResponse.json({ data: books })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const data = schema.parse(await req.json())
    const book = await prisma.book.create({ data: { ...data, available: data.quantity } })
    return NextResponse.json({ data: book }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

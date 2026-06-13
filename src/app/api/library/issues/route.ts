import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  bookId: z.string().min(1),
  studentId: z.string().min(1),
  dueDate: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where = status ? { status } : {}

  const issues = await prisma.bookIssue.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, author: true } },
      student: { select: { id: true, name: true, studentId: true } },
    },
    orderBy: { issueDate: 'desc' },
  })
  return NextResponse.json({ data: issues })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const data = schema.parse(await req.json())
    const book = await prisma.book.findUnique({ where: { id: data.bookId } })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    if (book.available < 1) return NextResponse.json({ error: 'No copies available' }, { status: 400 })

    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({
        data: { bookId: data.bookId, studentId: data.studentId, dueDate: new Date(data.dueDate), status: 'ISSUED' },
      }),
      prisma.book.update({ where: { id: data.bookId }, data: { available: { decrement: 1 } } }),
    ])
    return NextResponse.json({ data: issue }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

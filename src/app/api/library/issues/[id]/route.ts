import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const issue = await prisma.bookIssue.findUnique({ where: { id: params.id } })
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  if (issue.status === 'RETURNED') return NextResponse.json({ error: 'Already returned' }, { status: 400 })

  const [updated] = await prisma.$transaction([
    prisma.bookIssue.update({ where: { id: params.id }, data: { status: 'RETURNED', returnDate: new Date() } }),
    prisma.book.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } }),
  ])
  return NextResponse.json({ data: updated })
}

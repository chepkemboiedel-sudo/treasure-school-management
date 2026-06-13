import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ data: expenses })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const expense = await prisma.expense.create({
    data: {
      title: body.title,
      category: body.category ?? 'OTHER',
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      payee: body.payee,
      receiptNo: body.receiptNo,
      description: body.description,
    },
  })
  return NextResponse.json({ data: expense }, { status: 201 })
}

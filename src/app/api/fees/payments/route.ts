import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feePaymentSchema } from '@/lib/validations'
import { generateReceiptNumber } from '@/lib/utils'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '15')
  const mine = searchParams.get('mine') === 'true'

  let where: Record<string, unknown> = {}
  if (mine && session.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (student) where.studentId = student.id
  }

  const [total, payments] = await Promise.all([
    prisma.feePayment.count({ where }),
    prisma.feePayment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        feeStructure: { select: { id: true, name: true, amount: true, feeType: true } },
      },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    data: payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      paymentDate: p.paymentDate.toISOString(),
      createdAt: p.createdAt.toISOString(),
      feeStructure: { ...p.feeStructure, amount: p.feeStructure.amount.toString() },
    })),
    total, page, perPage,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = feePaymentSchema.parse(await req.json())
    const payment = await prisma.feePayment.create({
      data: {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        receiptNumber: generateReceiptNumber(),
        paymentMethod: data.paymentMethod,
        mpesaCode: data.mpesaCode || null,
        status: data.status,
        notes: data.notes,
      },
    })
    return NextResponse.json({ data: { ...payment, amount: payment.amount.toString() } }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

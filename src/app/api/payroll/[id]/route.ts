import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const record = await prisma.salaryRecord.update({
    where: { id: params.id },
    data: {
      status: body.status ?? undefined,
      paidDate: body.status === 'PAID' ? new Date() : undefined,
      notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json({ data: { ...record, netSalary: record.netSalary.toString() } })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.salaryRecord.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

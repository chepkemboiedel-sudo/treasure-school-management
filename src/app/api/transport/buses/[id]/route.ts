import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const bus = await prisma.bus.update({ where: { id: params.id }, data: { plateNumber: body.plateNumber, driverName: body.driverName, driverPhone: body.driverPhone, capacity: body.capacity, route: body.route } })
  return NextResponse.json({ data: bus })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.bus.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

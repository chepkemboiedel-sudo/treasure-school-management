import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const cls = await prisma.class.update({
    where: { id: params.id },
    data: { name: body.name, section: body.section, level: body.level, capacity: body.capacity, classTeacherId: body.classTeacherId || null },
  })
  return NextResponse.json({ data: cls })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.class.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Class deleted' })
}

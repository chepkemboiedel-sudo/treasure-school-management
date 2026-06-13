import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const teacher = await prisma.teacher.update({
    where: { id: params.id },
    data: {
      name: body.name,
      phone: body.phone,
      specialization: body.specialization,
      photo: body.photo || null,
    },
  })
  return NextResponse.json({ data: teacher })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const teacher = await prisma.teacher.findUnique({ where: { id: params.id } })
  if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.user.delete({ where: { id: teacher.userId } })
  return NextResponse.json({ message: 'Teacher deleted' })
}

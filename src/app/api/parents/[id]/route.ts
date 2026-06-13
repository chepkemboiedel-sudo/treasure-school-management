import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const parent = await prisma.parent.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.photo !== undefined && { photo: data.photo }),
        ...(data.studentIds && {
          students: { set: data.studentIds.map((id) => ({ id })) },
        }),
      },
      include: {
        user: { select: { id: true, email: true } },
        students: { select: { id: true, name: true, studentId: true } },
      },
    })
    return NextResponse.json({ data: { ...parent, email: parent.user.email, userId: parent.user.id } })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parent = await prisma.parent.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.user.delete({ where: { id: parent.userId } })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const data = patchSchema.parse(await req.json())
    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
    })
    return NextResponse.json({ data: assignment })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.assignment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

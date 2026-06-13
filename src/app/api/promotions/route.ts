import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const promotionSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  toClassId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = promotionSchema.parse(body)

    await prisma.student.updateMany({
      where: { id: { in: data.studentIds } },
      data: { classId: data.toClassId },
    })

    return NextResponse.json({ data: { promoted: data.studentIds.length } })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feeStructureSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level')
  const classId = searchParams.get('classId')

  const where: Record<string, unknown> = {}
  if (level) where.level = level
  if (classId) where.classId = classId

  const structures = await prisma.feeStructure.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      class: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: [{ level: 'asc' }, { feeType: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({
    data: structures.map((s) => ({ ...s, amount: s.amount.toString() })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = feeStructureSchema.parse(await req.json())
    const structure = await prisma.feeStructure.create({
      data: {
        name: data.name,
        amount: data.amount,
        feeType: data.feeType,
        level: data.level ?? null,
        classId: data.classId || null,
        termId: data.termId,
      },
    })
    return NextResponse.json({ data: { ...structure, amount: structure.amount.toString() } }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 })
  }
}

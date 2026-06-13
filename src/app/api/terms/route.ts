import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { termSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const terms = await prisma.term.findMany({
    include: { academicYear: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({
    data: terms.map((t) => ({
      ...t,
      label: `${t.name} (${t.academicYear.name})`,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = termSchema.parse(await req.json())
    const term = await prisma.term.create({
      data: { name: data.name, academicYearId: data.academicYearId, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
    })
    return NextResponse.json({ data: term }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

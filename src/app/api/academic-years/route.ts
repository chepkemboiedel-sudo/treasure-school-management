import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { academicYearSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const years = await prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } })
  return NextResponse.json({ data: years.map((y) => ({ ...y, startDate: y.startDate.toISOString(), endDate: y.endDate.toISOString() })) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = academicYearSchema.parse(await req.json())
    const year = await prisma.academicYear.create({
      data: { name: data.name, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
    })
    return NextResponse.json({ data: year }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  teacherId: z.string().min(1),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  basicSalary: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

  const where: Record<string, unknown> = {}
  if (month) where.month = month
  if (year) where.year = year

  const records = await prisma.salaryRecord.findMany({
    where,
    include: { teacher: { select: { id: true, name: true, employeeId: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { teacher: { name: 'asc' } }],
  })

  return NextResponse.json({
    data: records.map((r) => ({
      ...r,
      basicSalary: r.basicSalary.toString(),
      allowances: r.allowances.toString(),
      deductions: r.deductions.toString(),
      netSalary: r.netSalary.toString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = schema.parse(await req.json())
    const netSalary = data.basicSalary + data.allowances - data.deductions

    const record = await prisma.salaryRecord.create({
      data: {
        teacherId: data.teacherId,
        month: data.month,
        year: data.year,
        basicSalary: data.basicSalary,
        allowances: data.allowances,
        deductions: data.deductions,
        netSalary,
        notes: data.notes,
      },
    })
    return NextResponse.json({ data: { ...record, netSalary: record.netSalary.toString() } }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    if ((e as { code?: string }).code === 'P2002') return NextResponse.json({ error: 'Salary record already exists for this teacher/month/year' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

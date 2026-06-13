import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applicationSchema = z.object({
  studentName: z.string().min(2, 'Full name required'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  classApplying: z.string().min(1, 'Please select a class'),
  previousSchool: z.string().optional(),
  parentName: z.string().min(2, 'Parent/guardian name required'),
  parentEmail: z.string().email('Valid email required'),
  parentPhone: z.string().min(6, 'Phone number required'),
  relationship: z.string().optional(),
  message: z.string().optional(),
})

// Public POST — no auth required
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = applicationSchema.parse(body)
    const application = await prisma.application.create({
      data: {
        ...data,
        dob: data.dob ? new Date(data.dob) : undefined,
      },
    })
    return NextResponse.json({ data: application }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

// Admin-only GET
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const applications = await prisma.application.findMany({
    where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: applications })
}

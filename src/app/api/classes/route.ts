import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const simple = searchParams.get('simple') === 'true'
  const mine = searchParams.get('mine') === 'true'

  if (simple) {
    let where = {}
    if (mine && session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (teacher) {
        where = { OR: [{ classTeacherId: teacher.id }, { subjects: { some: { teacherId: teacher.id } } }] }
      }
    }
    const classes = await prisma.class.findMany({ where, select: { id: true, name: true, section: true, level: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: classes.map((c) => ({ id: c.id, name: c.section ? `${c.name} ${c.section}` : c.name, level: c.level })) })
  }

  const classes = await prisma.class.findMany({
    include: {
      academicYear: { select: { id: true, name: true } },
      classTeacher: { select: { id: true, name: true } },
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: classes })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = classSchema.parse(body)
    const cls = await prisma.class.create({
      data: {
        name: data.name,
        section: data.section,
        level: data.level,
        capacity: data.capacity,
        classTeacherId: data.classTeacherId || null,
        academicYearId: data.academicYearId,
      },
    })
    return NextResponse.json({ data: cls }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}

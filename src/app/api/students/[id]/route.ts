import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      parents: { select: { id: true, name: true, user: { select: { id: true, email: true } } }, take: 1 },
    },
  })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parent = student.parents[0]
  return NextResponse.json({
    data: {
      ...student,
      email: parent?.user?.email ?? student.guardianEmail ?? null,
      userId: parent?.user?.id ?? null,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = studentSchema.partial().parse(body)

    const alumniData = (body.isAlumni !== undefined) ? {
      isAlumni: !!body.isAlumni,
      ...(body.graduatedAt && { graduatedAt: new Date(body.graduatedAt) }),
      ...(body.alumniNotes !== undefined && { alumniNotes: body.alumniNotes }),
    } : {}

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        name: data.name,
        address: data.address,
        bloodGroup: data.bloodGroup,
        classId: data.classId || null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null,
        photo: data.photo || null,
        dob: data.dob ? new Date(data.dob) : undefined,
        ...alumniData,
      },
    })
    return NextResponse.json({ data: student })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { parents: { include: { students: true } } },
  })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete student (cascades grades, attendance, fees)
  if (student.userId) {
    await prisma.user.delete({ where: { id: student.userId } })
  } else {
    await prisma.student.delete({ where: { id: params.id } })
    // Clean up parent if they have no remaining children
    for (const parent of student.parents) {
      const remaining = parent.students.filter((s) => s.id !== params.id)
      if (remaining.length === 0) {
        await prisma.user.delete({ where: { id: parent.userId } })
      }
    }
  }

  return NextResponse.json({ message: 'Student deleted' })
}

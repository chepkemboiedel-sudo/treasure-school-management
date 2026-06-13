import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { studentSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '10')
  const search = searchParams.get('search') ?? ''
  const classId = searchParams.get('classId')
  const all = searchParams.get('all') === 'true'
  const alumniParam = searchParams.get('alumni')

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { studentId: { contains: search, mode: 'insensitive' as const } },
        { guardianEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(classId && { classId }),
    ...(alumniParam !== null && { isAlumni: alumniParam === 'true' }),
  }

  const include = {
    class: { select: { id: true, name: true, section: true, level: true } },
    parents: {
      select: { id: true, name: true, user: { select: { id: true, email: true } } },
      take: 1,
    },
  }

  const mapStudent = (s: any) => {
    const parent = s.parents?.[0]
    return {
      ...s,
      email: parent?.user?.email ?? s.guardianEmail ?? null,
      userId: parent?.user?.id ?? null,
      parentId: parent?.id ?? null,
      createdAt: s.createdAt.toISOString(),
      dob: s.dob?.toISOString() ?? null,
    }
  }

  if (all) {
    const students = await prisma.student.findMany({ where, include, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: students.map(mapStudent) })
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where, include, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage, take: perPage,
    }),
  ])

  return NextResponse.json({
    data: students.map(mapStudent),
    total, page, perPage, totalPages: Math.ceil(total / perPage),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = studentSchema.parse(body)

    const existsId = await prisma.student.findUnique({ where: { studentId: data.studentId } })
    if (existsId) return NextResponse.json({ error: 'Student ID already in use' }, { status: 400 })

    const guardianEmail = data.guardianEmail.toLowerCase()

    // Find or create the parent account using the guardian email
    let parent = await prisma.parent.findFirst({
      where: { user: { email: guardianEmail } },
    })

    if (!parent) {
      const existingUser = await prisma.user.findUnique({ where: { email: guardianEmail } })
      if (existingUser && existingUser.role !== 'PARENT') {
        return NextResponse.json({ error: 'That email is already registered as a different account type' }, { status: 400 })
      }
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(data.password ?? 'Password@123', 12)
        const newUser = await prisma.user.create({
          data: {
            email: guardianEmail,
            passwordHash,
            role: 'PARENT',
            parent: {
              create: { name: data.guardianName, phone: data.guardianPhone },
            },
          },
          include: { parent: true },
        })
        parent = newUser.parent!
      } else {
        parent = await prisma.parent.findUnique({ where: { userId: existingUser.id } }) ?? null
      }
    }

    if (!parent) return NextResponse.json({ error: 'Failed to create parent account' }, { status: 500 })

    const student = await prisma.student.create({
      data: {
        name: data.name,
        studentId: data.studentId,
        dob: data.dob ? new Date(data.dob) : undefined,
        address: data.address,
        bloodGroup: data.bloodGroup,
        nemisNumber: data.nemisNumber || null,
        medicalConditions: data.medicalConditions || null,
        allergies: data.allergies || null,
        classId: data.classId || undefined,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: guardianEmail,
        photo: data.photo || undefined,
        parents: { connect: { id: parent.id } },
      },
    })

    return NextResponse.json({ data: student }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

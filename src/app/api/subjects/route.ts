import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subjectSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const examId = searchParams.get('examId')

  let where = {}
  if (classId) where = { ...where, classId }
  if (examId) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { classId: true } })
    if (exam) where = { ...where, classId: exam.classId }
  }

  const subjects = await prisma.subject.findMany({
    where,
    include: { class: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: subjects })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const data = subjectSchema.parse(await req.json())
    const subject = await prisma.subject.create({
      data: { name: data.name, code: data.code, classId: data.classId, teacherId: data.teacherId || null },
    })
    return NextResponse.json({ data: subject }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const data = subjectSchema.partial().parse(await req.json())
  const subject = await prisma.subject.update({ where: { id }, data: { name: data.name, code: data.code, teacherId: data.teacherId || null } })
  return NextResponse.json({ data: subject })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await prisma.subject.delete({ where: { id } })
  return NextResponse.json({ message: 'Subject deleted' })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
}).refine((d) => !d.newPassword || d.currentPassword, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify current password if changing password
    if (data.newPassword) {
      const valid = await bcrypt.compare(data.currentPassword ?? '', user.passwordHash)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Check email not taken by someone else
    if (data.email && data.email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } })
      if (taken) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.email) updateData.email = data.email.toLowerCase()
    if (data.newPassword) updateData.passwordHash = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({ where: { id: session.user.id }, data: updateData })

    // Update admin name if provided
    if (data.name && session.user.role === 'ADMIN') {
      await prisma.admin.update({ where: { userId: session.user.id }, data: { name: data.name } })
    }

    return NextResponse.json({ message: 'Profile updated' })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

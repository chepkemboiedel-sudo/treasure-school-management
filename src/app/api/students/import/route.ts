import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

interface CSVRow {
  name: string; studentId: string; classId?: string; dob?: string; bloodGroup?: string
  nemisNumber?: string; address?: string; guardianName: string; guardianPhone: string; guardianEmail: string; password?: string
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return {
      name: row['name'] || row['fullname'] || '',
      studentId: row['studentid'] || row['id'] || '',
      classId: row['classid'] || '',
      dob: row['dob'] || row['dateofbirth'] || '',
      bloodGroup: row['bloodgroup'] || '',
      nemisNumber: row['nemisnumber'] || row['nemis'] || '',
      address: row['address'] || '',
      guardianName: row['guardianname'] || row['parentname'] || '',
      guardianPhone: row['guardianphone'] || row['parentphone'] || '',
      guardianEmail: row['guardianemail'] || row['parentemail'] || row['email'] || '',
      password: row['password'] || '',
    }
  }).filter((r) => r.name && r.studentId && r.guardianEmail)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) return NextResponse.json({ error: 'No valid rows found. Check your CSV format.' }, { status: 400 })

    const results: { row: number; name: string; status: 'success' | 'error'; message?: string }[] = []
    const defaultHash = await bcrypt.hash('Password@123', 12)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const existsId = await prisma.student.findUnique({ where: { studentId: row.studentId } })
        if (existsId) { results.push({ row: i + 2, name: row.name, status: 'error', message: `Student ID ${row.studentId} already in use` }); continue }

        const guardianEmail = row.guardianEmail.toLowerCase()
        let parent = await prisma.parent.findFirst({ where: { user: { email: guardianEmail } } })

        if (!parent) {
          const existingUser = await prisma.user.findUnique({ where: { email: guardianEmail } })
          if (existingUser && existingUser.role !== 'PARENT') {
            results.push({ row: i + 2, name: row.name, status: 'error', message: `${guardianEmail} is already a non-parent user` }); continue
          }
          if (!existingUser) {
            const passwordHash = row.password ? await bcrypt.hash(row.password, 12) : defaultHash
            const newUser = await prisma.user.create({
              data: { email: guardianEmail, passwordHash, role: 'PARENT', parent: { create: { name: row.guardianName, phone: row.guardianPhone } } },
              include: { parent: true },
            })
            parent = newUser.parent!
          } else {
            parent = await prisma.parent.findUnique({ where: { userId: existingUser.id } })
          }
        }

        if (!parent) { results.push({ row: i + 2, name: row.name, status: 'error', message: 'Failed to create parent account' }); continue }

        await prisma.student.create({
          data: {
            name: row.name, studentId: row.studentId,
            dob: row.dob ? new Date(row.dob) : undefined,
            bloodGroup: row.bloodGroup || null, nemisNumber: row.nemisNumber || null, address: row.address || null,
            classId: row.classId || null,
            guardianName: row.guardianName, guardianPhone: row.guardianPhone, guardianEmail,
            parents: { connect: { id: parent.id } },
          },
        })
        results.push({ row: i + 2, name: row.name, status: 'success' })
      } catch (err) {
        results.push({ row: i + 2, name: row.name, status: 'error', message: (err as Error).message })
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    return NextResponse.json({ successCount, total: rows.length, results })
  } catch {
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 })
  }
}

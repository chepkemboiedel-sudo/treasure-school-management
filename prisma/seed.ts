import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── CBC subjects per level ────────────────────────────────────────────────────
const SUBJECTS: Record<string, { name: string; code: string }[]> = {
  PRE_PRIMARY: [
    { name: 'Language Activities', code: 'LANG' },
    { name: 'Mathematical Activities', code: 'MACT' },
    { name: 'Creative Activities', code: 'CREA' },
    { name: 'Environmental Activities', code: 'ENVA' },
    { name: 'Religious Activities', code: 'RELA' },
    { name: 'Pastoral Programme of Instruction (PPI)', code: 'PPI' },
  ],
  LOWER_PRIMARY: [
    { name: 'Indigenous Language', code: 'INDL' },
    { name: 'Kiswahili', code: 'KIS' },
    { name: 'English', code: 'ENG' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Religious Education', code: 'RE' },
    { name: 'Environmental Activities', code: 'ENVA' },
    { name: 'Creative Activities', code: 'CREA' },
  ],
  UPPER_PRIMARY: [
    { name: 'English', code: 'ENG' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Kiswahili', code: 'KIS' },
    { name: 'Religious Education', code: 'RE' },
    { name: 'Agriculture & Nutrition', code: 'AGRI' },
    { name: 'Social Studies', code: 'SS' },
    { name: 'Creative Arts', code: 'CART' },
    { name: 'Science & Technology', code: 'SCI' },
  ],
  JUNIOR_SECONDARY: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Kiswahili', code: 'KIS' },
    { name: 'Social Studies', code: 'SS' },
    { name: 'Agriculture & Home Science', code: 'AGRI' },
    { name: 'Integrated Science & Health Education', code: 'ISCI' },
    { name: 'Pre-Technical Studies & Computer Studies', code: 'TECH' },
    { name: 'Business Studies', code: 'BUS' },
    { name: 'Visual Arts', code: 'VART' },
    { name: 'Performing Arts', code: 'PART' },
    { name: 'Sports & Physical Education', code: 'SPE' },
    { name: 'Religious Education', code: 'RE' },
  ],
}

// Match subject name → teacher specialization
const SUBJECT_SPEC: Record<string, string> = {
  'Mathematics': 'Mathematics',
  'Mathematical Activities': 'Mathematics',
  'English': 'English',
  'Language Activities': 'Language Activities',
  'Kiswahili': 'Kiswahili',
  'Indigenous Language': 'Kiswahili',
  'Integrated Science & Health Education': 'Integrated Science & Health Education',
  'Science & Technology': 'Integrated Science & Health Education',
  'Social Studies': 'Social Studies',
  'Agriculture & Home Science': 'Agriculture & Home Science',
  'Agriculture & Nutrition': 'Agriculture & Home Science',
  'Pre-Technical Studies & Computer Studies': 'Pre-Technical Studies & Computer Studies',
  'Business Studies': 'Business Studies',
  'Visual Arts': 'Visual Arts',
  'Creative Arts': 'Visual Arts',
  'Creative Activities': 'Creative Activities',
  'Performing Arts': 'Performing Arts',
  'Sports & Physical Education': 'Sports & Physical Education',
  'Religious Education': 'Religious Education',
  'Religious Activities': 'Religious Education',
  'Environmental Activities': 'Environmental Activities',
  'Pastoral Programme of Instruction (PPI)': 'Language Activities',
}

// Short code for class label in subject codes
function clsCode(name: string, section: string) {
  return (name.replace('Grade ', 'G').replace(/\s+/g, '') + section).toUpperCase().slice(0, 5)
}

async function main() {
  console.log('🌱 Seeding database…')

  // ── Cleanup (FK order) ──────────────────────────────────────────────────────
  await prisma.grade.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.feePayment.deleteMany()
  await prisma.timetable.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.feeStructure.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.class.updateMany({ data: { classTeacherId: null } })
  await prisma.user.deleteMany()
  await prisma.class.deleteMany()
  await prisma.term.deleteMany()
  await prisma.academicYear.deleteMany()
  console.log('🧹 Cleared')

  const hash = await bcrypt.hash('Password@123', 12)

  // ── Academic year & terms ───────────────────────────────────────────────────
  const year = await prisma.academicYear.create({
    data: { name: '2024-2025', startDate: new Date('2024-01-15'), endDate: new Date('2025-11-30'), isActive: true },
  })
  const term1 = await prisma.term.create({ data: { id: 'seed-term-1', name: 'Term 1', academicYearId: year.id, startDate: new Date('2024-01-15'), endDate: new Date('2024-04-05'), isActive: true } })
  await prisma.term.create({ data: { id: 'seed-term-2', name: 'Term 2', academicYearId: year.id, startDate: new Date('2024-05-06'), endDate: new Date('2024-08-02') } })
  await prisma.term.create({ data: { id: 'seed-term-3', name: 'Term 3', academicYearId: year.id, startDate: new Date('2024-09-02'), endDate: new Date('2024-11-29') } })

  // ── Admin ───────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: { email: 'admin@treasureschool.edu', passwordHash: hash, role: 'ADMIN', admin: { create: { name: 'System Admin', phone: '+254 700 000 000' } } },
  })

  // ── 15 Teachers ─────────────────────────────────────────────────────────────
  const teacherRows = [
    { email: 'teacher1@treasureschool.edu',  name: 'Mary Wanjiku Johnson',    employeeId: 'EMP-001', spec: 'Mathematics' },
    { email: 'teacher2@treasureschool.edu',  name: 'James Omondi Wilson',     employeeId: 'EMP-002', spec: 'English' },
    { email: 'teacher3@treasureschool.edu',  name: 'Sarah Achieng Davis',     employeeId: 'EMP-003', spec: 'Kiswahili' },
    { email: 'teacher4@treasureschool.edu',  name: 'Robert Kamau Brown',      employeeId: 'EMP-004', spec: 'Integrated Science & Health Education' },
    { email: 'teacher5@treasureschool.edu',  name: 'Grace Chebet Rono',       employeeId: 'EMP-005', spec: 'Social Studies' },
    { email: 'teacher6@treasureschool.edu',  name: 'David Mwangi Njoroge',    employeeId: 'EMP-006', spec: 'Agriculture & Home Science' },
    { email: 'teacher7@treasureschool.edu',  name: 'Faith Atieno Ouma',       employeeId: 'EMP-007', spec: 'Pre-Technical Studies & Computer Studies' },
    { email: 'teacher8@treasureschool.edu',  name: 'Peter Kipchoge Mutai',    employeeId: 'EMP-008', spec: 'Business Studies' },
    { email: 'teacher9@treasureschool.edu',  name: 'Anne Wambui Karanja',     employeeId: 'EMP-009', spec: 'Visual Arts' },
    { email: 'teacher10@treasureschool.edu', name: 'John Otieno Okello',      employeeId: 'EMP-010', spec: 'Performing Arts' },
    { email: 'teacher11@treasureschool.edu', name: 'Lucy Njeri Githuku',      employeeId: 'EMP-011', spec: 'Sports & Physical Education' },
    { email: 'teacher12@treasureschool.edu', name: 'Moses Kiptoo Bett',       employeeId: 'EMP-012', spec: 'Religious Education' },
    { email: 'teacher13@treasureschool.edu', name: 'Esther Mumbi Ndungu',     employeeId: 'EMP-013', spec: 'Language Activities' },
    { email: 'teacher14@treasureschool.edu', name: 'Samuel Maina Gichuki',    employeeId: 'EMP-014', spec: 'Environmental Activities' },
    { email: 'teacher15@treasureschool.edu', name: 'Priscilla Auma Otieno',   employeeId: 'EMP-015', spec: 'Creative Activities' },
  ]

  const teachers: { id: string; spec: string }[] = []
  for (const t of teacherRows) {
    const u = await prisma.user.create({
      data: {
        email: t.email, passwordHash: hash, role: 'TEACHER',
        teacher: { create: { name: t.name, employeeId: t.employeeId, specialization: t.spec, phone: `+254 711 000 0${teacherRows.indexOf(t) + 1}` } },
      },
      include: { teacher: true },
    })
    teachers.push({ id: u.teacher!.id, spec: t.spec })
  }
  console.log(`✅ ${teachers.length} teachers`)

  function teacherFor(subjectName: string): string {
    const spec = SUBJECT_SPEC[subjectName]
    return teachers.find((t) => t.spec === spec)?.id ?? teachers[0].id
  }

  // ── 22 Classes (PP1–PP2, Grade 1–9, sections A & B) ────────────────────────
  const classRows = [
    { name: 'PP1',     section: 'A', level: 'PRE_PRIMARY' as const,      ti: 12 },
    { name: 'PP1',     section: 'B', level: 'PRE_PRIMARY' as const,      ti: 13 },
    { name: 'PP2',     section: 'A', level: 'PRE_PRIMARY' as const,      ti: 14 },
    { name: 'PP2',     section: 'B', level: 'PRE_PRIMARY' as const,      ti: 0  },
    { name: 'Grade 1', section: 'A', level: 'LOWER_PRIMARY' as const,    ti: 1  },
    { name: 'Grade 1', section: 'B', level: 'LOWER_PRIMARY' as const,    ti: 2  },
    { name: 'Grade 2', section: 'A', level: 'LOWER_PRIMARY' as const,    ti: 3  },
    { name: 'Grade 2', section: 'B', level: 'LOWER_PRIMARY' as const,    ti: 4  },
    { name: 'Grade 3', section: 'A', level: 'LOWER_PRIMARY' as const,    ti: 5  },
    { name: 'Grade 3', section: 'B', level: 'LOWER_PRIMARY' as const,    ti: 6  },
    { name: 'Grade 4', section: 'A', level: 'UPPER_PRIMARY' as const,    ti: 7  },
    { name: 'Grade 4', section: 'B', level: 'UPPER_PRIMARY' as const,    ti: 8  },
    { name: 'Grade 5', section: 'A', level: 'UPPER_PRIMARY' as const,    ti: 9  },
    { name: 'Grade 5', section: 'B', level: 'UPPER_PRIMARY' as const,    ti: 10 },
    { name: 'Grade 6', section: 'A', level: 'UPPER_PRIMARY' as const,    ti: 11 },
    { name: 'Grade 6', section: 'B', level: 'UPPER_PRIMARY' as const,    ti: 12 },
    { name: 'Grade 7', section: 'A', level: 'JUNIOR_SECONDARY' as const, ti: 0  },
    { name: 'Grade 7', section: 'B', level: 'JUNIOR_SECONDARY' as const, ti: 1  },
    { name: 'Grade 8', section: 'A', level: 'JUNIOR_SECONDARY' as const, ti: 2  },
    { name: 'Grade 8', section: 'B', level: 'JUNIOR_SECONDARY' as const, ti: 3  },
    { name: 'Grade 9', section: 'A', level: 'JUNIOR_SECONDARY' as const, ti: 4  },
    { name: 'Grade 9', section: 'B', level: 'JUNIOR_SECONDARY' as const, ti: 5  },
  ]

  const classes: { id: string; name: string; section: string; level: string }[] = []
  for (const c of classRows) {
    const cls = await prisma.class.create({
      data: { name: c.name, section: c.section, level: c.level, capacity: 35, classTeacherId: teachers[c.ti].id, academicYearId: year.id },
    })
    classes.push({ id: cls.id, name: c.name, section: c.section, level: c.level })
  }
  console.log(`✅ ${classes.length} classes`)

  // ── Subjects (CBC per level) ────────────────────────────────────────────────
  const allSubjects: { id: string; classId: string; classIdx: number }[] = []
  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci]
    const subs = SUBJECTS[cls.level] ?? []
    const label = clsCode(cls.name, cls.section)
    for (const sub of subs) {
      const code = `${sub.code}-${label}`
      const s = await prisma.subject.create({
        data: { name: sub.name, code, classId: cls.id, teacherId: teacherFor(sub.name) },
      })
      allSubjects.push({ id: s.id, classId: cls.id, classIdx: ci })
    }
  }
  console.log(`✅ ${allSubjects.length} subjects`)

  // ── 5 Students per class (110 total) ────────────────────────────────────────
  const femaleNames = ['Alice', 'Grace', 'Mary', 'Sarah', 'Faith', 'Ann', 'Joy', 'Hope', 'Mercy', 'Lydia', 'Ruth', 'Esther', 'Naomi', 'Elizabeth', 'Deborah', 'Miriam', 'Hannah', 'Judith', 'Rachel', 'Leah', 'Priscilla', 'Lilian', 'Pauline', 'Irene', 'Vivian', 'Caroline', 'Diana', 'Agnes', 'Winnie', 'Tabitha']
  const maleNames   = ['James', 'John', 'Peter', 'Paul', 'David', 'Samuel', 'Joseph', 'Moses', 'Daniel', 'Elijah', 'Noah', 'Isaac', 'Jacob', 'Simon', 'Andrew', 'Philip', 'Thomas', 'Mark', 'Luke', 'Timothy', 'Stephen', 'Solomon', 'Brian', 'Kevin', 'Dennis', 'Patrick', 'Collins', 'Victor', 'Allan', 'Edwin']
  const midNames    = ['Wanjiku', 'Omondi', 'Achieng', 'Mwangi', 'Njoroge', 'Kipchoge', 'Mutai', 'Karanja', 'Otieno', 'Bett', 'Gichuki', 'Kosgei', 'Rono', 'Mutua', 'Gitau', 'Mbugua', 'Njeri', 'Chebet', 'Kiprop', 'Njenga', 'Wambui', 'Kamau', 'Ndungu', 'Atieno', 'Adhiambo']
  const surnames    = ['Kamau', 'Wanjiku', 'Omondi', 'Mwangi', 'Njoroge', 'Mutai', 'Karanja', 'Otieno', 'Bett', 'Gichuki', 'Kosgei', 'Rono', 'Gitau', 'Mbugua', 'Njeri', 'Chebet', 'Kiprop', 'Njenga', 'Wambui', 'Ndungu', 'Ochola', 'Simiyu', 'Barasa', 'Wekesa', 'Auma']
  const guardianFN  = ['Peter', 'Jane', 'David', 'Susan', 'Michael', 'Anne', 'George', 'Mary', 'John', 'Grace', 'Robert', 'Alice', 'Joseph', 'Ruth', 'Simon', 'Agnes', 'Philip', 'Esther', 'Moses', 'Lydia', 'Paul', 'Faith', 'Stephen', 'Joy', 'James']

  // Birth year by level
  const birthYears: Record<string, number[]> = {
    PRE_PRIMARY:      [2020, 2019],
    LOWER_PRIMARY:    [2018, 2017, 2016],
    UPPER_PRIMARY:    [2015, 2014, 2013],
    JUNIOR_SECONDARY: [2012, 2011, 2010],
  }
  // Map class name → birth year index within level
  const classNameToOffset: Record<string, number> = {
    'PP1': 0, 'PP2': 1,
    'Grade 1': 0, 'Grade 2': 1, 'Grade 3': 2,
    'Grade 4': 0, 'Grade 5': 1, 'Grade 6': 2,
    'Grade 7': 0, 'Grade 8': 1, 'Grade 9': 2,
  }

  let n = 0
  const studentIds: string[] = []

  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci]
    const byrs = birthYears[cls.level] ?? [2010]
    const byr  = byrs[classNameToOffset[cls.name] ?? 0] ?? 2012

    for (let si = 0; si < 5; si++) {
      n++
      const female = n % 2 === 0
      const first  = female ? femaleNames[(n - 1) % femaleNames.length] : maleNames[(n - 1) % maleNames.length]
      const mid    = midNames[(n + si) % midNames.length]
      const sur    = surnames[(ci * 3 + si) % surnames.length]
      const gFirst = guardianFN[(ci * 5 + si) % guardianFN.length]
      const gSur   = surnames[(ci + si + 5) % surnames.length]
      const sid    = `STU-${String(n).padStart(3, '0')}`

      const u = await prisma.user.create({
        data: {
          email: `student${n}@treasureschool.edu`,
          passwordHash: hash,
          role: 'STUDENT',
          student: {
            create: {
              name: `${first} ${mid} ${sur}`,
              studentId: sid,
              classId: cls.id,
              dob: new Date(byr, (n * 3) % 12, (si * 5 + 1) % 28 + 1),
              bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][n % 5],
              guardianName: `${gFirst} ${gSur}`,
              guardianPhone: `+254 722 ${String(100000 + n).slice(1)}`,
              guardianEmail: `parent${n}@example.com`,
            },
          },
        },
        include: { student: true },
      })
      studentIds.push(u.student!.id)
    }
  }
  console.log(`✅ ${studentIds.length} students (5 per class)`)

  // ── Sample exam + grades for Grade 7A ───────────────────────────────────────
  const g7aIdx = classes.findIndex((c) => c.name === 'Grade 7' && c.section === 'A')
  if (g7aIdx >= 0) {
    const g7a = classes[g7aIdx]
    const exam = await prisma.exam.create({
      data: { name: 'Summative Assessment 1', classId: g7a.id, termId: term1.id, examType: 'SUMMATIVE', date: new Date('2024-02-20'), totalMarks: 100, passingMarks: 40 },
    })
    const g7aStudents = studentIds.slice(g7aIdx * 5, g7aIdx * 5 + 5)
    const g7aSubjects = allSubjects.filter((s) => s.classIdx === g7aIdx)
    const markSets = [[85, 78, 90, 72, 88, 95, 62, 70, 55, 80, 75, 91], [70, 65, 55, 80, 75, 60, 88, 72, 90, 45, 50, 68], [92, 88, 95, 85, 91, 78, 65, 80, 70, 95, 88, 92], [45, 50, 38, 60, 55, 42, 70, 35, 48, 65, 72, 40], [78, 82, 75, 90, 68, 55, 80, 72, 88, 60, 45, 85]]
    for (let si = 0; si < g7aStudents.length; si++) {
      const marks = markSets[si] ?? markSets[0]
      for (let subIdx = 0; subIdx < Math.min(g7aSubjects.length, marks.length); subIdx++) {
        const m = marks[subIdx]
        const grade = m >= 80 ? 'EE' : m >= 60 ? 'ME' : m >= 40 ? 'AE' : 'BE'
        const label = { EE: 'Exceeding Expectations', ME: 'Meeting Expectations', AE: 'Approaching Expectations', BE: 'Below Expectations' }[grade]!
        await prisma.grade.create({
          data: { studentId: g7aStudents[si], examId: exam.id, subjectId: g7aSubjects[subIdx].id, marks: m, grade, remarks: `${grade} — ${label}` },
        })
      }
    }
    // Sample attendance (last 5 days) for Grade 7A
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let d = 4; d >= 0; d--) {
      const date = new Date(today); date.setDate(today.getDate() - d)
      const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'] as const
      for (let si = 0; si < g7aStudents.length; si++) {
        await prisma.attendance.create({
          data: { studentId: g7aStudents[si], classId: g7a.id, date, status: statuses[si % statuses.length], markedById: teachers[0].id },
        })
      }
    }
    console.log('✅ Grade 7A sample exam, grades & attendance')
  }

  // ── Announcements ────────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      { title: 'Welcome to Term 1 — 2024/2025', content: 'We warmly welcome all learners and staff back to The Treasure School for the 2024–2025 academic year under the CBC curriculum. Classes begin January 15th.', targetRole: null, authorId: adminUser.id },
      { title: 'CBC Formative Assessment Guide', content: 'All teachers: formative assessments must be recorded throughout the term using the CBC performance rubric (EE/ME/AE/BE). Portfolios must be updated accordingly.', targetRole: 'TEACHER', authorId: adminUser.id },
      { title: 'Term 1 Fee Payment Deadline', content: 'Term 1 fee payment deadline is January 31st. Contact the school office for payment plan arrangements.', targetRole: 'PARENT', authorId: adminUser.id },
    ],
  })

  console.log('\n🎉 Seeding complete!')
  console.log(`\n📊 15 teachers | ${classes.length} classes | ${studentIds.length} students | ${allSubjects.length} subjects`)
  console.log('\n📋 Login credentials (all use: Password@123)')
  console.log('   Admin:   admin@treasureschool.edu')
  console.log('   Teacher: teacher1@treasureschool.edu  …  teacher15@treasureschool.edu')
  console.log('   Student: student1@treasureschool.edu  …  student110@treasureschool.edu')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

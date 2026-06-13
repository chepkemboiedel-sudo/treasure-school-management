import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const studentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  dob: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  nemisNumber: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  classId: z.string().optional(),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianPhone: z.string().min(7, 'Guardian phone is required'),
  guardianEmail: z.string().email('Parent login email required'),
  photo: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters').optional(),
})

export const teacherSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  photo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters').optional(),
})

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  level: z.enum(['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SECONDARY']).default('JUNIOR_SECONDARY'),
  capacity: z.coerce.number().min(1).max(200),
  classTeacherId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
})

export const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  classId: z.string().min(1, 'Class is required'),
  teacherId: z.string().optional(),
})

export const attendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      note: z.string().optional(),
    })
  ),
})

export const gradeSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  marks: z.coerce.number().min(0),
  remarks: z.string().optional(),
})

export const examSchema = z.object({
  name: z.string().min(1, 'Assessment name is required'),
  classId: z.string().min(1, 'Class is required'),
  termId: z.string().min(1, 'Term is required'),
  examType: z.enum(['FORMATIVE', 'SUMMATIVE']).default('SUMMATIVE'),
  date: z.string().optional(),
  totalMarks: z.coerce.number().min(1),
  passingMarks: z.coerce.number().min(1),
})

export const feeStructureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().min(0),
  feeType: z.enum(['TUITION', 'TRANSPORT', 'ACTIVITY', 'UNIFORM', 'EXAM', 'OTHER']),
  level: z.enum(['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SECONDARY']).optional(),
  classId: z.string().optional(),
  termId: z.string().min(1, 'Term is required'),
})

export const feePaymentSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1),
  amount: z.coerce.number().min(0),
  paymentDate: z.string().min(1),
  paymentMethod: z.string().min(1),
  mpesaCode: z.string().optional(),
  status: z.enum(['PAID', 'PARTIAL', 'UNPAID']),
  notes: z.string().optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetRole: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).optional(),
  classId: z.string().optional(),
})

export const timetableSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional(),
})

export const academicYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

export const termSchema = z.object({
  name: z.string().min(1),
  academicYearId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID'
export type FeeType = 'TUITION' | 'TRANSPORT' | 'ACTIVITY' | 'UNIFORM' | 'EXAM' | 'OTHER'
export type Day = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalFeesCollected: number
  pendingFees: number
  todayAttendanceRate: number
  recentAnnouncements: number
}

export interface StudentWithClass {
  id: string
  studentId: string
  name: string
  email: string | null
  photo: string | null
  bloodGroup: string | null
  guardianName: string
  guardianPhone: string
  guardianEmail: string | null
  address: string | null
  dob: string | null
  classId: string | null
  class: { id: string; name: string; section: string | null } | null
  createdAt: string
}

export interface TeacherWithUser {
  id: string
  employeeId: string
  name: string
  email: string
  photo: string | null
  phone: string | null
  specialization: string | null
  subjects: { id: string; name: string; class: { name: string } }[]
  createdAt: string
}

export interface ClassWithDetails {
  id: string
  name: string
  section: string | null
  level: 'PRE_PRIMARY' | 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SECONDARY'
  capacity: number
  academicYearId: string
  academicYear: { id: string; name: string }
  classTeacherId: string | null
  classTeacher: { id: string; name: string } | null
  _count: { students: number; subjects: number }
}

export interface SubjectWithDetails {
  id: string
  name: string
  code: string
  classId: string
  class: { id: string; name: string }
  teacherId: string | null
  teacher: { id: string; name: string } | null
}

export interface AttendanceRecord {
  id: string
  date: string
  status: AttendanceStatus
  note: string | null
  student: { id: string; name: string; studentId: string }
  class: { id: string; name: string }
  markedBy: { id: string; name: string }
}

export interface GradeRecord {
  id: string
  marks: number
  grade: string | null
  remarks: string | null
  student: { id: string; name: string; studentId: string }
  exam: { id: string; name: string; totalMarks: number }
  subject: { id: string; name: string; code: string }
}

export interface FeePaymentRecord {
  id: string
  amount: string
  paymentDate: string
  receiptNumber: string
  paymentMethod: string
  status: PaymentStatus
  notes: string | null
  student: { id: string; name: string; studentId: string }
  feeStructure: { id: string; name: string; amount: string; feeType: FeeType }
}

export interface AnnouncementRecord {
  id: string
  title: string
  content: string
  targetRole: Role | null
  classId: string | null
  class: { id: string; name: string } | null
  author: { id: string; email: string; admin?: { name: string } | null; teacher?: { name: string } | null }
  createdAt: string
}

export interface TimetableSlot {
  id: string
  dayOfWeek: Day
  startTime: string
  endTime: string
  room: string | null
  class: { id: string; name: string }
  subject: { id: string; name: string; code: string }
  teacher: { id: string; name: string }
}

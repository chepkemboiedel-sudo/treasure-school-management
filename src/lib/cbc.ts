export const CLASS_LEVELS = [
  { value: 'PRE_PRIMARY', label: 'Pre-Primary (PP1–PP2)' },
  { value: 'LOWER_PRIMARY', label: 'Lower Primary (Grades 1–3)' },
  { value: 'UPPER_PRIMARY', label: 'Upper Primary (Grades 4–6)' },
  { value: 'JUNIOR_SECONDARY', label: 'Junior Secondary (Grades 7–9)' },
] as const

export type ClassLevel = 'PRE_PRIMARY' | 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SECONDARY'

export const CLASS_LEVEL_LABEL: Record<ClassLevel, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
}

export const CLASS_LEVEL_GRADES: Record<ClassLevel, string[]> = {
  PRE_PRIMARY: ['PP1', 'PP2'],
  LOWER_PRIMARY: ['Grade 1', 'Grade 2', 'Grade 3'],
  UPPER_PRIMARY: ['Grade 4', 'Grade 5', 'Grade 6'],
  JUNIOR_SECONDARY: ['Grade 7', 'Grade 8', 'Grade 9'],
}

export const CBC_SUBJECTS: Record<ClassLevel, string[]> = {
  PRE_PRIMARY: [
    'Language Activities',
    'Mathematical Activities',
    'Creative Activities',
    'Environmental Activities',
    'Religious Activities',
    'Pastoral Programme of Instruction (PPI)',
  ],
  LOWER_PRIMARY: [
    'Indigenous Language',
    'Kiswahili',
    'English',
    'Mathematics',
    'Religious Education',
    'Environmental Activities',
    'Creative Activities',
  ],
  UPPER_PRIMARY: [
    'English',
    'Mathematics',
    'Kiswahili',
    'Religious Education',
    'Agriculture & Nutrition',
    'Social Studies',
    'Creative Arts',
    'Science & Technology',
  ],
  JUNIOR_SECONDARY: [
    'Mathematics',
    'English',
    'Kiswahili',
    'Social Studies',
    'Agriculture & Home Science',
    'Integrated Science & Health Education',
    'Pre-Technical Studies & Computer Studies',
    'Business Studies',
    'Visual Arts',
    'Performing Arts',
    'Sports & Physical Education',
    'Religious Education',
  ],
}

export const ALL_CBC_SUBJECTS = Array.from(new Set(Object.values(CBC_SUBJECTS).flat())).sort()

// Auto-generate a short subject code from name
export function subjectCode(name: string): string {
  return name
    .split(/[\s&]+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 5)
}

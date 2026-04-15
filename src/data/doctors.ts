import { Doctor } from '../types'
import { addDays, format } from 'date-fns'

const today = new Date()

function generateSlots(doctorId: string, count: number) {
  const slots = []
  let slotId = 0
  const times = [
    { start: '09:00 AM', end: '09:30 AM' },
    { start: '10:00 AM', end: '10:30 AM' },
    { start: '11:00 AM', end: '11:30 AM' },
    { start: '02:00 PM', end: '02:30 PM' },
    { start: '03:00 PM', end: '03:30 PM' },
    { start: '04:00 PM', end: '04:30 PM' },
  ]
  for (let d = 0; d < 7; d++) {
    const date = addDays(today, d)
    const dateStr = format(date, 'yyyy-MM-dd')
    for (const t of times) {
      if (slotId >= count * 6) break
      slots.push({
        id: `${doctorId}-slot-${slotId++}`,
        date: dateStr,
        startTime: t.start,
        endTime: t.end,
        available: Math.random() > 0.3,
      })
    }
    if (slotId >= count * 6) break
  }
  return slots
}

// backendId must match the doctor's integer primary key in the database.
// Seed your DB with these five doctors so IDs line up.
export const DOCTORS: Doctor[] = [
  {
    id: 'dr-sarah-jenkins',
    backendId: 1,
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cardiologist',
    experience: '12 years',
    languages: ['English', 'Spanish'],
    calendarEmail: 'sarah.jenkins@telehealthplus.com',
    bio: 'Heart health specialist focused on preventive care, hypertension, and post-diagnosis care planning.',
    rating: 4.9,
    reviewCount: 248,
    avatar: 'SJ',
    isVerified: true,
    availableSlots: generateSlots('dr-sarah-jenkins', 4),
  },
  {
    id: 'dr-marcus-webb',
    backendId: 2,
    name: 'Dr. Marcus Webb',
    specialty: 'General Physician',
    experience: '9 years',
    languages: ['English'],
    calendarEmail: 'marcus.webb@telehealthplus.com',
    bio: 'Primary care doctor helping patients with general consultations, medication guidance, and follow-up care.',
    rating: 4.7,
    reviewCount: 192,
    avatar: 'MW',
    isVerified: true,
    availableSlots: generateSlots('dr-marcus-webb', 3),
  },
  {
    id: 'dr-priya-nair',
    backendId: 3,
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    experience: '8 years',
    languages: ['English', 'Hindi', 'Tamil'],
    calendarEmail: 'priya.nair@telehealthplus.com',
    bio: 'Board-certified dermatologist specializing in skin conditions, acne treatment, and cosmetic dermatology.',
    rating: 4.8,
    reviewCount: 176,
    avatar: 'PN',
    isVerified: true,
    availableSlots: generateSlots('dr-priya-nair', 5),
  },
  {
    id: 'dr-james-okafor',
    backendId: 4,
    name: 'Dr. James Okafor',
    specialty: 'Neurologist',
    experience: '15 years',
    languages: ['English', 'French'],
    calendarEmail: 'james.okafor@telehealthplus.com',
    bio: 'Neurology expert focusing on headache disorders, epilepsy, and neurodegenerative conditions.',
    rating: 4.9,
    reviewCount: 310,
    avatar: 'JO',
    isVerified: true,
    availableSlots: generateSlots('dr-james-okafor', 2),
  },
  {
    id: 'dr-emily-chen',
    backendId: 5,
    name: 'Dr. Emily Chen',
    specialty: 'Pediatrician',
    experience: '11 years',
    languages: ['English', 'Mandarin'],
    calendarEmail: 'emily.chen@telehealthplus.com',
    bio: 'Child health specialist dedicated to newborn care, vaccinations, and developmental monitoring.',
    rating: 4.8,
    reviewCount: 265,
    avatar: 'EC',
    isVerified: true,
    availableSlots: generateSlots('dr-emily-chen', 6),
  },
]

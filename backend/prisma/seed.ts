import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Generate 30-min slots from 9:00 AM to 5:00 PM for N days starting today
function buildSlots(doctorId: string, days = 30): { doctorId: string; startAt: Date; endAt: Date }[] {
  const slots: { doctorId: string; startAt: Date; endAt: Date }[] = []
  const today = new Date()

  for (let d = 0; d < days; d++) {
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
    for (let m = 9 * 60; m < 17 * 60; m += 30) {
      const startAt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(m / 60), m % 60)
      const endAt   = new Date(startAt.getTime() + 30 * 60 * 1000)
      slots.push({ doctorId, startAt, endAt })
    }
  }

  return slots
}

async function main() {
  console.log('🌱 Seeding database...')

  // ── Clean existing seed data (safe re-run) ─────────────────────────────────
  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.hospital.deleteMany()

  // ── Hospital ───────────────────────────────────────────────────────────────
  const hospital = await prisma.hospital.create({
    data: {
      name:     'City General Hospital',
      location: 'Colombo, Sri Lanka',
    },
  })
  console.log(`✅ Hospital created: ${hospital.name} (${hospital.id})`)

  // ── Doctors ────────────────────────────────────────────────────────────────
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name:           'Dr. Sarah Mitchell',
        specialization: 'Cardiology',
        calendarEmail:  'sarah.mitchell@citygeneralhospital.com',
        hospitalId:     hospital.id,
      },
    }),
    prisma.doctor.create({
      data: {
        name:           'Dr. James Okafor',
        specialization: 'General Practice',
        calendarEmail:  'james.okafor@citygeneralhospital.com',
        hospitalId:     hospital.id,
      },
    }),
    prisma.doctor.create({
      data: {
        name:           'Dr. Priya Sharma',
        specialization: 'Internal Medicine',
        calendarEmail:  'priya.sharma@citygeneralhospital.com',
        hospitalId:     hospital.id,
      },
    }),
  ])

  doctors.forEach((d) =>
    console.log(`✅ Doctor created: ${d.name} — ${d.specialization} (${d.id})`),
  )

  // ── Slots ──────────────────────────────────────────────────────────────────
  let totalSlots = 0
  for (const doctor of doctors) {
    const slots = buildSlots(doctor.id, 30)
    await prisma.slot.createMany({ data: slots })
    totalSlots += slots.length
  }
  console.log(`✅ Slots created: ${totalSlots} (${doctors.length} doctors × 30 days × 16 slots/day)`)

  console.log('\n🎉 Seed complete.')
  console.log(`   Hospital : ${hospital.id}`)
  console.log(`   Doctors  : ${doctors.map((d) => d.id).join(', ')}`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

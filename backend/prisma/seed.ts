import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ── Clean existing seed data (safe re-run) ─────────────────────────────────
  await prisma.booking.deleteMany()
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

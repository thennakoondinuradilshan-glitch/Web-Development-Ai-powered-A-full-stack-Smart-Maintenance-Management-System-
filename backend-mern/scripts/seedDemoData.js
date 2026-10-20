require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');

const mongoUrl =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/smart_maintenance';

const demoEquipment = [
  {
    name: 'Demo Air Conditioner A1',
    location: 'Laboratory 1',
    status: 'ACTIVE',
    description: 'Split AC unit used for the main laboratory.'
  },
  {
    name: 'Demo Air Conditioner A2',
    location: 'Laboratory 2',
    status: 'UNDER_MAINTENANCE',
    description: 'Cooling unit awaiting filter and compressor inspection.'
  },
  {
    name: 'Demo Air Conditioner A3',
    location: 'Server Room',
    status: 'ACTIVE',
    description: 'Temperature-controlled server room AC unit.'
  },
  {
    name: 'Demo Air Conditioner A4',
    location: 'Workshop',
    status: 'INACTIVE',
    description: 'Retired unit kept for maintenance history demonstration.'
  }
];

async function findOrCreateEquipment(definition) {
  const existing = await Equipment.findOne({
    name: definition.name,
    location: definition.location
  });

  if (existing) return { record: existing, created: false };

  return { record: await Equipment.create(definition), created: true };
}

async function findOrCreateRequest(definition) {
  const existing = await MaintenanceRequest.findOne({
    title: definition.title,
    equipment: definition.equipment
  });

  if (existing) return { record: existing, created: false };

  return { record: await MaintenanceRequest.create(definition), created: true };
}

async function findOrCreateSchedule(definition) {
  const existing = await MaintenanceSchedule.findOne({
    title: definition.title,
    equipment: definition.equipment
  });

  if (existing) return { record: existing, created: false };

  return { record: await MaintenanceSchedule.create(definition), created: true };
}

async function seedOptionalUsers() {
  if (process.env.DEMO_SEED_USERS !== 'true') {
    return { created: 0, skipped: 'Set DEMO_SEED_USERS=true to opt in.' };
  }

  const password = process.env.DEMO_SEED_PASSWORD;

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    throw new Error(
      'DEMO_SEED_PASSWORD must be 8-72 characters when DEMO_SEED_USERS=true'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const users = [
    {
      name: 'Demo Technician',
      email: 'demo.technician@smart-maintenance.local',
      role: 'TECHNICIAN'
    },
    {
      name: 'Demo Viewer',
      email: 'demo.viewer@smart-maintenance.local',
      role: 'USER'
    }
  ];

  let created = 0;

  for (const user of users) {
    const existing = await User.findOne({ email: user.email });

    if (existing) continue;

    await User.create({ ...user, passwordHash });
    created += 1;
  }

  return { created };
}

async function main() {
  await mongoose.connect(mongoUrl);

  const admin = await User.findOne({ role: 'ADMIN' }).select('_id');

  if (!admin) {
    throw new Error('An existing ADMIN account is required to seed demo data.');
  }

  const equipmentResults = [];

  for (const definition of demoEquipment) {
    equipmentResults.push(await findOrCreateEquipment(definition));
  }

  const equipmentByName = new Map(
    equipmentResults.map(({ record }) => [record.name, record])
  );

  const requests = [
    {
      title: 'Demo AC A2 filter replacement',
      description: 'Replace clogged filters and inspect airflow performance.',
      equipment: equipmentByName.get('Demo Air Conditioner A2')._id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdBy: admin._id
    },
    {
      title: 'Demo AC A3 temperature check',
      description: 'Check the server room temperature sensor and cooling cycle.',
      equipment: equipmentByName.get('Demo Air Conditioner A3')._id,
      priority: 'MEDIUM',
      status: 'PENDING',
      createdBy: admin._id
    },
    {
      title: 'Demo AC A4 retirement inspection',
      description: 'Record final condition before decommissioning the unit.',
      equipment: equipmentByName.get('Demo Air Conditioner A4')._id,
      priority: 'LOW',
      status: 'COMPLETED',
      createdBy: admin._id
    }
  ];

  const requestResults = [];

  for (const definition of requests) {
    requestResults.push(await findOrCreateRequest(definition));
  }

  const now = Date.now();
  const schedules = [
    {
      title: 'Demo AC A1 monthly inspection',
      description: 'Inspect filters, refrigerant pressure and electrical connections.',
      equipment: equipmentByName.get('Demo Air Conditioner A1')._id,
      dueDate: new Date(now + 24 * 60 * 60 * 1000),
      frequency: 'MONTHLY'
    },
    {
      title: 'Demo AC A2 overdue service',
      description: 'Review the maintenance backlog and complete the service checklist.',
      equipment: equipmentByName.get('Demo Air Conditioner A2')._id,
      dueDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
      frequency: 'ONCE'
    },
    {
      title: 'Demo AC A3 quarterly preventive service',
      description: 'Perform quarterly preventive maintenance for server room cooling.',
      equipment: equipmentByName.get('Demo Air Conditioner A3')._id,
      dueDate: new Date(now + 5 * 24 * 60 * 60 * 1000),
      frequency: 'QUARTERLY'
    }
  ];

  const scheduleResults = [];

  for (const definition of schedules) {
    scheduleResults.push(await findOrCreateSchedule(definition));
  }

  const optionalUsers = await seedOptionalUsers();

  console.log(JSON.stringify({
    equipmentCreated: equipmentResults.filter(item => item.created).length,
    requestsCreated: requestResults.filter(item => item.created).length,
    schedulesCreated: scheduleResults.filter(item => item.created).length,
    optionalUsers
  }));
}

main()
  .catch(error => {
    console.error('Demo data seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

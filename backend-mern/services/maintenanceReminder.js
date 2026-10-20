
const cron = require('node-cron');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const { sendEmail } = require('./emailService');

const TIME_ZONE = 'Asia/Colombo';

let schedulerStarted = false;
let reminderRunInProgress = false;

function dateKey(value) {
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const get = type => parts.find(p => p.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dayDifference(from, to) {
  return (
    Date.parse(`${to}T00:00:00Z`) -
    Date.parse(`${from}T00:00:00Z`)
  ) / 86400000;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function runMaintenanceReminders() {
  if (reminderRunInProgress) {
    console.log('Maintenance reminder run already in progress.');
    return;
  }

  reminderRunInProgress = true;

  try {
    const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!recipient) {
      console.error(
        'ADMIN_NOTIFICATION_EMAIL is missing from .env'
      );
      return;
    }

    const today = dateKey(new Date());
    const now = new Date();

    const schedules = await MaintenanceSchedule.find({
      status: 'SCHEDULED'
    })
      .populate('equipment', 'name location')
      .sort({ dueDate: 1 });

    const groups = {
      overdue: [],
      dueToday: [],
      upcoming: []
    };

    const trackingFields = {
      overdue: 'overdueSentAt',
      dueToday: 'dueTodaySentAt',
      upcoming: 'upcomingSentAt'
    };

    for (const schedule of schedules) {
      const due = dateKey(schedule.dueDate);
      const tracking = schedule.reminderTracking || {};

      let group;

      if (due < today) {
        group = 'overdue';
      } else if (due === today) {
        group = 'dueToday';
      } else if (dayDifference(today, due) <= 3) {
        group = 'upcoming';
      } else {
        continue;
      }

      const sentAt = tracking[trackingFields[group]];

      // Send each category at most once per Sri Lankan calendar day.
      if (sentAt && dateKey(sentAt) === today) {
        continue;
      }

      groups[group].push(schedule);
    }

    const total = Object.values(groups)
      .reduce((sum, items) => sum + items.length, 0);

    if (total === 0) {
      console.log('No new maintenance reminders to send.');
      return;
    }

    const headings = {
      overdue: 'OVERDUE MAINTENANCE',
      dueToday: 'MAINTENANCE DUE TODAY',
      upcoming: 'UPCOMING MAINTENANCE (NEXT 3 DAYS)'
    };

    const textSections = [];
    const htmlSections = [];

    for (const [group, items] of Object.entries(groups)) {
      if (items.length === 0) continue;

      textSections.push(headings[group]);

      const rows = items.map(schedule => {
        const equipmentName =
          schedule.equipment?.name || 'Unknown equipment';

        const location =
          schedule.equipment?.location || 'Unknown location';

        return [
          `- ${schedule.title}`,
          `  Equipment: ${equipmentName}`,
          `  Location: ${location}`,
          `  Due: ${dateKey(schedule.dueDate)}`
        ].join('\n');
      });

      textSections.push(rows.join('\n'));

      const htmlRows = items.map(schedule => `
        <li style="margin-bottom:12px">
          <strong>${escapeHtml(schedule.title)}</strong><br>
          Equipment: ${escapeHtml(
            schedule.equipment?.name || 'Unknown equipment'
          )}<br>
          Location: ${escapeHtml(
            schedule.equipment?.location || 'Unknown location'
          )}<br>
          Due date: ${escapeHtml(dateKey(schedule.dueDate))}
        </li>
      `).join('');

      htmlSections.push(`
        <h2>${headings[group]}</h2>
        <ul>${htmlRows}</ul>
      `);
    }

    await sendEmail({
      to: recipient,
      subject: `Smart Maintenance Daily Reminder - ${today}`,
      text: [
        `Smart Maintenance daily summary (${today})`,
        '',
        ...textSections
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h1>Smart Maintenance Daily Summary</h1>
          <p>Date: ${today}</p>
          ${htmlSections.join('')}
        </div>
      `
    });

    // Update tracking only after the email was accepted by the mail server.
    for (const [group, items] of Object.entries(groups)) {
      const field = trackingFields[group];

      for (const schedule of items) {
        await MaintenanceSchedule.updateOne(
          { _id: schedule._id },
          { $set: { [`reminderTracking.${field}`]: now } }
        );
      }
    }

    console.log(
      `Maintenance reminder email sent to admin: ${total} schedule(s).`
    );
  } catch (error) {
    console.error(
      'Maintenance reminder failed:',
      error.message
    );
  } finally {
    reminderRunInProgress = false;
  }
}

function startMaintenanceReminderScheduler() {
  if (schedulerStarted) return;

  cron.schedule(
    '0 8 * * *',
    () => {
      runMaintenanceReminders();
    },
    { timezone: TIME_ZONE }
  );

  schedulerStarted = true;

  console.log(
    'Maintenance reminder scheduler started (daily at 08:00 Asia/Colombo).'
  );
}

module.exports = {
  startMaintenanceReminderScheduler,
  runMaintenanceReminders
};

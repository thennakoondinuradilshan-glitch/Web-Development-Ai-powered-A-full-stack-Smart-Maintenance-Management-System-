
require('dotenv').config();

const { sendEmail } = require('./emailService');

async function main() {
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!recipient) {
    throw new Error(
      'ADMIN_NOTIFICATION_EMAIL is missing from .env'
    );
  }

  await sendEmail({
    to: recipient,
    subject: 'Smart Maintenance - Email Test',
    text: [
      'Hello Admin,',
      '',
      'This is a test email from your Smart Maintenance System.',
      'Your email configuration is working.',
      '',
      'Automated maintenance reminders will be tested separately.'
    ].join('\n')
  });

  console.log(`Test email accepted by mail server for ${recipient}`);
}

main().catch(error => {
  console.error('Email test failed:', error.message);
  process.exitCode = 1;
});


const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      'EMAIL_USER and EMAIL_APP_PASSWORD must be configured in .env'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!to || typeof to !== 'string') {
    throw new Error('A valid recipient email is required');
  }

  return getTransporter().sendMail({
    from: `"Smart Maintenance" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {})
  });
}

async function verifyEmailConnection() {
  return getTransporter().verify();
}

module.exports = {
  sendEmail,
  verifyEmailConnection
};

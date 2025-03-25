require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.hostinger.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true, // true for 465 (SSL)
  auth: {
    user: process.env.SMTP_USER, // no-reply@giantinfotech.in
    pass: process.env.SMTP_PASS, // AsiaPacific@2025
  },
  tls: {
    rejectUnauthorized: false, // For testing
  },
});

const sendMail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL, // no-reply@giantinfotech.in
      to,
      subject,
      text,
      html,
    };
    console.log(`Attempting to send email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

module.exports = { sendMail };
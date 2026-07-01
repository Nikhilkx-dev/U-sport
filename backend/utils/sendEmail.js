const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true, // Log to console
  debug: true,  // Include SMTP traffic in the logs
  connectionTimeout: 20000, // 20 seconds timeout
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"U-SPORT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>U-SPORT Login OTP</h2>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });
    console.log(`[Email] OTP successfully sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email Error] Failed to send OTP to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendOTPEmail;
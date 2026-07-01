const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds timeout
  greetingTimeout: 5000,
  socketTimeout: 15000,
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
  } catch (error) {
    console.error(`[Email Error] Failed to send OTP to ${email}:`, error.message);
    throw new Error('Failed to send OTP email. Please check your email address or try again later.');
  }
};

module.exports = sendOTPEmail;
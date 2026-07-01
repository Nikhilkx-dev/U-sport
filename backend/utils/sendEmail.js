const { Resend } = require('resend');

// We expect RESEND_API_KEY and EMAIL_FROM to be set in environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    const data = await resend.emails.send({
      from: `U-SPORT <${fromEmail}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>U-SPORT Login OTP</h2>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });

    if (data.error) {
      console.error(`[Email Error] Resend API error for ${email}:`, data.error.message);
      return { success: false, error: data.error.message };
    }

    console.log(`[Email] OTP successfully sent to ${email} via Resend. ID: ${data.data.id}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email Error] Exception while sending OTP to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendOTPEmail;
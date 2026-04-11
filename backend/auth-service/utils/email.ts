import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const generateVerificationCode = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mã xác thực tài khoản EduLearn',
      html: `
        <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <tr>
            <td style="text-align: center; padding: 20px; background-color: #f0f0f0;">
              <h2 style="color: #333; margin: 0;">EduLearn</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fff;">
              <h3 style="color: #333;">Xác thực email của bạn</h3>
              <p style="color: #666; font-size: 16px;">
                Mã xác thực của bạn sẽ hết hạn trong <strong>3 phút</strong>. Vui lòng nhập mã này để hoàn tất đăng ký.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                  ${code}
                </div>
              </div>
              <p style="color: #999; font-size: 14px;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 20px; background-color: #f0f0f0; color: #999; font-size: 12px;">
              <p>&copy; 2026 EduLearn. All rights reserved.</p>
            </td>
          </tr>
        </table>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

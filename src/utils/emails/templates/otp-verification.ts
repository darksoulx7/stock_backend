import path from 'path';
import fs from 'fs';
import ejs from 'ejs';

class OtpVerificationTemplate {
  public otpVerificationTemplate(templateParams: any): string {
    const { email, otp, date } = templateParams;

    const templatePath = path.join(process.cwd(), 'src/utils/emails/templates/otp-verification-template.ejs');
    console.log('Template Path:', templatePath);

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      return ejs.render(templateContent, {
        email,
        otp,
        date,
        image_url: 'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png',
      });
    } catch (error: any) {
      console.error('Error reading template:', error.message);
      throw new Error('Failed to generate OTP email template');
    }
  }
}

export const otpVerificationTemplate: OtpVerificationTemplate = new OtpVerificationTemplate();
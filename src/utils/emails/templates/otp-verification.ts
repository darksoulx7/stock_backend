import fs from 'fs';
import ejs from 'ejs';
import path from "path";

class OtpVerificationTemplate {
  public otpVerificationTemplate(templateParams: any): string {
    const {  email, otp, date } = templateParams;
    const templatePath = path.join(__dirname,  '../../../../src/utils/emails/templates/otp-verification-template.ejs');

    console.log('directory', __dirname, templatePath);
    return ejs.render(fs.readFileSync(templatePath, 'utf8'), {  email, otp, date,
        image_url: 'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png',
      },
    );
  }
}

export const otpVerificationTemplate: OtpVerificationTemplate = new OtpVerificationTemplate();
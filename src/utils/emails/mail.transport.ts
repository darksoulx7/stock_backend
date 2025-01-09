import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

class MailTransport {
  public async sendEmail(receiverEmail: string, body: string, subject: string): Promise<void> {
      this.developmentEmailSender(receiverEmail, subject, body);
  }

  private async developmentEmailSender(receiverEmail: string, subject: string, body: string): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL!,
        pass: process.env.SENDER_EMAIL_PASSWORD!,
      },
    });

    const mailOptions: IMailOptions = {
      from: `Bull Capital <${process.env.SENDER_EMAIL!}>`,
      to: receiverEmail,
      subject,
      html: body,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Development email sent successfully.');
    } catch (error) {
      console.error('Error sending email', error);
      throw new Error('Error sending email');
    }
  }

  // private async productionEmailSender(receiverEmail: string, subject: string, body: string): Promise<void> {
  //   const mailOptions: IMailOptions = {
  //     from: `Chatty App <${config.SENDER_EMAIL!}>`,
  //     to: receiverEmail,
  //     subject,
  //     html: body,
  //   };

  //   try {
  //     await sendGridMail.send(mailOptions);
  //     log.info('Production email sent successfully.');
  //   } catch (error) {
  //     log.error('Error sending email', error);
  //     throw new BadRequestError('Error sending email');
  //   }
  // }
}

export const mailTransport: MailTransport = new MailTransport();
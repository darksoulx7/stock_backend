import axios from 'axios';

const apiKey = 'your_interakt_api_key';
const apiUrl = 'https://api.interakt.ai/v1/messages/send';
const templateName = 'otp_template';

// Function to send OTP via WhatsApp
const sendWhatsAppOtp = async (toPhoneNumber: string, otp: string) => {
  try {
    const payload = {
      apiKey: apiKey,
      to: toPhoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: otp },
              { type: 'text', text: '10' },
            ],
          },
        ],
      },
    };

    const response = await axios.post(apiUrl, payload);

    console.log('OTP sent successfully:', response.data);
  } catch (error: any) {
    console.error('Error sending OTP:', error.response ? error.response.data : error.message);
  }
};

export const sendOtpToPhoneNumber = async (phone_number: string, otp: string) => {
    const indiaPhoneNumberPrefix = '+91';
    const whatsAppNumber = indiaPhoneNumberPrefix + phone_number
  try {
    await sendWhatsAppOtp(phone_number, otp);
  } catch (error) {
    console.error('Error while sending otp to phone number:' , error)
  }
}
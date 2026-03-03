import type { ISmsService } from "./types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twilio = require("twilio");

/**
 * Twilio SMS service for production.
 * Sends real SMS messages via the Twilio API.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  - Twilio Account SID
 *   TWILIO_AUTH_TOKEN   - Twilio Auth Token
 *   TWILIO_PHONE_NUMBER - Twilio sender phone number (E.164 format)
 */
export class TwilioSmsService implements ISmsService {
  private client: ReturnType<typeof twilio>;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    const message = `Votre code de vérification Tawa est: ${code}`;

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      console.log(`[SMS OTP] Twilio: OTP sent to ${phone}`);
      return true;
    } catch (error) {
      console.error(`[SMS OTP] Twilio failed for ${phone}:`, error);
      return false;
    }
  }
}

// Replace with TwilioSmsService or VonageSmsService for production

export interface ISmsService {
  sendOtp(phone: string, code: string): Promise<boolean>;
}

/**
 * Simulated SMS service for development.
 * Logs the OTP code to the console instead of sending a real SMS.
 * Swap this out with TwilioSmsService or VonageSmsService in production.
 */
class SimulatedSmsService implements ISmsService {
  async sendOtp(phone: string, code: string): Promise<boolean> {
    console.log(`[SMS OTP] Code ${code} sent to ${phone}`);
    return true;
  }
}

export const smsService: ISmsService = new SimulatedSmsService();

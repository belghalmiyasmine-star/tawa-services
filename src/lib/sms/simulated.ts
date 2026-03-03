import type { ISmsService } from "./types";

/**
 * Simulated SMS service for development.
 * Logs the OTP code to the console instead of sending a real SMS.
 */
export class SimulatedSmsService implements ISmsService {
  async sendOtp(phone: string, code: string): Promise<boolean> {
    console.log(`[SMS OTP] Code ${code} sent to ${phone}`);
    return true;
  }
}

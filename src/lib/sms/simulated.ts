import type { ISmsService } from "./types";

/**
 * Simulated SMS service for development.
 * Logs the OTP code to the console instead of sending a real SMS.
 */
export class SimulatedSmsService implements ISmsService {
  async sendOtp(_phone: string, _code: string): Promise<boolean> {
    return true;
  }
}

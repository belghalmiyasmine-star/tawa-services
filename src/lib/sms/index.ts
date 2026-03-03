import type { ISmsService } from "./types";
import { SimulatedSmsService } from "./simulated";

export type { ISmsService };

/**
 * SMS service factory with Twilio-to-simulated fallback.
 *
 * - When TWILIO_ACCOUNT_SID is set: uses TwilioSmsService, but if a send
 *   fails, automatically falls back to SimulatedSmsService for that call.
 * - Otherwise: uses SimulatedSmsService directly.
 */
function createSmsService(): ISmsService {
  if (process.env.TWILIO_ACCOUNT_SID) {
    // Dynamic import avoids loading twilio SDK in dev environments
    const { TwilioSmsService } = require("./twilio");
    const twilioService: ISmsService = new TwilioSmsService();
    const fallback = new SimulatedSmsService();

    // Wrap with fallback: if Twilio fails, log and use simulated
    return {
      async sendOtp(phone: string, code: string): Promise<boolean> {
        const success = await twilioService.sendOtp(phone, code);
        if (!success) {
          console.warn(
            `[SMS OTP] Twilio failed, falling back to simulated for ${phone}`,
          );
          return fallback.sendOtp(phone, code);
        }
        return true;
      },
    };
  }

  console.log("[SMS] Using simulated SMS service (no TWILIO_ACCOUNT_SID set)");
  return new SimulatedSmsService();
}

export const smsService: ISmsService = createSmsService();

export interface ISmsService {
  sendOtp(phone: string, code: string): Promise<boolean>;
}

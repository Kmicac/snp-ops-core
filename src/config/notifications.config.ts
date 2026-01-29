import { registerAs } from "@nestjs/config";

export const notificationsConfig = registerAs("notifications", () => {
  const resendApiKey = process.env.RESEND_API_KEY || null;
  const from = process.env.EMAIL_FROM;

  return {
    enabled: !!resendApiKey,
    resendApiKey,
    from,
  };
});

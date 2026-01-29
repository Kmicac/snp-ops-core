import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

type SendEmailParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly enabled: boolean;
  private readonly resendApiKey: string | null;
  private readonly from: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    const notifConfig = this.config.get<{
      enabled: boolean;
      resendApiKey: string | null;
      from: string;
    }>("notifications");

    this.enabled = notifConfig?.enabled ?? false;
    this.resendApiKey = notifConfig?.resendApiKey ?? null;
    this.from = notifConfig?.from ?? "no-reply@snp.local";

    if (!this.enabled) {
      this.logger.warn("Email notifications are DISABLED (no RESEND_API_KEY set)");
    }
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, html, text } = params;

    if (!this.enabled || !this.resendApiKey) {
      this.logger.log(
        `Skipping email to ${to} (notifications disabled). Subject: ${subject}`,
      );
      return;
    }

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject,
        html: html ?? undefined,
        text: text ?? undefined,
      };

      const observable$ = this.http.post(
        "https://api.resend.com/emails",
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      await firstValueFrom(observable$);
      this.logger.log(`Email sent to ${to} - subject: ${subject}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to} - subject: ${subject}`,
        (err as any)?.stack,
      );
    }
  }

  // Ejemplos de métodos de dominio que podemos ir usando después

  async sendWorkOrderStatusChangedEmail(params: {
    to: string;
    workOrderTitle: string;
    status: string;
    eventName: string;
  }) {
    const { to, workOrderTitle, status, eventName } = params;

    const subject = `[${eventName}] Work Order status: ${status}`;
    const text = `La Work Order "${workOrderTitle}" cambió su estado a: ${status}`;
    const html = `<p>La Work Order <strong>${workOrderTitle}</strong> cambió su estado a: <strong>${status}</strong> para el evento <strong>${eventName}</strong>.</p>`;

    await this.sendEmail({ to, subject, text, html });
  }

  async sendTrainingReminderEmail(params: {
    to: string;
    trainingTitle: string;
    startsAt: Date;
  }) {
    const { to, trainingTitle, startsAt } = params;
    const subject = `Recordatorio capacitación: ${trainingTitle}`;
    const text = `Recordatorio: "${trainingTitle}" comienza el ${startsAt.toISOString()}`;
    const html = `<p>Recordatorio: <strong>${trainingTitle}</strong> comienza el ${startsAt.toISOString()}.</p>`;

    await this.sendEmail({ to, subject, text, html });
  }
}

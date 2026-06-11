// @ts-nocheck
import type {
  SendMailOptions as NodemailerSendMailOptions,
  Transporter,
} from "nodemailer";

import type {
  MailProvider,
  MailSendResult,
  SendMailOptions,
} from "../mail.types.js";

export class NodemailerProvider implements MailProvider {
  constructor(private readonly transporter: Transporter) {}

  async send(options: SendMailOptions): Promise<MailSendResult> {
    const payload: NodemailerSendMailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await this.transporter.sendMail(payload);

    return {
      providerId: info.messageId,
    };
  }
}

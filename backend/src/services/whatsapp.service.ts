import logger from "../utils/logger";

export class WhatsAppService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || "";
    this.apiUrl = process.env.WHATSAPP_API_URL || "";
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.apiKey || !this.apiUrl) {
      logger.warn("WhatsApp API not configured. Message not sent.");
      return;
    }

    // Normalize phone number
    const phone = this.normalizePhone(to);

    try {
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
      }

      logger.info(`WhatsApp message sent to ${phone}`);
    } catch (error) {
      logger.error("WhatsApp send error:", error);
      throw error;
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params: string[]
  ): Promise<void> {
    if (!this.apiKey) return;

    const phone = this.normalizePhone(to);
    const components = params.map((param, index) => ({
      type: "body",
      parameters: [{ type: "text", text: param }],
    }));

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components,
        },
      }),
    });

    if (!response.ok) throw new Error("WhatsApp template send failed");
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, "");
    if (normalized.startsWith("0")) normalized = "91" + normalized.slice(1);
    if (!normalized.startsWith("91") && normalized.length === 10) {
      normalized = "91" + normalized;
    }
    return normalized;
  }
}

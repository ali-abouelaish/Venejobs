/**
 * Brevo transactional email client (HTTP API, no SDK dependency).
 *
 * Mirrors backend/utils/emailService.js behavior: when BREVO_API_KEY is
 * missing or the placeholder, every send becomes a console log. This keeps
 * dev environments working without a real Brevo account.
 *
 * All sends here are "fire and forget" from the caller's perspective —
 * errors are logged and swallowed so a Brevo outage never breaks an API
 * request. Callers should rely on logs for delivery debugging.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENABLED = !!BREVO_API_KEY && BREVO_API_KEY !== 'placeholder-not-used-in-dev';

const SENDER = {
  email: process.env.EMAIL_FROM ?? 'venejobsadmin@gmail.com',
  name: process.env.EMAIL_FROM_NAME ?? 'Venejob',
};

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface SendEmailInput {
  to: EmailRecipient[];
  subject: string;
  html: string;
}

if (!BREVO_ENABLED) {
  console.warn('[email] BREVO_API_KEY not set — emails will be logged to console only');
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (to.length === 0) return;

  if (!BREVO_ENABLED) {
    console.info(
      `[email][dev] to=${to.map((r) => r.email).join(',')} subject="${subject}"`,
    );
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY!,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: to.map((r) => ({ email: r.email, ...(r.name ? { name: r.name } : {}) })),
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo send failed: ${res.status} ${res.statusText} ${body}`);
  }
}

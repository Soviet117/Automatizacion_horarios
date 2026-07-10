import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Optimizer EIS — Código de verificación',
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 800; margin-bottom: 8px;">E</div>
          <h2 style="color: #0f172a; font-size: 20px; margin: 0;">Verifica tu correo electrónico</h2>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Usa el siguiente código para verificar tu dirección de correo en Optimizer EIS:</p>
        <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0; border: 1px solid #e2e8f0;">
          <span style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">Este código expira en 15 minutos. Si no solicitaste esta verificación, ignora este mensaje.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">Optimizer EIS — Academic Suite</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail(to: string, subject: string, message: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Optimizer EIS — ${subject}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 800;">E</div>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">${message}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">Optimizer EIS — Academic Suite</p>
      </div>
    `,
  });
}

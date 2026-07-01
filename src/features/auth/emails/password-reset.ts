export function passwordResetEmailHtml(opts: {
  name: string;
  resetUrl: string;
  expiryMinutes: number;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="background:#f9fafb;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
          <tr>
            <td>
              <p style="margin:0 0 24px;font-size:13px;font-weight:600;letter-spacing:0.05em;color:#6b7280;">Crop Management</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#111827;line-height:1.3;">Reset your password</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Hi ${opts.name}, click the button below to set a new password for your account.</p>
              <a href="${opts.resetUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:500;">Reset password</a>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.5;">This link expires in <strong>${opts.expiryMinutes} minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="margin:0;font-size:12px;color:#d1d5db;word-break:break-all;">Or copy this URL: ${opts.resetUrl}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function passwordResetEmailText(opts: {
  name: string;
  resetUrl: string;
  expiryMinutes: number;
}): string {
  return [
    `Hi ${opts.name},`,
    ``,
    `Reset your password by visiting:`,
    `${opts.resetUrl}`,
    ``,
    `This link expires in ${opts.expiryMinutes} minutes.`,
    ``,
    `If you didn't request this, you can ignore this email.`,
  ].join("\n");
}

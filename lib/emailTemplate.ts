interface EmailTemplateProps {
  heading: string;
  body: string;
  buttonLabel: string;
  link: string;
  footnote: string;
}

// Email clients strip <style> blocks and most modern CSS, so everything is
// inline, table-based, and the "logo" is a text wordmark (SVG images are
// blocked by Gmail and others).
export const renderEmail = ({
  heading,
  body,
  buttonLabel,
  link,
  footnote,
}: EmailTemplateProps) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#0f172a;padding:24px 32px;text-align:center;">
                <span style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#f97316;">DerinSpot</span><span style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:#ffffff;">.BLOG</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 12px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#0f172a;">${heading}</h1>
                <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#475569;">${body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
                  <tr>
                    <td style="background-color:#f97316;border-radius:8px;">
                      <a href="${link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#64748b;">Button not working? Copy and paste this link into your browser:</p>
                <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${link}" style="color:#f97316;">${link}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background-color:#f8fafc;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">${footnote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

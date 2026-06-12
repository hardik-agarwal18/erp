
export const buildBaseTemplate = (content: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Precision Ledger ERP</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Inter', Arial, sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F3F4F6;padding:40px 20px;">
      <tr>
        <td align="center">
          <!-- Main Card -->
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);overflow:hidden;max-width:600px;width:100%;">
            
            <!-- Header Brand Ribbon -->
            <tr>
              <td style="background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);height:6px;width:100%;"></td>
            </tr>
            
            <!-- Logo Section -->
            <tr>
              <td style="padding:40px 40px 20px 40px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Precision Ledger <span style="color:#4F46E5;">ERP</span></div>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding:20px 40px 40px 40px;color:#374151;font-size:16px;line-height:1.6;">
                ${content}
              </td>
            </tr>
          </table>

          <!-- Footer Area -->
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:32px 20px;text-align:center;color:#6B7280;font-size:13px;line-height:1.5;">
                <p style="margin:0 0 8px 0;">This is an automated message from Precision Ledger ERP.</p>
                <p style="margin:0;">&copy; ${new Date().getFullYear()} Precision Ledger. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const buildBaseTemplate = (content: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ERP Notification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;">
    <div style="font-family:Arial, sans-serif; background-color:#f5f7fb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:24px;border:1px solid #e6e9ef;">
        ${content}
      </div>
      <p style="max-width:600px;margin:16px auto 0 auto;font-size:12px;color:#6b7280;">
        This is an automated message from your ERP workspace.
      </p>
    </div>
  </body>
</html>`;

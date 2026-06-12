
export const invoiceEmailTemplate = ({
  organizationName,
  invoiceNumber,
  customerName,
  amountDue,
}: {
  organizationName: string;
  invoiceNumber: string;
  customerName: string;
  amountDue: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Invoice ${invoiceNumber} from ${organizationName}</h2>
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        Hello ${customerName},
      </p>
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        Please find attached your invoice.
      </p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; color: #374151;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p style="margin: 0; color: #374151;"><strong>Amount Due:</strong> ${amountDue}</p>
      </div>
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        Thank you for your business.
      </p>
      
      <p style="color: #777; font-size: 14px; margin-top: 30px;">
        Regards,<br>
        ${organizationName}
      </p>
    </div>
  `;

  const text = `
Hello ${customerName},

Please find attached your invoice.

Invoice Number: ${invoiceNumber}
Amount Due: ${amountDue}

Thank you for your business.

Regards,
${organizationName}
  `.trim();

  return { html, text };
};

import { transporter } from "../config/mail.js";
import { mailFrom } from "../config/mail.js";

const run = async () => {
  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to: "work18.hk19@gmail.com",
      subject: "Zoho SMTP Test",
      html: "<h1>Email Working 🚀</h1>",
      text: "Email Working",
    });

    console.log("SUCCESS");
    console.log(info);
  } catch (error) {
    console.error("FAILED");
    console.error(error);
  }
};

void run();

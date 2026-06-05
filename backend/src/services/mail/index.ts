export {
  enforcePasswordResetEmailRateLimit,
  enforceVerificationEmailRateLimit,
  sendInvitationEmail,
  sendMail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  setMailDispatcher,
} from "../../mail/mail.service.js";

export {
  closeMailTransport as closeTransport,
  verifyMailConnection as verifyConnection,
} from "../../config/mail.js";

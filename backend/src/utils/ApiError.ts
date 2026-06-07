class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class MailDeliveryError extends ApiError {
  constructor() {
    super(500, "Unable to send email");
  }
}

export default ApiError;

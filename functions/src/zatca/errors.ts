/** Transport-agnostic error so Cloud Functions and Vercel can map it. */
export class ZatcaError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ZatcaError";
    this.status = status;
    this.code = code;
  }
}

export function invalidArgument(message: string): ZatcaError {
  return new ZatcaError(400, "invalid-argument", message);
}

export function unauthenticated(message = "Sign in required."): ZatcaError {
  return new ZatcaError(401, "unauthenticated", message);
}

export function permissionDenied(message: string): ZatcaError {
  return new ZatcaError(403, "permission-denied", message);
}

export function notFound(message: string): ZatcaError {
  return new ZatcaError(404, "not-found", message);
}

export function aborted(message: string): ZatcaError {
  return new ZatcaError(409, "aborted", message);
}

export function failedPrecondition(message: string): ZatcaError {
  return new ZatcaError(412, "failed-precondition", message);
}

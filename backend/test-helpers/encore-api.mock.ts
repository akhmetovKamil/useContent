export type Header<T extends string = string> = string & { __header?: T };

export class APIError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.details = details;
  }

  static alreadyExists(message: string, details?: unknown): APIError {
    return new APIError("already_exists", message, details);
  }

  static failedPrecondition(message: string, details?: unknown): APIError {
    return new APIError("failed_precondition", message, details);
  }

  static internal(message: string, details?: unknown): APIError {
    return new APIError("internal", message, details);
  }

  static invalidArgument(message: string, details?: unknown): APIError {
    return new APIError("invalid_argument", message, details);
  }

  static notFound(message: string, details?: unknown): APIError {
    return new APIError("not_found", message, details);
  }

  static permissionDenied(message: string, details?: unknown): APIError {
    return new APIError("permission_denied", message, details);
  }

  static unauthenticated(message: string, details?: unknown): APIError {
    return new APIError("unauthenticated", message, details);
  }
}

export function api(_options: unknown, handler?: unknown): unknown {
  return handler;
}

export class Gateway {
  constructor(public readonly options?: unknown) {}
}

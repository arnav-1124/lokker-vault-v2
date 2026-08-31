/**
 * Foundation for Lokker's structured error handling.
 *
 * Rules (see AGENTS.md / DEVELOPER.md):
 * - Throw a class that extends AppError, never a bare string or plain object.
 * - `message` is for developers and logs; it must never contain secrets
 *   (passwords, key material, vault contents).
 * - `userMessage` is the only text safe to render to end users.
 * - Never swallow errors: either handle them meaningfully or rethrow.
 *
 * This is deliberately small. Grow it only when real error categories emerge.
 */

export interface AppErrorOptions {
  /** Stable machine-readable error code. */
  code?: string;
  /** End-user-safe message; defaults to a generic string so internal
   *  details never leak by accident. */
  userMessage?: string;
  /** Original error, preserved for logs. */
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    const { code = "APP_ERROR", userMessage, cause } = options;
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.userMessage = userMessage ?? "Something went wrong. Please try again.";
  }
}

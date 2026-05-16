import type { ErrorHandler } from "hono";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return c.json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: details as Record<string, unknown> },
    }, 400);
  }

  // Custom application errors
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    }, err.statusCode as any);
  }

  // Unknown errors
  return c.json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
    },
  }, 500);
};

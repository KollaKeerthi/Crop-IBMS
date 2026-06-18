export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** Seconds until retry is allowed; set for rate-limit (429) errors. */
    public retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

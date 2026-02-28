import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "rate_limit";

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  identifierField?: string;
};

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

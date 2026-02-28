import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY, RateLimitOptions } from "./rate-limit.decorator";

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const now = Date.now();

    const key = this.buildKey(req, options);
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      this.gc(now);
      return true;
    }

    current.count += 1;
    this.buckets.set(key, current);

    if (current.count > options.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      );

      if (typeof res?.setHeader === "function") {
        res.setHeader("Retry-After", String(retryAfterSeconds));
      }

      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    this.gc(now);
    return true;
  }

  private gc(now: number) {
    if (this.buckets.size < 5_000) {
      return;
    }

    for (const [key, value] of this.buckets.entries()) {
      if (value.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private buildKey(req: any, options: RateLimitOptions): string {
    const route = req.route?.path ?? req.path ?? "unknown";
    const ip = this.extractIp(req);

    const identifier = options.identifierField
      ? this.extractIdentifier(req, options.identifierField)
      : "";

    return `${route}|${ip}|${identifier}|${options.windowMs}|${options.max}`;
  }

  private extractIdentifier(req: any, field: string): string {
    const value =
      req?.body?.[field] ??
      req?.query?.[field] ??
      req?.params?.[field] ??
      "";

    if (typeof value !== "string") {
      return "";
    }

    return value.trim().toLowerCase();
  }

  private extractIp(req: any): string {
    const forwarded = req?.headers?.["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      const [first] = forwarded.split(",");
      return first.trim();
    }

    return req?.ip ?? req?.socket?.remoteAddress ?? "unknown";
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const code = exception.code;

    // Defaults
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    // Prisma -> HTTP mapping
    switch (code) {
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Resource not found";
        break;

      case "P2002":
        status = HttpStatus.CONFLICT;
        message = "Unique constraint violation";
        break;

      case "P2003":
        status = HttpStatus.CONFLICT;
        message = "Foreign key constraint violation";
        break;

      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "Database error";
        break;
    }

    res.status(status).json({
      statusCode: status,
      message,
      prisma: {
        code,
        model: (exception.meta as any)?.modelName,
      },
      path: req?.url,
      timestamp: new Date().toISOString(),
    });
  }
}

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "prisma/prisma-exception.filter";
import { AppEnv } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppEnv>>(ConfigService);
  const nodeEnv = config.get("NODE_ENV", { infer: true }) ?? "development";
  const configuredCors = config.get("CORS_ORIGINS", { infer: true });

  const corsOrigins =
    configuredCors
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ??
    (nodeEnv === "development"
      ? [
          "http://localhost:3000",
          "http://localhost:4200",
          "http://localhost:5173",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:4200",
          "http://127.0.0.1:5173",
        ]
      : []);

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = config.get("PORT", { infer: true }) ?? 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();

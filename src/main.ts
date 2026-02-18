import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "prisma/prisma-exception.filter";
import { AppEnv } from "./config/env";

function parseCorsOrigins(value?: string): string[] {
  if (!value) return ["http://localhost:3000"];

  const origins = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : ["http://localhost:3000"];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppEnv>>(ConfigService);

  const corsOrigins = parseCorsOrigins(config.get("CORS_ORIGINS", { infer: true }));

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = config.get("PORT", { infer: true }) ?? 3001;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();

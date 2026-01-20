import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "prisma/prisma-exception.filter";
import { AppEnv } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = app.get<ConfigService<AppEnv>>(ConfigService);
  const port = config.get("PORT", { infer: true }) ?? 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();

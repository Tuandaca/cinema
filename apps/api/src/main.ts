import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Security: Disable Helmet's built-in CORS to use NestJS's instead
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    }),
  );

  const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ...new Set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3005",
      "http://127.0.0.1:3005",
      "http://localhost:3006",
      "http://127.0.0.1:3006",
      ...envOrigins,
    ]),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Accept, Authorization",
  });

  // Global Prefix
  app.setGlobalPrefix("api");

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3006;
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log(`🔒 CORS allowed origins: ${allowedOrigins.join(", ")}`);
}
bootstrap();

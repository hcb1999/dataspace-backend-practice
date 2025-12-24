import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exception.filter';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from 'src/common/swagger';
import * as express from 'express';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ClientsModule, Transport, MicroserviceOptions} from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const server = app.getHttpServer();
  server.setTimeout(1000 * 60 * 5); // 5분까지 기다림
  server.keepAliveTimeout = 1000 * 60 * 5;

  app.useWebSocketAdapter(new IoAdapter(app));  // WebSocket 어댑터 사용
  // CORS 설정
  app.enableCors({
    origin: true,//여기에 url을 넣어도된다. 
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  // Pipeline 설정.
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: DTO에 명시하지 않은 property 값을 인입했을 시, 자동으로 제외한다.
      // forbidNonWhitelisted: DTO에 명시하지 않은 property 값을 인입했을 시, 그 값에 관한 에러메세지를 출력한다.
      // transform: Controller에게 값을 전달할 때, 컨트롤러가 정의한 형식으로 자동 변환한다.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // 🔥🔥🔥 URL decode 미들웨어 추가 (괄호, 한글, 공백 모두 정상 처리)
  app.use((req, res, next) => {
    try {
      req.url = decodeURI(req.url); // 핵심 코드
    } catch (e) {
      // decode 오류 발생 시 원본 유지
    }
    next();
  });

  // 따로 도메인이 없을 때 사용 URL prefix
  app.setGlobalPrefix('api');

  setupSwagger(app);

  //추가 html 페이지 경로 설정
  // app.use(express.static(join(__dirname, '..', 'public')));
  // 실제 파일 저장 경로
  const staticPath = join(__dirname, '..', 'public');
  // /api → /public 매핑
  app.useStaticAssets(staticPath, {
    prefix: '/api',
  });


  // 마이크로서비스 생성
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://avataroad:avataroad@localhost:5672'],
      queue: 'transaction_dataspace_queue', // 큐 이름
      noAck: false,
      queueOptions: {
        durable: true,
        'x-dead-letter-exchange': 'dlx_exchange2',
        'x-dead-letter-routing-key': 'dlx_routing_key2',
      },
    },
  });

  await app.startAllMicroservices();

   // Favicon 요청을 무시하는 미들웨어 추가
   app.use((req:any, res:any, next:any) => {
    if (req.path === '/favicon.ico') {
      res.status(204).end(); 
    } else {
      next();
    }
  });

  await app.listen(process.env.SERVER_PORT);
}
bootstrap();


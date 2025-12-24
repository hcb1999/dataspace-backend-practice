import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from "@nestjs/swagger";

//웹 페이지를 새로고침을 해도 Token 값 유지
const swaggerCustomOptions: SwaggerCustomOptions = {
    swaggerOptions: {
        persistAuthorization: true,
    },
};

export function setupSwagger(app: INestApplication): void {
    const options = new DocumentBuilder()
      .setTitle('데이터 스페이스 API Docs V.0.1')
      .setDescription('데이터 스페이스 API 사용 설명서')
      .setVersion('0.1')
      //JWT 토큰 설정
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          name: 'JWT',
          in: 'header',
        },
        'access-token',
       )
      .build();
  
    const document = SwaggerModule.createDocument(app, options);

    // 그룹 순서 변경
    document.tags = [
      { name: '인증 API', description: '인증에 관련된 API' },
      { name: 'DID API', description: 'DID에 관련된 API' },
      { name: '사용자 API', description: '사용자 정보에 관련된 API' },
      { name: '마켓 판매 API', description: '마켓 판매 정보에 관련된 API' },
      { name: '사용자 구매 API', description: '사용자 구매 정보에 관련된 API' },
      { name: '상태 API', description: '상태에 관련된 API' },
      { name: 'NFT API', description: 'NFT에 관련된 API' },
    ];

    SwaggerModule.setup('swagger-ui', app, document, swaggerCustomOptions);
}
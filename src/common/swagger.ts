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
      .setTitle('아바타로드 API Docs V.0.1')
      .setDescription('아바타로드 API 사용 설명서')
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
      { name: '굿즈 API', description: '굿즈 정보에 관련된 API' },
      { name: '에셋 API', description: '에셋 정보에 관련된 API' },
      { name: '엔터사 계약 API', description: '엔터사 계약 정보에 관련된 API' },
      { name: '마켓 판매 API', description: '마켓 판매 정보에 관련된 API' },
      { name: '사용자 구매 API', description: '사용자 구매 정보에 관련된 API' },
      { name: '에셋타입 API', description: '메타버스 업체별 에셋타입 정보에 관련된 API' },
      { name: '메타버스 API', description: '메타버스 업체 정보에 관련된 API' },
      { name: '상태 API', description: '상태에 관련된 API' },
      // { name: 'NFT API', description: 'NFT에 관련된 API' },
    ];

    SwaggerModule.setup('api-docs/', app, document, swaggerCustomOptions);
}
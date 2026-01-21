import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsDateString, IsOptional, IsDate, IsNumber } from "class-validator";
import { Type, Transform, TransformFnParams } from 'class-transformer';

function getCurrentDateAsKstIsoString({ value }: TransformFnParams): string {
    // 클라이언트에서 값이 전달되지 않았을 때 (undefined, null, 빈 문자열) 처리
    if (value === undefined || value === null || value === '') {
        const now = new Date();
        
        // 1. 현재 로컬 시각을 UTC 밀리초로 변환합니다.
        // getTimezoneOffset()은 분 단위로 반환되므로 60000을 곱합니다.
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000); 
        
        // 2. UTC 밀리초에 KST 오프셋(9시간)을 더합니다.
        const kstOffsetMs = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
        const kst = new Date(utc + kstOffsetMs);

        // 3. ISO 8601 문자열을 생성하고 UTC 마커 'Z'를 KST 오프셋 '+09:00'로 대체합니다.
        // 이를 통해 DB나 다른 서비스에서 KST 시간으로 정확히 해석하게 합니다.
        // '.000Z'를 포함하는 경우와 포함하지 않는 경우 모두 대체 처리합니다.
        let kstIsoString = kst.toISOString();
        
        // Z를 +09:00으로 변경하여 KST 시간임을 명확히 표시
        return kstIsoString.replace('Z', '+09:00');
    }
    
    // 값이 있는 경우, 원래 값을 유지
    return value;
}

export class CreateDidVcDto {
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '지갑 DID'})
  walletDid: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'Issuer DID'})
  issuerDid : string;

  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: '스키마 타입 (사용자 선택값)'})
  scType: string;

  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: 'VC 타입 (오스레저 발급 응답값, 발급 전에는 null)', required: false })
  @IsOptional()
  vcType?: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 ID'})
  readonly dataId: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터명' })
  readonly dataName: string;

  @IsString()
  @Length(1, 512)
  @ApiProperty({ description: '마켓의 데이터설명'})
  readonly dataDesc: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 상품유형' })
  readonly productType: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터언어'})
  readonly language: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 키워드' })
  readonly keyWord: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 doi 번호'})
  readonly doi: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 주제' })
  readonly subject: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 발행기관'})
  readonly issuer: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 doi ur' })
  readonly doiUrl: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '등록자의 이메일주소'})
  readonly registrantEmail: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '등록자의 지갑주소' })
  readonly registrantWalletAddress: string;

  @IsString()
  @Length(1, 20)
  @ApiProperty({ description: '판매가격'})
  readonly dataPrice: string;

  @IsString()
  @Length(1, 100)
  @ApiProperty({ description: 'Tx Id' })
  readonly txId: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: 'contract Address'})
  readonly contractAddress: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '이미지 url' })
  readonly imageURL: string;

  @IsOptional()
  @Transform(getCurrentDateAsKstIsoString)
  @IsDateString(
        { strictSeparator: true },
        { message: '날짜 형식(ISO 8601)의 문자열이 아닙니다.' }
  )
  @Length(10, 30) 
  @ApiProperty({ 
    description: '등록일 (ISO 8601 문자열). 값이 없을 경우 현재 KST 시각이 기본값으로 들어갑니다.',
    example: '2023-12-31T10:00:00.000+09:00', // KST 오프셋 예시
    type: 'string', 
    required: false
  })
  readonly registrationDate: string;
}
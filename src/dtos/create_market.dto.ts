import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class CreateMarketDto {  
  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // @ApiProperty({ required: false, description: '사용자 구매 번호 : 1' })
  // readonly purchaseNo: number;

  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: '스키마 타입 (사용자 선택값)'})
  readonly marketScType: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터명' })
  readonly marketDataName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '마켓의 데이터설명' })
  readonly marketDataDesc: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 상품유형' })
  readonly marketProductType: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터언어' })
  readonly marketLanguage: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 키워드' })
  readonly marketKeyword: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 doi 번호' })
  readonly marketDoi: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 주제' })
  readonly marketSubject: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 발행기관' })
  readonly marketIssuer: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 데이터 doi url' })
  readonly marketDoiUrl: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '판매가격' })
  readonly price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, default: 1, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
  readonly issueCnt: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-시작일자(YYYY-MM-DD 형식)', default: new Date().toISOString() })
  readonly startDttm: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-종료일자(YYYY-MM-DD 형식)', default: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() })
  readonly endDttm: Date;

  @IsOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 3, required: false, description: '데이터 이미지 파일들' })
  files: Express.Multer.File[];

  // constructor() {
  //   this.startDttm = new Date();
  //   this.endDttm = new Date();
  //   this.endDttm.setFullYear(this.endDttm.getFullYear() + 1);
  //   this.issueCnt = 1;
  // }
}

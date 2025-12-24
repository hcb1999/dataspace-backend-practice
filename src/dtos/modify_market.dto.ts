import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class ModifyMarketDto {
  // @IsOptional()
  // @IsString()
  // @Length(1, 10)
  // @ApiProperty({ description: 'VC 타입'})
  // readonly marketVcType: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터명' })
  readonly marketDataName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '마켓의 데이터설명', required: false })
  readonly marketDataDesc: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 상품유형' })
  readonly marketProductType: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터언어' })
  readonly marketLanguage: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터 키워드' })
  readonly marketKeyword: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓의 doi 번호' })
  readonly marketDoi: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터 주제' })
  readonly marketSubject: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터 발행기관' })
  readonly marketIssuer: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 데이터 doi url' })
  readonly marketDoiUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '판매가격' })
  readonly price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, default: 1, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
  readonly issueCnt: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ required: false, description: '판매기간-시작일자(YYYY-MM-DD 형식)' })
  readonly startDttm: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ required: false, description: '판매기간-종료일자(YYYY-MM-DD 형식)' })
  readonly endDttm: Date;

  @IsOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 3, required: false, description: '데이터 이미지 파일들' })
  files: Express.Multer.File[];

}

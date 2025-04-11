import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class CreateMarketDto {  
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '엔터사 계약 번호 : 1' })
  readonly contractNo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '사용자 구매 번호 : 1' })
  readonly purchaseNo: number;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '마켓에셋명' })
  readonly marketAssetName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: '마켓의 상품 설명' })
  readonly marketAssetDesc: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '판매가격' })
  readonly price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
  readonly issueCnt: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-시작일자(YYYY-MM-DD 형식)', default: new Date().toISOString() })
  readonly startDttm: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-종료일자(YYYY-MM-DD 형식)', default: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() })
  readonly endDttm: Date;
}

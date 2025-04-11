import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class ModifyMarketDto {
  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '마켓의 에셋명' })
  readonly marketAssetName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '마켓의 상품 설명', required: false })
  readonly marketAssetDesc: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '판매가격' })
  readonly price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
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
}

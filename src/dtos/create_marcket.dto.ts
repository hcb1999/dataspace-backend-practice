import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class CreateMarcketDto {  
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '엔터사 구매 번호 : 1' })
  readonly purchaseAssetNo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '사용자 구매 번호 : 1' })
  readonly purchaseNo: number;

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
  @ApiProperty({ description: '판매기간-시작일자(YYYY-MM-DD 형식)' })
  readonly startDttm: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-종료일자(YYYY-MM-DD 형식)' })
  readonly endDttm: Date;
}

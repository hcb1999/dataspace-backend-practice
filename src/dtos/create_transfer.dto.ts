import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length, IsNumber, IsBoolean, IsObject } from "class-validator";
import { Type, Transform } from 'class-transformer';  

export class CreateTransferDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '엔터사 구매 번호', required: false })
  readonly purchaseAssetNo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '마켓 판매 번호', required: false })
  readonly marcketNo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '사용자 구매번호', required: false })
  readonly purchaseNo: number;

  // @IsOptional()
  // @IsString()
  // @Length(1, 40)
  // @ApiProperty({ description: 'txId', required: false})
  // txId: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '지갑주소 - from' })
  readonly fromAddr: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '지갑주소 - to' })
  readonly toAddr: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '상품 번호' })
  readonly productNo: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '에셋 번호' })
  readonly assetNo: number;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '토큰 ID' })
  tokenId: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 구매 개수)' })
  readonly purchaseCnt: number;
  
  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: '트랜스퍼 상태', required: false })
  readonly state: string;

  // @IsOptional()
  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ description: '토큰 Index', required: false})
  // tokenIdx: string;

  // @IsOptional()
  // @IsString()
  // @ApiProperty({ description: '콜백 URL', required: false})
  // callbackUrl: string;

  // @IsOptional()
  // @IsString()
  // @Length(1)
  // @ApiProperty({ description: '결과', required: false})
  // result: string;

  // @IsOptional()
  // @IsObject()
  // @ApiProperty({ description: '콜백 데이터', required: false})
  // resData: Object;
}

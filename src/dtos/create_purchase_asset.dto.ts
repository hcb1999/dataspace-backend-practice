import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsArray } from "class-validator";
import { Type } from 'class-transformer';

export class CreatePurchaseAssetDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '구매 지갑주소' })
  readonly purchaseAddr: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '구매 엔터사명' })
  readonly purchaseUserName: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '판매자 지갑주소' })
  readonly saleAddr: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '판매 크리에이터명' })
  readonly saleUserName: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '구매한 굿즈 번호' })
  readonly productNo: number;
 
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '구매한 굿즈의 에셋 번호' })
  readonly assetNo: number;

  // @IsOptional()
  // @IsString()
  // @Length(1, 10)
  // @ApiProperty({ required: false, description: '구매상태 : P2' })
  // readonly state: string;

  // @IsOptional()
  // @IsString()
  // @Length(1, 10)
  // @ApiProperty({ required: false, description: '판매상태 : S2' })
  // readonly saleState: string;

  // @IsOptional()
  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ required: false, description: '결제실패 사유'})
  // readonly failDesc: string;
}
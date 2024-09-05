import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsArray } from "class-validator";
import { Type } from 'class-transformer';

export class CreatePurchaseDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '판매자 지갑주소' })
  readonly saleAddr: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '판매 광고주명' })
  readonly saleUserName: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '구매 지갑주소' })
  readonly purchaseAddr: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '구매 사용자명' })
  readonly purchaseUserName: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '구매한 광고주 구매 번호' })
  readonly purchaseAssetNo: number;
 
  // @IsOptional()
  // @IsString()
  // @Length(1, 10)
  // @ApiProperty({ required: false, description: '구매상태 : P2' })
  // readonly state: string;

  // @IsOptional()
  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ required: false, description: '결제실패 사유'})
  // readonly failDesc: string;
}
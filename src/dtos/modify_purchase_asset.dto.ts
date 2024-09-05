import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsArray } from "class-validator";

export class ModifyPurchaseAssetDto {
  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ required: false, description: '구매상태 : P4' })
  readonly state: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '결제실패 사유' })
  readonly failDesc: string;
}
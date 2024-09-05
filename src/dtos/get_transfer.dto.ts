import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetTransferDto extends PageRequest {  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ description: '광고주 구매번호', required: false })
    purchaseAssetNo?: number;
  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ description: '사용자 구매번호', required: false })
    purchaseNo?: number;

    @IsOptional()
    @IsString()
    @Length(1, 80)
    @ApiProperty({ description: '지갑주소 - from', required: false})
    fromAddr?: string;
  
    @IsOptional()
    @IsString()
    @Length(1, 80)
    @ApiProperty({ description: '지갑주소 - to', required: false})
    toAddr?: string;
}
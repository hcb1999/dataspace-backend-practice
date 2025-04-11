import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetTransferDto extends PageRequest {  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ description: '광고주 구매번호', required: false })
    contractNo?: number;
  
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

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ required: false, description: '에셋번호' })
    assetNo?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ required: false, description: '상품 번호' })
    productNo?: number;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '토큰 ID' , required: false})
    tokenId?: string;
}
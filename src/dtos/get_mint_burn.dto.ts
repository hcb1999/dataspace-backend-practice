import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetMintBurnDto extends PageRequest {  
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
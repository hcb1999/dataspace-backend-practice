import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetMintDto extends PageRequest {  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ required: false, description: '에셋번호' })
    assetNo?: number;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '토큰 Index' , required: false})
    tokenIdx?: string;
}
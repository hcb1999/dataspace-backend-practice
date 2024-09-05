import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetAssetTypeDto extends PageRequest {  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ description: '메타버스 업체 번호', required: false})
    metaverseNo?: number;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '에셋 타입 정의' , required: false})
    typeDef?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '검색어 (에셋 타입 설명)' , required: false})
    word?: string;
}
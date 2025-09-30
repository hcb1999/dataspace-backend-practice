import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate, IsNumber, IsArray } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetAssetListDto{
    @ApiProperty({ type: [Number], description: '에셋 번호 배열' })
    @IsArray()
    @Type(() => Number)
    @IsNumber({}, { each: true })
    assetIds: number[];
}
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetPurchaseAssetDto extends PageRequest { 
    // @IsOptional()
    // @IsString()
    // @Length(1, 40)
    // @ApiProperty({ description: '광고주명 (엔터사명)' , required: false})
    // advertiser?: string;

    // @IsOptional()
    // @IsNumber()
    // @Type(() => Number)
    // @ApiProperty({ description: '광고 메타버스 업체', required: false})
    // adTarget?: number;
  
    @IsOptional()
    @IsString()
    @Length(1, 100)
    @ApiProperty({ description: '검색어' , required: false})
    word?: string;
}
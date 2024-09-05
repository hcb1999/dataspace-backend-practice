import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate } from "class-validator";
import { PageRequest } from "../common/page.request";

export class GetPurchaseDto extends PageRequest { 
    // @IsOptional()
    // @IsString()
    // @Length(1, 40)
    // @ApiProperty({ description: '광고주명 (엔터사명)' , required: false})
    // advertiser?: string;
    
    @IsOptional()
    @IsDate()
    @IsOptional()
    @ApiProperty({ description: '결제일시(YYYY-MM-DD 형식)' , required: false})
    payDttm?: Date;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    @ApiProperty({ description: '검색어' , required: false})
    word?: string;
}
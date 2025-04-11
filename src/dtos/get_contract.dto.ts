import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetContractDto extends PageRequest { 
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ description: '결제일시-시작일자(YYYY-MM-DD 형식)' , required: false})
    startDttm?: Date;
  
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ description: '결제일시-종료일자(YYYY-MM-DD 형식)' , required: false})
    endDttm?: Date;
 
    @IsOptional()
    @IsString()
    @Length(1, 10)
    @ApiProperty({ description: '판매상태' , required: false})
    state?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '검색어' , required: false})
    word?: string;
}
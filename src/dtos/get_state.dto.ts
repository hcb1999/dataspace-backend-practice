import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate } from "class-validator";
import { PageRequest } from "../common/page.request";

export class GetStateDto extends PageRequest {
    @IsOptional()
    @IsString()
    @Length(1, 10)
    @ApiProperty({ description: '상태 분류', required: false})
    category?: string;
    
    @IsOptional()
    @IsString()
    @Length(1, 10)
    @ApiProperty({ description: '상태값', required: false})
    state?: string;
  
    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '검색어 (상태 설명)', required: false})
    word?: string;
}
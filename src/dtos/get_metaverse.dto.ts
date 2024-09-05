import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate } from "class-validator";
import { PageRequest } from "../common/page.request";

export class GetMetaverseDto extends PageRequest {  
    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '검색어 (메타버스 업체명)' , required: false})
    word?: string;
}
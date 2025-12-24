import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsDate, IsNumber } from "class-validator";
import { PageRequest } from "../common/page.request";
import { Type, Transform } from 'class-transformer';

export class GetMarketDto extends PageRequest { 
    @IsOptional()
    @IsString()
    @Length(1, 10)
    @ApiProperty({ description: 'VC 타입', required: false})
    vcType?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '데이터명' , required: false})
    marketDataName?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '데이터설명' , required: false})
    marketDataDesc?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '상품유형' , required: false})
    marketProductType?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '언어' , required: false})
    marketLanguage?: string;    

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '키워드' , required: false})
    marketKeyword?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '마켓의 doi 번호', required: false })
    marketDoi?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '주제' , required: false})
    marketSubject?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ description: '발행기관' , required: false})
    marketIssuer?: string;

    @IsOptional()
    @IsString()
    @Length(1, 256)
    @ApiProperty({ required: false, description: '마켓의 데이터 doi url' })
    marketDoiUrl?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ description: '등록일-시작일자(YYYY-MM-DD 형식)' , required: false})
    startDttm?: Date;
  
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ description: '등록일-종료일자(YYYY-MM-DD 형식)' , required: false})
    endDttm?: Date;
 
    @IsOptional()
    @IsString()
    @Length(1, 10)
    @ApiProperty({ description: '판매상태' , required: false})
    state?: string;
 
}
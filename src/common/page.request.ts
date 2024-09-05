import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Length, IsDate, IsNumber } from "class-validator";
import { Type } from 'class-transformer';

export class PageRequest {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ description: '페이지 크기' , required: false})
  pageSize?: number | 10;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ description: '페이지 번호' , required: false})
  pageNo?: number | 1;

  @IsString()
  @IsOptional()
  @Length(1, 4)
  @ApiProperty({ description: '정렬순서 (asc:오름차순, desc:내림차순)' , required: false})
  sortOrd?: string | 'desc';

  getOffset(): number {

    if (this.pageNo < 1 || this.pageNo === null || this.pageNo === undefined) {
      this.pageNo = 1;
    }

    if (
      this.pageSize < 1 ||
      this.pageSize === null ||
      this.pageSize === undefined
    ) {
      this.pageSize = 10;
    }

    return (Number(this.pageNo) - 1) * Number(this.pageSize);
  }

  public getLimit(): number {

    if (
      this.pageSize < 1 ||
      this.pageSize === null ||
      this.pageSize === undefined
    ) {
      this.pageSize = 10;
    }
 
    return Number(this.pageSize); 
  }
}
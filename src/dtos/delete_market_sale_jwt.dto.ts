import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class DeleteMarketSaleJwtDto {  
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '사용자 이메일주소'})
  readonly email: string;

}

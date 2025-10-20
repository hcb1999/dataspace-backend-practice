import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class DeleteMarketSaleDto {  
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '사용자 이메일주소'})
  readonly email: string;

  // @IsString()
  // @Length(1, 40)
  // @ApiProperty({ description: '사용자 닉네임' })
  // readonly nickName: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '마켓번호' })
  readonly marketNo: number;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber } from "class-validator";
import { Type } from 'class-transformer';

export class ModifyUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  @ApiProperty({ required: false, description: '닉네임' })
  readonly nickName: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: 'Unity사용자의 마지막 rpm의 glb 주소' })
  readonly useGlbUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '사용자 구매 번호 : 1' })
  readonly purchaseNo: number;

}
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetUserDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly email: string;

  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: '지갑주소'})
  // readonly account: string;
}
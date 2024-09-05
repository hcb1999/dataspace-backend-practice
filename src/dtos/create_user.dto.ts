import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '지갑주소'})
  readonly addr: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '닉네임' })
  readonly nickName: string;
}
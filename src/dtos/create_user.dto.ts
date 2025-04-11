import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly email: string;

  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: '계정'})
  // readonly account: string;

  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ description: '계정 키'})
  // readonly privateKey: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '닉네임' })
  readonly nickName: string;
}
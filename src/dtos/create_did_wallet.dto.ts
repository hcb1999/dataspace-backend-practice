import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class CreateDidWalletDto {
  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '아바타 닉네임' })
  readonly nickName: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '아바타 이미지 URL' })
  readonly imageUrl: string;

  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly id: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'JWT'})
  jwt: string;
}
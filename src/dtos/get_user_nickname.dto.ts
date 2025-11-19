import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetUserNicknameDto {
  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '닉네임' })
  readonly nickName: string;
}
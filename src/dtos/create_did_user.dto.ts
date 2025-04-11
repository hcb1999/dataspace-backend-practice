import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class CreateDidUserDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly id: string;
}
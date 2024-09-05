import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetUserDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '지갑주소'})
  readonly addr: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class CreateDidAcdgDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly id: string;
  
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'JWT'})
  jwt: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'DID'})
  readonly did: string;
}
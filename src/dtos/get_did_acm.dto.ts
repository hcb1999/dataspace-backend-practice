import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetDidAcmDto {
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '이메일주소'})
  readonly id: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'JWT'})
  jwt: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '아바타 DID'})
  did?: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'VC TYPE'})
  vcType?: string;
}
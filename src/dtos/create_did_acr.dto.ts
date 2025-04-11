import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";

export class CreateDidAcrDto {  @IsString()
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

  @IsString()
  @ApiProperty({ description: 'vc'})
  readonly vc: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'vcIssuerName'})
  readonly vcIssuerName: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'vcIssuerLogo'})
  readonly vcIssuerLogo: string;  
  
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'vcTypeName'})
  readonly vcTypeName: string;

  // @IsBoolean()
  // @ApiProperty({ description: 'checkBusinessCard'})
  // readonly checkBusinessCard: false;

}
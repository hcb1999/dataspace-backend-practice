import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetDidVcDto {
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '지갑 DID'})
  readonly walletDid: string;

  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: 'VC 타입'})
  readonly vcType: string;
}
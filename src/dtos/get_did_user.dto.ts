import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class GetDidUserDto {
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '지갑 DID'})
  readonly walletDid: string;

  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: '지갑주소'})
  // readonly account: string;
}
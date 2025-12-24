import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, Length } from "class-validator";
import { Type, Transform } from 'class-transformer';   

export class CreateAlMintDto {
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'issued Did'})
  readonly issuerDid: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
  readonly issueCnt: number;

}

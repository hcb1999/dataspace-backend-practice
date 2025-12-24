import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length, IsNumber, IsArray, IsBoolean, IsObject } from "class-validator";
import { Type, Transform } from 'class-transformer';  

export class CreateAlTransferDto {

  // @IsArray()
  // @IsString({ each: true })
  // @ApiProperty({ 
  //   description: '토큰 IDs',
  //   type: [String] 
  // })
  // tokenIds: string[];
  @IsArray()
  @IsString({ each: true })
  // @IsNumber({}, { each: true })
  // @Type(() => Number)
  @ApiProperty({ 
    description: '토큰 IDs',
    type: [String],
  })
  tokenIds: string[];

  // @IsNumber()
  // @Type(() => Number)
  @IsString()
  @ApiProperty({ description: '가격(wei 단위, 문자열)' })
  readonly amountInWei: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'seller Did'})
  readonly sellerDid: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'buyer Did'})
  readonly buyerDid: string;
  
}

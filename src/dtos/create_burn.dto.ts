import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsArray, IsString, Length, IsNumber, IsBoolean, IsObject } from "class-validator";
import { Type, Transform } from 'class-transformer';  

export class CreateBurnDto {   
  // @IsOptional()
  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: 'Contract ID', required: false})
  // readonly contractId: string;

  // @IsOptional()
  // @IsString()
  // @Length(1, 40)
  // @ApiProperty({ description: '메타데이터ID' , required: false})
  // readonly metadataId: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '상품 번호' })
  readonly productNo: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '에셋 번호' })
  readonly assetNo: number;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: 'issuedTo(NFT 지갑 주소)', required: false})
  readonly issuedTo?: string;
  
  @IsOptional()
  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '토큰 ID', required: false})
  tokenId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  @ApiProperty({
    description: '토큰 ID 배열',
    type: [String],
    required: false,
    example: ['1001', '1002', '1003'],
  })
  tokenIds?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: '버닝 상태', required: false })
  readonly state?: string;

  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ description: '토큰 Index'})
  // tokenIdx: string;

  // @IsOptional()
  // @IsString()
  // @ApiProperty({ description: '콜백 URL', required: false})
  // callbackUrl: string;

  // @IsOptional()
  // @IsString()
  // @Length(1)
  // @ApiProperty({ description: '결과', required: false})
  // result: string;

  // @IsOptional()
  // @IsObject()
  // @ApiProperty({ description: '콜백 데이터', required: false})
  // resData: Object;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, Length } from "class-validator";
import { Type, Transform } from 'class-transformer';   

export class CreateMintDto {
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
  @Length(1, 256)
  @ApiProperty({ description: 'issuedTo(NFT 지갑 주소)', required: false})
  readonly issuedTo: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '토큰 ID', required: false})
  readonly tokenId: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ description: '민팅 상태', required: false})
  readonly state: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 발행 개수 / NFT 재판매 개수)' })
  readonly issueCnt: number;

  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // @ApiProperty({ required: false, description: '엔터사 구매 번호' })
  // readonly contractNo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '마켓 에셋 판매 번호' })
  readonly marketNo: number;

  // @IsArray()
  // @Length(1, 512, { each: true })
  // @ApiProperty({ type:[String], description: '토큰ID:[에셋번호_상품번호_index]' })
  // tokenIdAry: string[];

  // @IsOptional()
  // @IsString()
  // @Length(1)
  // @ApiProperty({ description: '결과', required: false})
  // result: string;

  // @IsOptional()
  // @IsObject()
  // @ApiProperty({ description: '콜백 데이터', required: false})
  // data: Object;
}

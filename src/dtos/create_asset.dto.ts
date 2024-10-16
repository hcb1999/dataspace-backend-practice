import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class CreateAssetDto {  
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 번호 : 1' })
  readonly productNo: number;

  // @IsString()
  // @Length(1, 40)
  // @ApiProperty({ description: '등록자 이름' })
  // readonly regName: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '에셋명' })
  readonly assetName: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업체 : 1' })
  readonly adTarget: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업체별 에셋 분류 : 5' })
  readonly adType: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '판매가격' })
  readonly price: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-시작일자(YYYY-MM-DD 형식)' })
  readonly startDttm: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-종료일자(YYYY-MM-DD 형식)' })
  readonly endDttm: Date;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ required: false, description: '판매상태(S1:판매등록, S2: 판매시작, S3:판매중지, S4:판매종료, S5:판매완료)' })
  readonly state: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '에셋 설명' })
  readonly assetDesc: string;

  @IsOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 2, required: false, description: '에셋 이미지 파일들' })
  files: Express.Multer.File[];
}

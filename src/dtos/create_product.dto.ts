import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt, ArrayNotEmpty } from "class-validator";
import { Type, Transform } from 'class-transformer';
import * as moment from 'moment';

export class CreateProductDto {
  // @IsString()
  // @Length(1, 40)
  // @ApiProperty({ description: '등록자 이름' })
  // readonly regName: string;
  
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '굿즈명' })
  readonly productName: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업체1 (로블록스) : 1', required: false, default: 1 })
  adTargetFirst: number;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '굿즈 메타버스 업체1 에셋 분류 : 1, 2, 3',  required: false })
  adTypesFirst: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업체2 (제페토) : 2', required: false, default: 2 })
  adTargetSecond: number;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '굿즈 메타버스 업체2 에셋 분류 : 1, 2, 5', required: false })
  adTypesSecond: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업체3 (K-POP 월드) : 3' , required: false, default: 3 })
  adTargetThird: number;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '굿즈 메타버스 업체3 에셋 분류 : 1, 2, 3, 5', required: false })
  adTypesThird: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '굿즈 메타버스 업첵4 (인천월드) : 4' , required: false, default: 4 })
  adTargetFourth: number;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '굿즈 메타버스 업첵4 에셋 분류 : 1, 2, 3, 5', required: false })
  adTypesFourth: string;

  @IsOptional()
  @IsString()
  // @Length(1, 256)
  @ApiProperty({ description: '굿즈 설명' , required: false})
  readonly productDesc: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ required: false, description: '게시상태(N1:게시전, N2: 게시중, N3:게시중지, N4:게시종료)' })
  readonly state: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '게시기간-시작일자(YYYY-MM-DD 형식)' , required: false, default: new Date().toISOString() })
  readonly startDttm: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '게시기간-종료일자(YYYY-MM-DD 형식)' , required: false, default: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() })
  readonly endDttm: Date;

  @IsOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 2, required: false, description: '굿즈 이미지 파일들' })
  files: Express.Multer.File[];
}

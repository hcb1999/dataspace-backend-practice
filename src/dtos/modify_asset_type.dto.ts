import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsNumber, IsOptional } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class ModifyAssetTypeDto {
  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // @ApiProperty({ description: '메타버스 업체 번호 : 1(로블록스), 2(제페토), 3(K-POP 월드)' })
  // readonly metaverseNo: number;
  
  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '매타버스 업체별 에셋 타입 정의 : 셔츠' })
  readonly typeDef: string;
  
  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '에셋 타입 설명' })
  readonly assetTypeDesc: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsNumber, IsDate, IsArray, IsInt } from "class-validator";
import { Type, Transform } from 'class-transformer';

export class CreateMarketSaleDto {  
  @IsString()
  @Length(1, 80)
  @ApiProperty({ description: '사용자 이메일주소'})
  readonly email: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '사용자 닉네임' })
  readonly nickName: string;

  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: '에셋명' })
  readonly assetName: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '에셋 설명' })
  readonly assetDesc: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '에셋 url' })
  readonly assetUrl: string;

  @IsOptional() 
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '메타버스 업체 : 2(로블록스)', default: 2 })
  readonly adTarget: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '메타버스 업체별 에셋 분류 : 5' })
  readonly adType: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '판매가격' })
  readonly price: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-시작일자(YYYY-MM-DD 형식)', default: new Date().toISOString() })
  readonly startDttm: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ description: '판매기간-종료일자(YYYY-MM-DD 형식)', default: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() })
  readonly endDttm: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: '에디션 개수(NFT 발행 개수)', default: 1 })
  readonly issueCnt: number;

  // 굿즈(.png), 에셋(.제페토)
  @IsOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 2, required: false, description: '에셋 이미지 파일들' })
  files: Express.Multer.File[];

  // constructor() {
  //   this.startDttm = new Date();
  //   this.endDttm = new Date();
  //   this.endDttm.setFullYear(this.endDttm.getFullYear() + 1);
  //   this.issueCnt = 1;
  // }

}

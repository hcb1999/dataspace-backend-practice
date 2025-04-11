import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional, IsObject } from "class-validator";
import { Transform } from 'class-transformer';

export class CreateDidAciDto {
  @IsString()
  @Length(1, 256)
  @ApiProperty({ description: 'DID'})
  readonly did: string;

  // VC 속성
  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: '이메일주소'})
  // readonly id: string;

  // @IsString()
  // @Length(1, 80)
  // @ApiProperty({ description: '계정'})
  // readonly account: string;

  // @IsString()
  // @Length(1, 256)
  // @ApiProperty({ description: '계정 키'})
  // readonly privateKey: string;

  @IsString()
  @Length(1, 40)
  @ApiProperty({ description: '닉네임' })
  readonly nickName: string;

  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  @IsObject()
  @ApiProperty({ description: '에셋등록증 (JSON 파싱)', required: false })
  attributes: Record<string, any>;

  // @IsString()
  // @ApiProperty({ description: '에셋등록증'})
  // attributes: string;

}
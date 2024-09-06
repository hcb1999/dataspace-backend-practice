import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsOptional } from "class-validator";

export class ModifyStateDto {
  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ required: false, description: '상태 분류 : 굿즈/에셋-굿즈상품/결재' })
  readonly category: string;
  
  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiProperty({ required: false, description: '상태값 : P2' })
  readonly state: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  @ApiProperty({ required: false, description: '상태 설명 : 게시중' })
  readonly stateDesc: string;
}
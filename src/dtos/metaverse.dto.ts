import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class MetaverseDto {
  @IsString()
  @Length(1, 100)
  @ApiProperty({ description: '메타버스업체명 : 로블록스 / 제페토 / K-POP 월드' })
  readonly metaverseName: string;
}
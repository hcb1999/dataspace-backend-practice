import { ApiProperty } from "@nestjs/swagger";

export class CreateTransferCallBackDto {
  
  @ApiProperty({ description: '결과' })
  result: boolean;

  @ApiProperty({ description: '콜백 데이터' })
  data: Object;
}

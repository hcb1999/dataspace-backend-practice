import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";

@Entity({ name: "ar_asset" })
export class Asset extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "asset_no", comment: "에셋 번호" })
  assetNo: number;

  @Index()
  @Column({ name: "user_no", type: "int4", comment: "크리에이터 사용자번호" })
  userNo: number;

  @Index()
  @Column({ name: "product_no", type: "int4", comment: "광고제품번호" })
  productNo: number;

  @Column({ name:"reg_name", type: "varchar", length: 40, comment: "등록자 이름" })
  regName: string;

  @Column({ name:"reg_addr", type:"varchar", length:80, comment:"등록자 지갑주소" })
  regAddr: string;

  @Column({ name: "asset_name", type: "varchar", length: 256, comment: "에셋명" })
  assetName: string;

  @Column({ name: "ad_target", type: "int4", comment: "광고 메타버스" })
  adTarget: number;

  @Column({ name: "metaverse_name", type: "varchar", length: 256, comment: "메타버스 업체명" })
  metaverseName: string;

  @Column({ name: "ad_type", type: "int4", comment: "광고 에셋 분류 " })
  adType: number;

  @Column({ name: "type_def", type: "varchar", length: 256, comment: "에셋 타입 정의" })
  typeDef: string;

  @Column({ name: "price", type: "float", comment: "판매가격", default: 0.0 })
  price: number;

  @Column({ name: "start_dttm", type: "timestamp", comment: "판매 시작일시"  })
  startDttm: Date;

  @Column({ name: "end_dttm", type: "timestamp", comment: "판매 종료일시"  })
  endDttm: Date;

  @Column({ name: "state", type: "varchar", length: 10, comment: "판매 상태", default: 'S1' })
  state: string;

  @Column({ name: "asset_desc", type: "varchar", length: 256, comment: "에셋 설명", nullable: true })
  assetDesc: string;

  @Index()
  @Column({ name: "file_no", type: "int4", comment: "에셋 이미지 파일번호", default: 0 })
  fileNo: number;

  @Column({ name: "stop_desc", type: "varchar", length: 256, comment: "판매중지 사유", nullable: true })
  stopDesc: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부", default: "Y" })
  useYn: string;

  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰ID", nullable: true})
  tokenId: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
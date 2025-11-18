import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";

@Entity({ name: "ar_product" })
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "product_no", comment: "광고상품 번호" })
  productNo: number;

  @Index()
  @Column({ name: "user_no", type: "int4", comment: "광고주 사용자 번호" })
  userNo: number;

  @Column({ name:"reg_name", type: "varchar", length: 40, comment: "등록자 이름" })
  regName: string;

  @Column({ name:"reg_addr", type:"varchar", length:80, comment:"등록자 지갑주소" })
  regAddr: string;

  @Column({ name: "product_name", type: "varchar", length: 80, comment: "광고제품명" })
  productName: string;

  @Column({ name: "ad_target_first", type: "int4", comment: "광고 메타버스 업체", nullable: true })
  adTargetFirst: number;

  @Column({ name: 'ad_types_first', type: 'int4', array: true, comment: '광고 메타버스 업체별 에셋 분류', nullable: true })
  adTypesFirst: number[]; 

  @Column({ name: "ad_target_second", type: "int4", comment: "광고 메타버스 업체", nullable: true })
  adTargetSecond: number;

  @Column({ name: "ad_types_second", type: "int4", array: true, comment: "광고 메타버스 업체별 에셋 분류", nullable: true })
  adTypesSecond: number[];

  @Column({ name: "ad_target_third", type: "int4", comment: "광고 메타버스 업체", nullable: true })
  adTargetThird: number;

  @Column({ name: "ad_types_third", type: "int4", array: true, comment: "광고 메타버스 업체별 에셋 분류", nullable: true })
  adTypesThird: number[];

  @Column({ name: "ad_target_fourth", type: "int4", comment: "광고 메타버스 업체", nullable: true })
  adTargetFourth: number;

  @Column({ name: "ad_types_fourth", type: "int4", array: true, comment: "광고 메타버스 업체별 에셋 분류", nullable: true })
  adTypesFourth: number[];

  // @Column({ name: "product_desc", type: "varchar", length: 200, comment: "광고상품 설명", nullable: true })
  // productDesc: string;

  @Column({ name: "product_desc", type: "text", comment: "광고제품 설명", nullable: true })
  productDesc: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "게시 상태", default: 'N1' })
  state: string;

  @Column({ name: "file_no", type: "int4", comment: "광고상품 이미지 파일번호", default: 0 })
  fileNo: number;

  @Column({ name: "start_dttm", type: "timestamp", comment: "광고게시 시작일시", nullable: true })
  startDttm: Date;

  @Column({ name: "end_dttm", type: "timestamp", comment: "광고게시 종료일시" , nullable: true })
  endDttm: Date;

  @Column({ name: "stop_desc", type: "varchar", length: 256, comment: "게시중지 사유", nullable: true })
  stopDesc: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부", default: "Y" })
  useYn: string;

  // @Column({ name: "minted_yn", type: "varchar", length: 1, comment: "민트 여부", default: "N" })
  // mintedYn: string;

  // @Column({ name: "adv_tot_amt", type: "int4", comment: "광고집행총액", default: 0 , nullable: true })
  // advTotAmt: number;

  // @Column({ name: "adv_balance", type: "int4", comment: "광고집행잔액", default: 0, unsigned: false, nullable: true })
  // advBalance: number;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
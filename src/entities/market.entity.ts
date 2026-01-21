import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn } from "typeorm";

@Entity({name: "ar_market"})
export class Market extends BaseEntity {
  @PrimaryGeneratedColumn({name:"market_no", comment:"마켓 데이터 번호"})
  marketNo: number;

  @Index()
  @Column({ name: "user_no", type: "int4", comment: "크리에이터 사용자번호" })
  userNo: number;

  @Column({ name:"reg_name", type: "varchar", length: 40, comment: "등록자 이름" })
  regName: string;

  @Column({ name:"reg_addr", type:"varchar", length:80, comment:"등록자 지갑주소" })
  regAddr: string;
  
  @Index()
  @Column({ name: "file_no", type: "int4", comment: "데이터 이미지 파일번호", default: 0 })
  fileNo: number;

  @Index()
  @Column({name:"purchase_no", comment:"사용자 구매 번호", nullable: true })
  purchaseNo: number;

  @Column({ name: "market_sc_type", type: "varchar", length:  10, comment: "마켓의 스키마 타입 (사용자 선택값)", nullable: true })
  marketScType: string;

  @Column({ name: "market_vc_type", type: "varchar", length:  10, comment: "마켓의 vc 타입 (오스레저 발급 응답값)", nullable: true })
  marketVcType: string;

  @Column({ name: "market_data_name", type: "varchar", length: 256, comment: "마켓의 데이터명", nullable: true })
  marketDataName: string;

  @Column({ name: "market_data_desc", type: "text", comment: "마켓의 데이터설명", nullable: true })
  marketDataDesc: string;

  @Column({ name: "market_product_type", type: "varchar", length: 256, comment: "마켓의 상품유형", nullable: true })
  marketProductType: string;

  @Column({ name: "market_language", type: "varchar", length: 256, comment: "마켓의 데이터언어", nullable: true })
  marketLanguage: string;

  @Column({ name: "market_keyword", type: "varchar", length: 256, comment: "마켓의 데이터 키워드", nullable: true })
  marketKeyword: string;

  @Column({ name: "market_doi", type: "varchar", length: 256, comment: "마켓의 doi 번호", nullable: true })
  marketDoi: string;

  @Column({ name: "market_subject", type: "varchar", length: 256, comment: "마켓의 데이터 주제", nullable: true })
  marketSubject: string;

  @Column({ name: "market_issuer", type: "varchar", length: 256, comment: "마켓의 데이터 발행기관", nullable: true })
  marketIssuer: string;

  @Column({ name: "market_doi_url", type: "varchar", length: 256, comment: "마켓의 데이터 doi url", nullable: true })
  marketDoiUrl: string;

  @Index()
  @Column({name:"sale_addr", type:"varchar", length:80, comment:"판매자 지갑주소", nullable: true })
  saleAddr: string;

  @Column({ name:"sale_user_name", type:"varchar", length:40, comment:"판매자명" , nullable: true })
  saleUserName: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "판매 상태", default: 'S1' })
  state: string;

  @Column({ name: "issue_cnt", type: "int4", comment: "NFT 발행량", default: 1 })
  issueCnt: number;
  
  @Column({ name: "sale_cnt", type: "int4", comment: "NFT 판매량", default: 0 })
  saleCnt: number;

  @Column({ name: "inventory_cnt", type: "int4", comment: "NFT 재고량", default: 0 })
  inventoryCnt: number;

  @Column({ name: "price", type: "float", comment: "판매가격", default: 0.0 })
  price: number;

  @Column({ name: "start_dttm", type: "timestamp", comment: "판매 시작일시"  })
  startDttm: Date;

  @Column({ name: "end_dttm", type: "timestamp", comment: "판매 종료일시"  })
  endDttm: Date;

  @Column({ name: "resale_yn", type: "varchar", length: 1, comment: "재판매 여부", default: "N" })
  resaleYn: string;

  @Column({ name: "stop_desc", type: "varchar", length: 256, comment: "판매중지 사유", nullable: true })
  stopDesc: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "마켓 데이터 사용 여부", default: "Y" })
  useYn: string;

  @Index()
  @Column({ name: "vc_id", type: "varchar", length: 256 , comment: "VC ID", nullable: true })
  vcId: string;

  @Column({ name: "vc_issuer_name", type: "varchar", length: 256 , comment: "VC 발급자 국문 이름", nullable: true })
  vcIssuerName: string;

  @Column({ name: "vc_issuer_logo", type: "varchar", length: 256 , comment: "VC 발급자 로고 이미지 URL", nullable: true })
  vcIssuerLogo: string;

  @Column({ name: "vc_type_name", type: "varchar", length: 256 , comment: "VC 타입 국문 이름", nullable: true })
  vcTypeName: string;

  @Column({ name: "from_token_id", type: "varchar", length: 40, comment: "From 토큰 ID", nullable: true})
  fromTokenId: string;

  @Column({ name: "to_token_id", type: "varchar", length: 40, comment: "To 토큰 ID", nullable: true})
  toTokenId: string;
  
  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;

  // @UpdateDateColumn({ type: 'timestamptz', name:"pay_dttm", comment:"결제일시" })
  // payDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"upd_dttm", comment:"수정일시" })
  updDttm: Date;
}
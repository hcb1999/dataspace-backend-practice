import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn } from "typeorm";

@Entity({name: "ar_market"})
export class Market extends BaseEntity {
  @PrimaryGeneratedColumn({name:"market_no", comment:"마켓 에셋 번호"})
  marketNo: number;

  @Index()
  @Column({name:"contract_no", comment:"엔터사 계약 번호"})
  contractNo: number;

  @Index()
  @Column({name:"purchase_no", comment:"사용자 구매 번호", nullable: true })
  purchaseNo: number;

  @Column({ name: "market_asset_name", type: "varchar", length: 256, comment: "마켓의 상품명"})
  marketAssetName: string;

  @Column({ name: "market_asset_desc", type: "text", comment: "마켓의 상품 설명", nullable: true })
  marketAssetDesc: string;

  @Index()
  @Column({name:"sale_addr", type:"varchar", length:80, comment:"판매 지갑주소", nullable: true })
  saleAddr: string;

  @Column({ name:"sale_user_name", type:"varchar", length:40, comment:"판매 광고주명" , nullable: true })
  saleUserName: string;

  @Index()
  @Column({ name:"product_no", type:"int4", comment:"구매한 상품 번호" })
  productNo: number;

  @Index()
  @Column({ name:"asset_no", type:"int4", comment:"구매한 상품의 에셋 번호" })
  assetNo: number;

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

  // @Column({ name: "start_dttm", type: "timestamp", comment: "광고게시 시작일시"  })
  // startDttm: Date;

  // @Column({ name: "end_dttm", type: "timestamp", comment: "광고게시 종료일시"  })
  // endDttm: Date;

  // @Column({ name: "minted_yn", type: "varchar", length: 1, comment: "민트 여부", default: "N" })
  // mintedYn: string;

  // @Column({ name: "minter_yn", type: "varchar", length: 1, comment: "최초 민터 여부", default: "Y" })
  // minterYn: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "마켓 에셋 사용 여부", default: "Y" })
  useYn: string;

  // @Column({ name: "sold_yn", type: "varchar", length: 1, comment: "굿즈 팔린 여부", default: "N" })
  // soldYn: string;

  // @Column({ name: "creator_token_id", type: "varchar", length: 40, comment: "크리에이터 토큰 ID", nullable: true})
  // creatorTokenId: string;

  @Column({ name: "from_token_id", type: "varchar", length: 40, comment: "From 토큰 ID", nullable: true})
  fromTokenId: string;

  @Column({ name: "to_token_id", type: "varchar", length: 40, comment: "To 토큰 ID", nullable: true})
  toTokenId: string;
  
  // @Column({ name:"tx_id", type:"varchar", length:40, comment:"NFT 이전 TX ID", nullable: true})
  // txId: string;

  // @Column({ name:"dl_state", type:"varchar", length:1, comment:"학습상태", nullable: true })
  // dlState: string;

  // @Column({ name:"avatar_cnt", type:"int4", comment:"광고아바타 건수", nullable: true })
  // avatarCnt: number;

  // @Column({ name: "adv_tot_amt", type: "int4", comment: "광고집행총액", default: 0 })
  // advTotAmt: number;

  // @Column({ name: "adv_balance", type: "int4", comment: "광고집행잔액", default: 0, unsigned: false  })
  // advBalance: number;
  
  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;

  // @UpdateDateColumn({ type: 'timestamptz', name:"pay_dttm", comment:"결제일시" })
  // payDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"upd_dttm", comment:"수정일시" })
  updDttm: Date;
}
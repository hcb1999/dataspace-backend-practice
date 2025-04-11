import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn } from "typeorm";

@Entity({name: "ar_purchase"})
export class Purchase extends BaseEntity {
  @PrimaryGeneratedColumn({name:"purchase_no", comment:"사용자 구매 번호"})
  purchaseNo: number;

  @Index()
  @Column({name:"purchase_addr", type:"varchar", length:80, comment:"구매 지갑주소"})
  purchaseAddr: string;

  @Column({ name:"purchase_user_name", type:"varchar", length:40, comment:"구매 사용자명" })
  purchaseUserName: string;

  @Index()
  @Column({name:"sale_addr", type:"varchar", length:80, comment:"판매 지갑주소"})
  saleAddr: string;

  @Column({ name:"sale_user_name", type:"varchar", length:40, comment:"판매 광고주명" })
  saleUserName: string;

  @Index()
  @Column({ name:"market_no", type:"int4", comment:"구매한 마켓 판매 번호" })
  marketNo: number;

  @Column({ name: "state", type: "varchar", length: 10, comment: "구매 상태", default: 'P2' })
  state: string;

  @Column({ name:"purchase_cnt", type:"int4", comment:"NFT 구매 수량", default: 1 })
  purchaseCnt: number;

  @Column({ name: "sale_cnt", type: "int4", comment: "NFT 재판매량", default: 0 })
  saleCnt: number;

  @Column({ name: "inventory_cnt", type: "int4", comment: "NFT 재고량", default: 0 })
  inventoryCnt: number;

  @Column({ name: "resale_yn", type: "varchar", length: 1, comment: "재판매 등록 여부", default: "N" })
  resaleYn: string;

  // @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰 ID", nullable: true})
  // tokenId: string;
  
  @Column({ name: "from_token_id", type: "varchar", length: 40, comment: "From 토큰 ID", nullable: true})
  fromTokenId: string;

  @Column({ name: "to_token_id", type: "varchar", length: 40, comment: "To 토큰 ID", nullable: true})
  toTokenId: string;

  @Column({ name: "fail_desc", type: "varchar", length: 256, comment: "결제실패 사유", nullable: true })
  failDesc: string;

  // @Column({ name:"tx_id", type:"varchar", length:40, comment:"NFT 이전 TX ID", nullable: true})
  // txId: string;

  // @Column({ name:"dl_state", type:"varchar", length:1, comment:"학습상태", nullable: true })
  // dlState: string;

  // @Column({ name:"avatar_cnt", type:"int4", comment:"광고아바타 건수", nullable: true })
  // avatarCnt: number;

  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"pay_dttm", comment:"결제일시" })
  payDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"upd_dttm", comment:"수정일시" })
  updDttm: Date;
}
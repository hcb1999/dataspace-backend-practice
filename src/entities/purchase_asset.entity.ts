import { Entity, Index, BaseEntity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn } from "typeorm";

@Entity({name: "ar_purchase_asset"})
export class PurchaseAsset extends BaseEntity {
  @PrimaryGeneratedColumn({name:"purchase_asset_no", comment:"광고주 구매 번호"})
  purchaseAssetNo: number;

  @Index()
  @Column({name:"purchase_addr", type:"varchar", length:80, comment:"구매 지갑주소"})
  purchaseAddr: string;

  @Column({ name:"purchase_user_name", type:"varchar", length:40, comment:"구매 광고주명" })
  purchaseUserName: string;
  
  @Index()
  @Column({name:"sale_addr", type:"varchar", length:80, comment:"판매 지갑주소"})
  saleAddr: string;

  @Column({ name:"sale_user_name", type:"varchar", length:40, comment:"판매 크리에이터명" })
  saleUserName: string;

  @Index()
  @Column({ name:"product_no", type:"int4", comment:"구매한 상품 번호" })
  productNo: number;

  @Index()
  @Column({ name:"asset_no", type:"int4", comment:"구매한 상품의 에셋 번호" })
  assetNo: number;

  @Column({ name: "state", type: "varchar", length: 10, comment: "구매 상태", default: 'P2' })
  state: string;

  @Column({ name: "sale_state", type: "varchar", length: 10, comment: "판매 상태", default: 'S2' })
  saleState: string;

  @Column({ name: "start_dttm", type: "timestamp", comment: "광고게시 시작일시"  })
  startDttm: Date;

  @Column({ name: "end_dttm", type: "timestamp", comment: "광고게시 종료일시"  })
  endDttm: Date;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "굿즈 사용 여부", default: "Y" })
  useYn: string;

  @Column({ name: "sold_yn", type: "varchar", length: 1, comment: "굿즈 팔린 여부", default: "N" })
  soldYn: string;

  @Column({ name: "fail_desc", type: "varchar", length: 256, comment: "결제실패 사유", nullable: true })
  failDesc: string;

  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰 ID", nullable: true})
  tokenId: string;
  
  @Column({ name:"tx_id", type:"varchar", length:40, comment:"NFT 이전 TX ID", nullable: true})
  txId: string;

  @Column({ name:"dl_state", type:"varchar", length:1, comment:"학습상태", nullable: true })
  dlState: string;

  @Column({ name:"avatar_cnt", type:"int4", comment:"광고아바타 건수", nullable: true })
  avatarCnt: number;

  @Column({ name: "adv_tot_amt", type: "int4", comment: "광고집행총액", default: 0 })
  advTotAmt: number;

  @Column({ name: "adv_balance", type: "int4", comment: "광고집행잔액", default: 0, unsigned: false  })
  advBalance: number;
  
  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"pay_dttm", comment:"결제일시" })
  payDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"upd_dttm", comment:"수정일시" })
  updDttm: Date;
}
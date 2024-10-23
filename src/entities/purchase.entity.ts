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
  @Column({ name:"purchase_asset_no", type:"int4", comment:"구매한 광고주 구매 번호" })
  purchaseAssetNo: number;

  @Column({ name: "state", type: "varchar", length: 10, comment: "구매 상태", default: 'P2' })
  state: string;

  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰 ID", nullable: true})
  tokenId: string;

  @Column({ name: "fail_desc", type: "varchar", length: 256, comment: "결제실패 사유", nullable: true })
  failDesc: string;

  @Column({ name:"tx_id", type:"varchar", length:40, comment:"NFT 이전 TX ID", nullable: true})
  txId: string;

  @Column({ name:"dl_state", type:"varchar", length:1, comment:"학습상태", nullable: true })
  dlState: string;

  @Column({ name:"avatar_cnt", type:"int4", comment:"광고아바타 건수", nullable: true })
  avatarCnt: number;

  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"pay_dttm", comment:"결제일시" })
  payDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name:"upd_dttm", comment:"수정일시" })
  updDttm: Date;
}
import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_nft_transfer"})
export class NftTransfer extends BaseEntity {
  @PrimaryGeneratedColumn({name:"nft_transfer_no", comment:"NFT 이전 번호"})
  nftTransferNo: number;

  @Index()
  @Column({ name:"purchase_asset_no", type:"int4", comment:"광고주 구매번호", nullable:true })
  purchaseAssetNo: number;

  @Index()
  @Column({ name:"purchase_no", type:"int4", comment:"사용자 구매번호", nullable:true })
  purchaseNo: number;

  @Index()
  @Column({name:"tx_id", type:"varchar", length:40, comment:"TX ID", nullable:true})
  txId: string;

  @Column({ name:"from_addr", type:"varchar", length:80, comment:"From 지갑주소" })
  fromAddr: string;

  @Column({ name:"to_addr", type:"varchar", length:80, comment:"to 지갑주소" })
  toAddr: string;

  @Column({ name:"token_idx", type:"varchar", length:256, comment:"토큰IDX", nullable:true })
  tokenIdx: string;

  @Column({ name:"result", type:"varchar", length:1, comment:"성공여부", default: "S" })
  result: string;

  @Column({ name:"res_data", type:"text", comment:"콜백 응답 데이터", nullable:true })
  resData: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
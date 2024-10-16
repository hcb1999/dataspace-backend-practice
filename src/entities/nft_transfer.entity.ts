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
  @Column({name:"tx_id", type:"varchar", length:100, comment:"TX ID", nullable:true})
  txId: string;

  @Column({ name:"from_addr", type:"varchar", length:80, comment:"From 지갑주소" })
  fromAddr: string;

  @Column({ name:"to_addr", type:"varchar", length:80, comment:"to 지갑주소" })
  toAddr: string;

  @Index()
  @Column({ name:"product_no", type:"int4", comment:"상품 번호", nullable:true })
  productNo: number;
  
  @Index()
  @Column({ name:"asset_no", type:"int4", comment:"에셋 번호", nullable:true })
  assetNo: number;

  @Index()
  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰ID"})
  tokenId: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "트랜스퍼 시작", default: 'B5' })
  state: string;

  @Column({ name:"result", type:"varchar", length:1, comment:"성공여부", default: "S" })
  result: string;

  @Column({ name:"res_data", type:"text", comment:"콜백 응답 데이터", nullable:true })
  resData: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
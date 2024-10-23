import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_nft_mint"})
export class NftMint extends BaseEntity {
  @PrimaryGeneratedColumn({name:"nft_mint_no", comment:"NFT 발행 번호"})
  nftMintNo: number;

  @Column({ name:"contract_id", type:"varchar", length:80, comment:"Contract ID", nullable:true  })
  contractId: string;

  @Column({ name:"metadata_id", type:"varchar", length:40, comment:"메타데이터 ID", nullable:true  })
  metadataId: string;

  @Index()
  @Column({ name:"product_no", type:"int4", comment:"상품 번호" })
  productNo: number;
  
  @Index()
  @Column({ name:"asset_no", type:"int4", comment:"에셋 번호" })
  assetNo: number;

  @Index()
  @Column({name:"tx_id", type:"varchar", length:100, comment:"TX ID", nullable:true})
  txId: string;

  @Index()
  @Column({ name:"issued_to", type:"varchar", length:80, comment:"NFT 발행 지갑 주소" })
  issuedTo: string;

  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰 ID", nullable: true})
  tokenId: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "민팅 상태", default: 'B1' })
  state: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부", default: "N" })
  useYn: string;

  @Column({ name: "burn_yn", type: "varchar", length: 1, comment: "소각 여부", default: "N" })
  burnYn: string;

  @Column({ name:"res_data", type:"text", comment:"콜백 응답 데이터", nullable:true })
  resData: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
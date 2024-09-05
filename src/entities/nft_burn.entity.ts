import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_nft_burn"})
export class NftBurn extends BaseEntity {
  @PrimaryGeneratedColumn({name:"nft_burn_no", comment:"NFT 소각 번호"})
  nftBurnNo: number; 

  @Column({ name:"contract_id", type:"varchar", length:80, comment:"Contract ID", nullable:true  })
  contractId: string;

  @Column({ name:"metadata_id", type:"varchar", length:40, comment:"메타데이터 ID", nullable:true  })
  metadataId: string;

  @Index()
  @Column({ name:"product_no", type:"int4", comment:"상품 번호", nullable:true  })
  productNo: number;
  
  @Index()
  @Column({ name:"asset_no", type:"int4", comment:"에셋 번호" })
  assetNo: number;

  @Index()
  @Column({ name:"issued_to", type:"varchar", length:80, comment:"NFT 발행 지갑 주소" })
  issuedTo: string;

  @Column({ name:"token_idx", type:"varchar", length:256, comment:"토큰IDX" })
  tokenIdx: string;

  @Column({ name:"res_data", type:"text", comment:"콜백 응답 데이터", nullable:true })
  resData: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
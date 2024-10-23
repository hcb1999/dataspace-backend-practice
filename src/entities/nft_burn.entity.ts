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
  @Column({ name:"asset_no", type:"int4", comment:"에셋 번호", nullable:true  })
  assetNo: number;

  @Index()
  @Column({name:"tx_id", type:"varchar", length:100, comment:"TX ID", nullable:true})
  txId: string;
  
  @Index()
  @Column({ name:"issued_to", type:"varchar", length:80, comment:"NFT 발행 지갑 주소", nullable: true})
  issuedTo: string;

  @Index()
  @Column({ name: "token_id", type: "varchar", length: 40, comment: "토큰ID"})
  tokenId: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "버닝 상태", default: 'B13' })
  state: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부", default: "N" })
  useYn: string;

  @Column({ name:"res_data", type:"text", comment:"콜백 응답 데이터", nullable:true })
  resData: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
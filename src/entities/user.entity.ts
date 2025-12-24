import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, Index, PrimaryColumn, Unique, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ar_user" })
@Unique(['nickName'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "user_no", comment: "사용자번호" })
  userNo: number;

  @Column({ name:"user_name", type: "varchar", length: 40, comment: "사용자명", nullable: true })
  userName: string;

  @Column({ name: "phone", type: "varchar", length: 16, comment: "전화번호", nullable: true })
  phone: string;

  @Column({ name: "email", type: "varchar", length: 80, comment: "이메일", nullable: true })
  email: string;

  @Column({ name:"password", type:"varchar", length:256, comment:"패스워드", nullable: true})
  password: string;

  @Column({ name: "birth", type: "varchar", length: 8, comment: "생년월일", nullable: true })
  birth: string;

  @Column({ name: "gender", type: "varchar", length: 1, comment: "성별", nullable: true })
  gender: string;

  @Column({ name: "nick_name", type: "varchar", length: 40, comment: "닉네임", nullable: true })
  nickName: string;

  @Column({ name: "billchain_id", type: "varchar", length: 64, comment: "빌체인 ID", nullable: true })
  billchainId: string;

  @Column({ name: "kakao_id", type: "varchar", length: 64, comment: "카카오 ID", nullable: true })
  kakaoId: string;

  @Column({ name: "use_glb_url", type: "varchar", length: 256, comment: "Unity사용자의 마지막 rpm의 glb 주소", nullable: true })
  useGlbUrl: string;

  @Index()
  @Column({name:"purchase_no", comment:"사용자 구매 번호", nullable: true })
  purchaseNo: number;

  @Column({ name: "org_id", type: "varchar", length: 64, comment: "오스레저 Org ID", nullable: true })
  orgId: string;

  nftWalletAccount: string;

  nftWalletAccountPKey: string;
  
  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부(Y:사용, N:탈퇴)", default: "Y" })
  useYn: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
  
}
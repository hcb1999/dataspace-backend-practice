import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "ar_file_asset" })
export class FileAsset extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "file_no", comment: "파일번호" })
  fileNo: number;

  @Column({ name: "file_name_first", type: "varchar", length: 256, comment: "1'st 파일명" })
  fileNameFirst: string;

  @Column({ name: "file_path_first", type: "varchar", length: 256, comment: "1'st 파일경로" })
  filePathFirst: string;

  @Column({ name: "file_size_first", type: "int4", comment: "1'st 파일 사이즈" })
  fileSizeFirst: number;

  @Column({ name: "file_type_first", type: "varchar", length: 80, comment: "1'st 파일 종류", nullable: true })
  fileTypeFirst: string;

  @Column({ name: "file_hash_first", type: "varchar", length: 256, comment: "1'st 파일 해쉬", nullable: true })
  fileHashFirst: string;

  @Column({ name: "file_name_second", type: "varchar", length: 256, comment: "2'nd 파일명", nullable: true })
  fileNameSecond: string;

  @Column({ name: "file_path_second", type: "varchar", length: 256, comment: "2'nd파일경로", nullable: true })
  filePathSecond: string;

  @Column({ name: "file_size_second", type: "int4", comment: "2'nd파일 사이즈", nullable: true })
  fileSizeSecond: number;

  @Column({ name: "file_type_second", type: "varchar", length: 80, comment: "2'nd파일 종류", nullable: true })
  fileTypeSecond: string;

  @Column({ name: "file_hash_second", type: "varchar", length: 256, comment: "2'nd파일 해쉬", nullable: true })
  fileHashSecond: string;

  @Column({ name: "file_name_third", type: "varchar", length: 256, comment: "3'nd 파일명", nullable: true })
  fileNameThird: string;

  @Column({ name: "file_path_third", type: "varchar", length: 256, comment: "3'nd파일경로", nullable: true })
  filePathThird: string;

  @Column({ name: "file_size_third", type: "int4", comment: "3'nd파일 사이즈", nullable: true })
  fileSizeThird: number;

  @Column({ name: "file_type_third", type: "varchar", length: 80, comment: "3'nd파일 종류", nullable: true })
  fileTypeThird: string;

  @Column({ name: "file_hash_third", type: "varchar", length: 256, comment: "3'nd파일 해쉬", nullable: true })
  fileHashThird: string;

  @Column({ name: "thumbnail_first", type: "varchar", length: 256, comment: "썸네일 파일", nullable: true })
  thumbnailFirst: string;

  @Column({ name: "thumbnail_second", type: "varchar", length: 256, comment: "썸네일 파일", nullable: true })
  thumbnailSecond: string;

  @Column({ name: "thumbnail_third", type: "varchar", length: 256, comment: "썸네일 파일", nullable: true })
  thumbnailThird: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}
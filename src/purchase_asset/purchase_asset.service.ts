import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { PurchaseAsset } from '../entities/purchase_asset.entity';
import { Product } from "../entities/product.entity";
import { Asset } from '../entities/asset.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { NftService } from '../nft/nft.service';
import { ConfigService } from '@nestjs/config';
import { CreatePurchaseAssetDto } from '../dtos/create_purchase_asset.dto';
import { ModifyPurchaseAssetDto } from '../dtos/modify_purchase_asset.dto';
import { GetPurchaseAssetDto } from '../dtos/get_purchase_asset.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class PurchaseAssetService {
  private logger = new Logger('PurchaseAssetService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('PURCHASE_ASSET_REPOSITORY')
    private purchaseAssetRepository: Repository<PurchaseAsset>,

    @Inject('PRODUCT_REPOSITORY')
    private productRepository: Repository<Product>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  /**
   * 에셋 구매 등록
   * 
   * @param user 
   * @param createPurchaseAssetDto 
   */
  async purchase(user: User, createPurchaseAssetDto: CreatePurchaseAssetDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 메타마스크 결제
      // 처음엔 P2(결제중) 
      // ---> 후에 결재결과를 따로 메타마스크 결제모드에서 처리하고 상태변경을 한다.
      // 상태는 개인키오류(P1), 결제완료(P3), 결제실패(P4)으로 한다. 실패 사유도 같이 넣어준다.

      
      const productNo = createPurchaseAssetDto.productNo;
      const productInfo = await this.productRepository.findOne({ where:{productNo} });
      if (!productInfo) {
        throw new NotFoundException("Data Not found.: 굿즈");
      }

      createPurchaseAssetDto['startDttm'] = productInfo.startDttm;
      createPurchaseAssetDto['endDttm'] = productInfo.endDttm;
      createPurchaseAssetDto['saleState'] = productInfo.state.replace('N', 'S');

      // console.log("===== createPurchaseAssetDto : "+createPurchaseAssetDto);

      // PurchaseAsset 저장
      const newPurchaseAsset = queryRunner.manager.create(PurchaseAsset, createPurchaseAssetDto);
      const result = await queryRunner.manager.save<PurchaseAsset>(newPurchaseAsset);

      await queryRunner.commitTransaction();
      
      // 이건 임시 DB용. 블록체인이 되면 그거 처리 후 수정하기
      const purchaseAssetNo = result.purchaseAssetNo;
      const modifyPurchaseAssetDto:ModifyPurchaseAssetDto = {state: 'P3', failDesc:undefined};
      this.updateState(purchaseAssetNo, modifyPurchaseAssetDto);

      return { purchaseAssetNo };
  
    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 구매 상태 정보 수정
   * @param purchaseAssetNo 
   * @param modifyPurchaseAssetDto 
   */
  async updateState(purchaseAssetNo: number, modifyPurchaseAssetDto: ModifyPurchaseAssetDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const purchaseAssetInfo = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
        if (!purchaseAssetInfo) {
          throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
        }

        const state = modifyPurchaseAssetDto.state;
        const failDesc = modifyPurchaseAssetDto.failDesc;
        let data = {};
        if(failDesc){
          data = { state, failDesc };
        }else{
          data = { state }
        }
    
        await queryRunner.manager.update(PurchaseAsset, purchaseAssetNo, data);

      // state가 결제완료(P3)면 NftTransfer 저장
        if(state=== 'P3'){
          // NftTransfer 저장
          const productNo = purchaseAssetInfo.productNo;
          const assetNo = purchaseAssetInfo.assetNo;
          const nftMintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo} });
          if (!nftMintInfo) {
            throw new NotFoundException("Data Not found. : NFT 민트 정보");
          }
          const nftTransferInfo: CreateTransferDto = {purchaseAssetNo: purchaseAssetInfo.purchaseAssetNo, 
            purchaseNo: undefined, fromAddr: purchaseAssetInfo.saleAddr, toAddr: purchaseAssetInfo.purchaseAddr, 
            assetNo, productNo, tokenId: nftMintInfo.tokenId, state: 'B5'};

          console.log("===== nftTransferInfo : "+ nftTransferInfo);
          const newTransfer = queryRunner.manager.create(NftTransfer, nftTransferInfo);
          const result = await queryRunner.manager.save<NftTransfer>(newTransfer);
        }
        await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 구매 정보 조회
   * 
   * @param purchaseAssetNo 
   * @returns 
   */
  async getInfo(purchaseAssetNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const purchaseAsset = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
      if (!purchaseAsset) {                         
        throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
      }

      const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('purchaseAsset.product_no', 'productNo')
                      .addSelect('purchaseAsset.asset_no', 'assetNo')
                      .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
                      .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
                      .addSelect('purchaseAsset.sale_addr', 'saleAddr')
                      .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
                      .addSelect('purchaseAsset.sold_yn', 'soldYn')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('purchaseAsset.start_dttm', 'startDttm')
                      .addSelect('purchaseAsset.end_dttm', 'endDttm')
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .where("purchaseAsset.purchase_asset_no = :purchaseAssetNo", { purchaseAssetNo })
                    // .andWhere("nftMint.use_yn = 'N'")
                    // .andWhere("nftMint.burn_yn = 'N'");

      const purchaseAssetInfo = await sql.groupBy(``)
                                      .getRawOne();

      return purchaseAssetInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * 구매 목록 조회
   * @param getPurchaseAssetDto 
   */
  async getPurchaseList(getPurchaseAssetDto: GetPurchaseAssetDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getPurchaseAssetDto.getOffset();
    const take = getPurchaseAssetDto.getLimit();
    const word = getPurchaseAssetDto.word;

    let options = `purchaseAsset.use_yn='Y' and purchaseAsset.state='P3'
     and purchaseAsset.sale_state='S2' and purchaseAsset.sold_yn='N'`;
    if (word) {
        options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
    }
  
    // console.log("options : "+options);

    try {
        const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
                      .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
                      .addSelect('purchaseAsset.sale_addr', 'saleAddr')
                      .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('purchaseAsset.start_dttm', 'startDttm')
                      .addSelect('purchaseAsset.end_dttm', 'endDttm')
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .where(options);


        const list = await sql.orderBy('purchaseAsset.purchase_asset_no', getPurchaseAssetDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .skip(skip)
                              .take(take)
                              .groupBy(`purchaseAsset.purchase_asset_no, asset.price, asset.asset_name,
                                asset.asset_desc, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getPurchaseAssetDto.pageSize, list);
0
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

}

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { EContract } from '../entities/contract.entity';
import { Asset } from '../entities/asset.entity';
import { Advertiser } from '../entities/advertiser.entity';
import { File } from '../entities/file.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { AssetType } from '../entities/asset_type.entity';
import { State } from '../entities/state.entity';
import { Metaverse } from '../entities/metaverse.entity';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from '../dtos/create_product.dto';
import { ModifyProductDto } from '../dtos/modify_product.dto';
import { GetProductDto } from '../dtos/get_product.dto';
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class ProductService {
  private logger = new Logger('ProductService');

  constructor(
    private configService: ConfigService,

    @Inject('PRODUCT_REPOSITORY')
    private productRepository: Repository<Product>,

    @Inject('CONTRACT_REPOSITORY')
    private contractRepository: Repository<EContract>,

    @Inject('ADVERTISER_REPOSITORY')
    private advertiserRepository: Repository<Advertiser>,

    @Inject('STATE_REPOSITORY')
    private stateRepository: Repository<State>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  /**
   * 굿즈 정보 등록
   *
   * @param user
   * @param files
   * @param createProductDto
   */
  async create(
    user: User,
    files: any,
    createProductDto: CreateProductDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const advertiserInfo = await this.advertiserRepository.findOne({
        where: { userNo },
      });
      if (!advertiserInfo) {
        const advertiserInfo1 = { userNo, advName: user.nickName };

        // console.log("===== creatorInfo : "+ creatorInfo);
        const newAdvertiser = queryRunner.manager.create(
          Advertiser,
          advertiserInfo1,
        );
        const result =
          await queryRunner.manager.save<Advertiser>(newAdvertiser);
      }

      // if (!files) {
      //   throw new BadRequestException("파일 미입력");
      // }

      if (files) {
        let fileNameFirst = '';
        let fileTypeFirst = '';
        let filePathFirst = '';
        let fileSizeFirst = 0;
        let fileHashFirst = '';
        let thumbnailFirst = '';
        let fileNameSecond = '';
        let fileTypeSecond = '';
        let filePathSecond = '';
        let fileSizeSecond = 0;
        let fileHashSecond = '';
        let thumbnailSecond = '';
        let fileNameThird = '';
        let fileTypeThird = '';
        let filePathThird = '';
        let fileSizeThird = 0;
        let fileHashThird = '';
        let thumbnailThird = '';
        // 파일 정보 저장
        const promises = files.map(async (file: any, index: any) => {
          // console.log("=== index : "+index+", file : "+JSON.stringify(file));
          if (index == 0) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameFirst = file.fileName;
            fileTypeFirst = file.fileType;
            filePathFirst = file.filePath;
            fileSizeFirst = file.fileSize;
            fileHashFirst = file.fileHash;
            if (file.thumbnail) {
              thumbnailFirst = file.thumbnail;
            }
          } else if (index == 1) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameSecond = file.fileName;
            fileTypeSecond = file.fileType;
            filePathSecond = file.filePath;
            fileSizeSecond = file.fileSize;
            fileHashSecond = file.fileHash;
            if (file.thumbnail) {
              thumbnailSecond = file.thumbnail;
            }
          } else {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameThird = file.fileName;
            fileTypeThird = file.fileType;
            filePathThird = file.filePath;
            fileSizeThird = file.fileSize;
            fileHashThird = file.fileHash;
            if (file.thumbnail) {
              thumbnailThird = file.thumbnail;
            }
          }

          // Hash값 체크
          // const fileRepo = await this.fileRepository.find({ where:{fileHash} });
          // if(fileRepo && fileRepo.length){
          //   throw new ConflictException("동일한 파일 존재");
          // }
        });

        let fileInfo = {
          fileNameFirst,
          filePathFirst,
          fileSizeFirst,
          fileTypeFirst,
          fileHashFirst,
          thumbnailFirst,
          fileNameSecond,
          filePathSecond,
          fileSizeSecond,
          fileTypeSecond,
          fileHashSecond,
          thumbnailSecond,
          fileNameThird,
          filePathThird,
          fileSizeThird,
          fileTypeThird,
          fileHashThird,
          thumbnailThird
        };

        const newFile = queryRunner.manager.create(File, fileInfo);
        await queryRunner.manager.save<File>(newFile);
        createProductDto['fileNo'] = newFile.fileNo;
      }

      // 굿즈 정보 저장
      // const userNo = user.userNo;
      createProductDto['userNo'] = user.userNo;
      createProductDto['regName'] = user.nickName;
      createProductDto['regAddr'] = user.nftWalletAccount;

      const adTypesArray1 = createProductDto.adTypesFirst
        ? createProductDto.adTypesFirst.split(',').map(Number)
        : [];
      const adTypesArray2 = createProductDto.adTypesSecond
        ? createProductDto.adTypesSecond.split(',').map(Number)
        : [];
      const adTypesArray3 = createProductDto.adTypesThird
        ? createProductDto.adTypesThird.split(',').map(Number)
        : [];
      const adTypesArray4 = createProductDto.adTypesFourth
        ? createProductDto.adTypesFourth.split(',').map(Number)
        : [];

      // console.log("adTypesArray1 : "+adTypesArray1);

      // 변환된 배열을 DTO에 할당
      const transformedDto = {
        ...createProductDto,
        adTypesFirst: adTypesArray1,
        adTypesSecond: adTypesArray2,
        adTypesThird: adTypesArray3,
        adTypesFourth: adTypesArray4,
      };

      console.log("transformedDto : "+JSON.stringify(transformedDto));
      const newProduct = queryRunner.manager.create(Product, transformedDto);
      const result = await queryRunner.manager.save<Product>(newProduct);

      await queryRunner.commitTransaction();

      return { productNo: result.productNo };
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 사용자 에셋 판매 등록용 굿즈 정보 등록
   *
   * @param user
   * @param files
   * @param createProductDto
   */
  /*
  async createSale(
    user: User,
    files: any,
    createProductDto: CreateProductDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const advertiserInfo = await this.advertiserRepository.findOne({
        where: { userNo },
      });
      if (!advertiserInfo) {
        const advertiserInfo1 = { userNo, advName: user.nickName };

        // console.log("===== creatorInfo : "+ creatorInfo);
        const newAdvertiser = queryRunner.manager.create(
          Advertiser,
          advertiserInfo1,
        );
        const result =
          await queryRunner.manager.save<Advertiser>(newAdvertiser);
      }

      // if (!files) {
      //   throw new BadRequestException("파일 미입력");
      // }

      if (files) {
        let fileNameFirst = '';
        let fileTypeFirst = '';
        let filePathFirst = '';
        let fileSizeFirst = 0;
        let fileHashFirst = '';
        let thumbnailFirst = '';
        let fileNameSecond = '';
        let fileTypeSecond = '';
        let filePathSecond = '';
        let fileSizeSecond = 0;
        let fileHashSecond = '';
        let thumbnailSecond = '';
        let fileNameThird = '';
        let fileTypeThird = '';
        let filePathThird = '';
        let fileSizeThird = 0;
        let fileHashThird = '';
        let thumbnailThird = '';
        // 파일 정보 저장
        const promises = files.map(async (file: any, index: any) => {
          // console.log("=== index : "+index+", file : "+JSON.stringify(file));
          if (index == 3) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameFirst = file.fileName;
            fileTypeFirst = file.fileType;
            filePathFirst = file.filePath;
            fileSizeFirst = file.fileSize;
            fileHashFirst = file.fileHash;
            if (file.thumbnail) {
              thumbnailFirst = file.thumbnail;
            }
          } 

          // Hash값 체크
          // const fileRepo = await this.fileRepository.find({ where:{fileHash} });
          // if(fileRepo && fileRepo.length){
          //   throw new ConflictException("동일한 파일 존재");
          // }
        });

        let fileInfo = {
          fileNameFirst,
          filePathFirst,
          fileSizeFirst,
          fileTypeFirst,
          fileHashFirst,
          thumbnailFirst,
          fileNameSecond,
          filePathSecond,
          fileSizeSecond,
          fileTypeSecond,
          fileHashSecond,
          thumbnailSecond,
          fileNameThird,
          filePathThird,
          fileSizeThird,
          fileTypeThird,
          fileHashThird,
          thumbnailThird
        };

        const newFile = queryRunner.manager.create(File, fileInfo);
        await queryRunner.manager.save<File>(newFile);
        createProductDto['fileNo'] = newFile.fileNo;
      }

      // 굿즈 정보 저장
      // const userNo = user.userNo;
      createProductDto['userNo'] = user.userNo;
      createProductDto['regName'] = user.nickName;
      createProductDto['regAddr'] = user.nftWalletAccount;

      const adTypesArray1 = createProductDto.adTypesFirst
        ? createProductDto.adTypesFirst.split(',').map(Number)
        : [];
      const adTypesArray2 = createProductDto.adTypesSecond
        ? createProductDto.adTypesSecond.split(',').map(Number)
        : [];
      const adTypesArray3 = createProductDto.adTypesThird
        ? createProductDto.adTypesThird.split(',').map(Number)
        : [];

      // console.log("adTypesArray1 : "+adTypesArray1);

      // 변환된 배열을 DTO에 할당
      const transformedDto = {
        ...createProductDto,
        adTypesFirst: adTypesArray1,
        adTypesSecond: adTypesArray2,
        adTypesThird: adTypesArray3,
      };

      console.log("transformedDto : "+JSON.stringify(transformedDto));
      const newProduct = queryRunner.manager.create(Product, transformedDto);
      const result = await queryRunner.manager.save<Product>(newProduct);

      await queryRunner.commitTransaction();

      return { productNo: result.productNo };
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
*/

  /**
   * 굿즈 정보 수정
   *
   * @param user
   * @param productNo
   * @param modifyProductDto
   */
  async update(
    user: User,
    productNo: number,
    files: any,
    modifyProductDto: ModifyProductDto,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const productInfo = await this.productRepository.findOne({
        where: { productNo, userNo },
      });
      if (!productInfo) {
        throw new NotFoundException('Data Not found. : 굿즈');
      }
      //게시전일때만 수정되게 되어있음
      if (productInfo.state !== 'N1') {
        const statetInfo = await this.stateRepository.findOne({
          where: { state: productInfo.state },
        });
        if (statetInfo) {
          throw new NotFoundException(
            'Already on ' + statetInfo.stateDesc + '.',
          );
        }
      }

      if (files) {
        console.log('files...');
        let fileNameFirst = '';
        let fileTypeFirst = '';
        let filePathFirst = '';
        let fileSizeFirst = 0;
        let fileHashFirst = '';
        let thumbnailFirst = '';
        let fileNameSecond = '';
        let fileTypeSecond = '';
        let filePathSecond = '';
        let fileSizeSecond = 0;
        let fileHashSecond = '';
        let thumbnailSecond = '';
        let fileNameThird = '';
        let fileTypeThird = '';
        let filePathThird = '';
        let fileSizeThird = 0;
        let fileHashThird = '';
        let thumbnailThird = '';
        // 파일 정보 저장
        const promises = files.map(async (file: any, index: any) => {
          if (index == 0) {
            fileNameFirst = file.fileName;
            fileTypeFirst = file.fileType;
            filePathFirst = file.filePath;
            fileSizeFirst = file.fileSize;
            fileHashFirst = file.fileHash;
            if (file.thumbnail) {
              thumbnailFirst = file.thumbnail;
            }
          } else if (index == 1) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameSecond = file.fileName;
            fileTypeSecond = file.fileType;
            filePathSecond = file.filePath;
            fileSizeSecond = file.fileSize;
            fileHashSecond = file.fileHash;
            if (file.thumbnail) {
              thumbnailSecond = file.thumbnail;
            }
          } else {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameThird = file.fileName;
            fileTypeThird = file.fileType;
            filePathThird = file.filePath;
            fileSizeThird = file.fileSize;
            fileHashThird = file.fileHash;
            if (file.thumbnail) {
              thumbnailThird = file.thumbnail;
            }
          }

          // Hash값 체크
          // const fileRepo = await this.fileRepository.find({ where:{fileHash} });
          // if(fileRepo && fileRepo.length){
          //   throw new ConflictException("동일한 파일 존재");
          // }
        });

        let fileInfo = {
          fileNameFirst,
          filePathFirst,
          fileSizeFirst,
          fileTypeFirst,
          fileHashFirst,
          thumbnailFirst,
          fileNameSecond,
          filePathSecond,
          fileSizeSecond,
          fileTypeSecond,
          fileHashSecond,
          thumbnailSecond,
          fileNameThird,
          filePathThird,
          fileSizeThird,
          fileTypeThird,
          fileHashThird,
          thumbnailThird
        };
        const newFile = queryRunner.manager.create(File, fileInfo);
        await queryRunner.manager.save<File>(newFile);
        modifyProductDto['fileNo'] = newFile.fileNo;
      }

      // 굿즈 정보 수정
      // console.log("=============== modifyProductDto :"+JSON.stringify(modifyProductDto));

      const adTypesArray1 = modifyProductDto.adTypesFirst
        ? modifyProductDto.adTypesFirst.split(',').map(Number)
        : [];
      const adTypesArray2 = modifyProductDto.adTypesSecond
        ? modifyProductDto.adTypesSecond.split(',').map(Number)
        : [];
      const adTypesArray3 = modifyProductDto.adTypesThird
        ? modifyProductDto.adTypesThird.split(',').map(Number)
        : [];
      const adTypesArray4 = modifyProductDto.adTypesFourth
        ? modifyProductDto.adTypesFourth.split(',').map(Number)
        : [];

      // console.log("adTypesArray1 : "+adTypesArray1);
      // 변환된 배열을 DTO에 할당
      const transformedDto = {
        ...modifyProductDto,
        adTypesFirst: adTypesArray1,
        adTypesSecond: adTypesArray2,
        adTypesThird: adTypesArray3,
        adTypesFourth: adTypesArray4,
      };

      await queryRunner.manager.update(Product, productNo, transformedDto);
      await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 굿즈 정보 삭제
   *
   * @param user
   * @param productNo
   */
  async delete(user: User, productNo: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const productInfo = await this.productRepository.findOne({
        where: { productNo, userNo },
      });
      if (!productInfo) {
        throw new NotFoundException('Data Not found. : 굿즈');
      }

      if (productInfo.state === 'N4') {
        const statetInfo = await this.stateRepository.findOne({
          where: { state: productInfo.state },
        });
        if (statetInfo) {
          throw new NotFoundException(
            'Already on ' + statetInfo.stateDesc + '.',
          );
        }

      }

      // 굿즈 정보 삭제 수정
      let data = { useYn: 'N', state: 'N4' };
      await queryRunner.manager.update(Product, { productNo }, data);

      // const contractInfo = await this.contractRepository.findOne({
      //   where: { productNo },
      // });
      // if (contractInfo) {
      //   let data1 = { useYn: 'N', saleState: 'S4' };
      //   const contractNo = contractInfo.contractNo;
      //   // 엔터사 에셋 구매 상태 정보 수정
      //   await this.contractRepository.update(contractNo, data1);
      // }

      await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 굿즈 게시 상태 변경
   *
   * @param user
   * @param productNo
   */
  async updateState(user: User, productNo: number, state: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const productInfo = await this.productRepository.findOne({
        where: { productNo, userNo },
      });
      if (!productInfo) {
        throw new NotFoundException('Data Not found. : 굿즈');
      }

      // 굿즈 상태 정보 수정
      let data = { state: 'N'+state };
      await this.productRepository.update(productNo, data);

      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 굿즈 게시 초기화
   *
   * @param user
   * @param productNo
   */
  // async updateReset(user: User, productNo: number): Promise<void> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const userNo = user.userNo;
  //     const productInfo = await this.productRepository.findOne({
  //       where: { productNo, userNo },
  //     });
  //     if (!productInfo) {
  //       throw new NotFoundException('Data Not found. : 굿즈');
  //     }

  //     // 굿즈 상태 정보 수정 - 게시초기화
  //     let data = { state: 'N1' };
  //     await this.productRepository.update(productNo, data);

  //     await queryRunner.commitTransaction();

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  /**
   * 굿즈 게시 중지
   *
   * @param user
   * @param productNo
   */
  // async updateStop(user: User, productNo: number): Promise<void> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const userNo = user.userNo;
  //     const productInfo = await this.productRepository.findOne({
  //       where: { productNo, userNo },
  //     });
  //     if (!productInfo) {
  //       throw new NotFoundException('Data Not found. : 굿즈');
  //     }

  //     // 굿즈 상태 정보 수정 - 게시중지
  //     let data = { state: 'N3' };
  //     await this.productRepository.update(productNo, data);

  //     await queryRunner.commitTransaction();

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  /**
   * 굿즈 정보 조회
   *
   * @param productNo
   * @returns
   */
  async getInfo(productNo: number): Promise<any> {
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const product = await this.productRepository.findOne({
        where: { productNo },
      });
      if (!product) {
        throw new NotFoundException('Data Not found. : 굿즈');
      }

      let productInfo = {};

      // console.log(" ======== productNo : "+product.productNo);
      const sql = this.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          Metaverse,
          'metaverseFirst',
          'product.ad_target_first = metaverseFirst.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseSecond',
          'product.ad_target_second = metaverseSecond.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseThird',
          'product.ad_target_third = metaverseThird.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseFourth',
          'product.ad_target_fourth = metaverseFourth.metaverse_no',
        )
        .leftJoin(
          AssetType,
          'assetTypeFirst',
          'assetTypeFirst.metaverse_no = product.ad_target_first AND (product.ad_types_first IS NULL OR assetTypeFirst.metaverse_asset_type_no = ANY(product.ad_types_first))',
        )
        .leftJoin(
          AssetType,
          'assetTypeSecond',
          'assetTypeSecond.metaverse_no = product.ad_target_second AND (product.ad_types_second IS NULL OR assetTypeSecond.metaverse_asset_type_no = ANY(product.ad_types_second))',
        )
        .leftJoin(
          AssetType,
          'assetTypeThird',
          'assetTypeThird.metaverse_no = product.ad_target_third AND (product.ad_types_third IS NULL OR assetTypeThird.metaverse_asset_type_no = ANY(product.ad_types_third))',
        )
        .leftJoin(
          AssetType,
          'assetTypeFourth',
          'assetTypeFourth.metaverse_no = product.ad_target_fourth AND (product.ad_types_fourth IS NULL OR assetTypeFourth.metaverse_asset_type_no = ANY(product.ad_types_fourth))',
        )
        .leftJoin(File, 'file', 'product.file_no = file.file_no')
        .select('product.product_no', 'productNo')
        .addSelect('product.reg_name', 'regName')
        .addSelect('product.reg_addr', 'regAddr')
        .addSelect('product.product_name', 'productName')
        .addSelect('product.ad_target_first', 'adTargetFirst')
        .addSelect('product.ad_target_second', 'adTargetSecond')
        .addSelect('product.ad_target_third', 'adTargetThird')
        .addSelect('product.ad_target_fourth', 'adTargetFourth')
        .addSelect('metaverseFirst.metaverse_name', 'adTargetFirstName')
        .addSelect('metaverseSecond.metaverse_name', 'adTargetSecondName')
        .addSelect('metaverseThird.metaverse_name', 'adTargetThirdName')
        .addSelect('metaverseFourth.metaverse_name', 'adTargetFourthName')
        .addSelect(
          "array_to_string(product.ad_types_first, ', ')",
          'adTypesFirst',
        )
        .addSelect(
          "array_to_string(product.ad_types_second, ', ')",
          'adTypesSecond',
        )
        .addSelect(
          "array_to_string(product.ad_types_third, ', ')",
          'adTypesThird',
        )
        .addSelect(
          "array_to_string(product.ad_types_fourth, ', ')",
          'adTypesFourth',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeFirst.type_def, ', ')",
          'adTypesFirstName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeSecond.type_def, ', ')",
          'adTypesSecondName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeThird.type_def, ', ')",
          'adTypesThirdName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeFourth.type_def, ', ')",
          'adTypesFourthName',
        )
        .addSelect('product.product_desc', 'productDesc')
        .addSelect('product.start_dttm', 'startDttm')
        .addSelect('product.end_dttm', 'endDttm')
        .addSelect('product.reg_dttm', 'regDttm')
        .addSelect('file.file_name_first', 'fileNameFirst')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_first)",
          'fileUrlFirst',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_first)",
          'thumbnailFirst',
        )
        .addSelect('file.file_name_second', 'fileNameSecond')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_second)",
          'fileUrlSecond',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_second)",
          'thumbnailSecond',
        )
        .addSelect('file.file_name_third', 'fileNameThird')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_third)",
          'fileUrlThird',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_third)",
          'thumbnailThird',
        )
        .where('product.product_no = :productNo', { productNo });

      productInfo = await sql
        .groupBy(
          `product.product_no, metaverseFirst.metaverse_name, metaverseSecond.metaverse_name,
            metaverseThird.metaverse_name, metaverseFourth.metaverse_name, file.file_name_first, file.file_path_first, file.thumbnail_first,
            file.file_name_second, file.file_path_second, file.thumbnail_second,
            file.file_name_third, file.file_path_third, file.thumbnail_third`,
        )
        .getRawOne();

      // console.log("============ productInfo : "+JSON.stringify(productInfo));

      return productInfo;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 굿즈 정보 조회 (마이페이지)
   *
   * @param user
   * @param productNo
   * @returns
   */
  async getMyInfo(user: User, productNo: number): Promise<any> {
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const userNo = user.userNo;
      const product = await this.productRepository.findOne({
        where: { productNo, userNo },
      });
      if (!product) {
        throw new NotFoundException('Data Not found. : 굿즈');
      }

      let productInfo = {};
      let assetList = {};

      // console.log(" ======== productNo : "+product.productNo);
      const sql = this.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          Metaverse,
          'metaverseFirst',
          'product.ad_target_first = metaverseFirst.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseSecond',
          'product.ad_target_second = metaverseSecond.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseThird',
          'product.ad_target_third = metaverseThird.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseFourth',
          'product.ad_target_fourth = metaverseFourth.metaverse_no',
        )
        .leftJoin(
          AssetType,
          'assetTypeFirst',
          'assetTypeFirst.metaverse_no = product.ad_target_first AND (product.ad_types_first IS NULL OR assetTypeFirst.metaverse_asset_type_no = ANY(product.ad_types_first))',
        )
        .leftJoin(
          AssetType,
          'assetTypeSecond',
          'assetTypeSecond.metaverse_no = product.ad_target_second AND (product.ad_types_second IS NULL OR assetTypeSecond.metaverse_asset_type_no = ANY(product.ad_types_second))',
        )
        .leftJoin(
          AssetType,
          'assetTypeThird',
          'assetTypeThird.metaverse_no = product.ad_target_third AND (product.ad_types_third IS NULL OR assetTypeThird.metaverse_asset_type_no = ANY(product.ad_types_third))',
        )
        .leftJoin(
          AssetType,
          'assetTypeFourth',
          'assetTypeFourth.metaverse_no = product.ad_target_fourth AND (product.ad_types_fourth IS NULL OR assetTypeFourth.metaverse_asset_type_no = ANY(product.ad_types_fourth))',
        )
        .leftJoin(State, 'state', 'state.state = product.state')
        .leftJoin(File, 'file', 'product.file_no = file.file_no')
        .select('product.product_no', 'productNo')
        .addSelect('product.reg_name', 'regName')
        .addSelect('product.reg_addr', 'regAddr')
        .addSelect('product.product_name', 'productName')
        .addSelect('product.ad_target_first', 'adTargetFirst')
        .addSelect('product.ad_target_second', 'adTargetSecond')
        .addSelect('product.ad_target_third', 'adTargetThird')
        .addSelect('product.ad_target_fourth', 'adTargetFourth')
        .addSelect('metaverseFirst.metaverse_name', 'adTargetFirstName')
        .addSelect('metaverseSecond.metaverse_name', 'adTargetSecondName')
        .addSelect('metaverseThird.metaverse_name', 'adTargetThirdName')
        .addSelect('metaverseFourth.metaverse_name', 'adTargetFourthName')
        .addSelect(
          "array_to_string(product.ad_types_first, ', ')",
          'adTypesFirst',
        )
        .addSelect(
          "array_to_string(product.ad_types_second, ', ')",
          'adTypesSecond',
        )
        .addSelect(
          "array_to_string(product.ad_types_third, ', ')",
          'adTypesThird',
        )
        .addSelect(
          "array_to_string(product.ad_types_fourth, ', ')",
          'adTypesFourth',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeFirst.type_def, ', ')",
          'adTypesFirstName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeSecond.type_def, ', ')",
          'adTypesSecondName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeThird.type_def, ', ')",
          'adTypesThirdName',
        )
        .addSelect(
          "string_agg(DISTINCT assetTypeFourth.type_def, ', ')",
          'adTypesFourthName',
        )
        .addSelect('product.product_desc', 'productDesc')
        .addSelect('product.start_dttm', 'startDttm')
        .addSelect('product.end_dttm', 'endDttm')
        .addSelect('product.state', 'state')
        .addSelect('state.state_desc', 'stateDesc')
        .addSelect('product.reg_dttm', 'regDttm')
        .addSelect('file.file_name_first', 'fileNameFirst')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_first)",
          'fileUrlFirst',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_first)",
          'thumbnailFirst',
        )
        .addSelect('file.file_name_second', 'fileNameSecond')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_second)",
          'fileUrlSecond',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_second)",
          'thumbnailSecond',
        )
        .addSelect('file.file_name_third', 'fileNameThird')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_third)",
          'fileUrlThird',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_third)",
          'thumbnailThird',
        )
        .where('product.product_no = :productNo', { productNo });

      productInfo = await sql
        .groupBy(
          `product.product_no, metaverseFirst.metaverse_name, metaverseSecond.metaverse_name,
            metaverseThird.metaverse_name, metaverseFourth.metaverse_name, state.state_desc, file.file_name_first, file.file_path_first, file.thumbnail_first,
             file.file_name_second, file.file_path_second, file.thumbnail_second,
             file.file_name_third, file.file_path_third, file.thumbnail_third`,
        )
        .getRawOne();

      // console.log("============ productInfo : "+JSON.stringify(productInfo));

      const sql1 = this.contractRepository
        .createQueryBuilder('contract')
        .leftJoin(Asset, 'asset', 'contract.asset_no = asset.asset_no')
        .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
        .select('contract.contract_no', 'contractNo')
        .addSelect('asset.reg_name', 'regName')
        .addSelect('asset.asset_name', 'assetName')
        .addSelect('fileAsset.file_name_first', 'fileNameFirst')
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.file_path_first)",
          'fileUrlFirst',
        )
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.thumbnail_first)",
          'thumbnailFirst',
        )
        .addSelect('fileAsset.file_name_second', 'fileNameSecond')
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.file_path_second)",
          'fileUrlSecond',
        )
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.thumbnail_second)",
          'thumbnailSecond',
        )
        .addSelect('fileAsset.file_name_third', 'fileNameThird')
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.file_path_third)",
          'fileUrlThird',
        )
        .addSelect(
          "concat('" + serverDomain + "/', fileAsset.thumbnail_third)",
          'thumbnailThird',
        )
        .where('contract.product_no = :productNo', { productNo });

      assetList = await sql1
        .orderBy('contract.contract_no', 'DESC')
        .groupBy(
          `contract.contract_no, asset.reg_name, asset.asset_name, fileAsset.file_no`,
        )
        .getRawMany();

      // console.log("============ list : "+JSON.stringify(assetList));

      return { productInfo, assetList };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 굿즈 목록 조회
   *
   * @param getProductDto
   * @returns
   */
  async getProductList(getProductDto: GetProductDto): Promise<any> {
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getProductDto.getOffset();
    const take = getProductDto.getLimit();
    const advertiser = getProductDto.advertiser;
    const adTarget = getProductDto.adTarget;
    const state = getProductDto.state;
    const startDttm = getProductDto.startDttm;
    const endDttm = getProductDto.endDttm;
    const word = getProductDto.word;

    let options = `product.use_yn='Y'`;
    if (advertiser) {
      options += ` and product.reg_name like '%${advertiser}%'`;
    }
    if (adTarget == 1) {
      options += ` and product.ad_target_first = 1`;
    } else if (adTarget == 2) {
      options += ` and product.ad_target_second = 2`;
    } else if (adTarget == 3) {
      options += ` and product.ad_target_third = 3`;
    }

    if (startDttm) {
      if (endDttm) {
        const endDttm = new Date(getProductDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and product.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and product.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      } else {
        options += ` and product.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    } else {
      if (endDttm) {
        const endDttm = new Date(getProductDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and product.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    if (state) {
      options += ` and product.state = '${state}'`;
    } else {
      options += ` and product.state='N2'`;
    }

    if (word) {
      // options += ` and product.product_desc like '%${word}%'`;
      options += ` and (product.product_name like '%${word}%' or product.product_desc like '%${word}%') `;
    }

    // console.log("options : "+options);

    try {
      const sql = this.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          Metaverse,
          'metaverseFirst',
          'product.ad_target_first = metaverseFirst.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseSecond',
          'product.ad_target_second = metaverseSecond.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseThird',
          'product.ad_target_third = metaverseThird.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseFourth',
          'product.ad_target_fourth = metaverseFourth.metaverse_no',
        )
        .leftJoin(State, 'state', 'state.state = product.state')
        .leftJoin(File, 'file', 'product.file_no = file.file_no')
        .select('product.product_no', 'productNo')
        .addSelect('product.product_name', 'productName')
        .addSelect('product.product_desc', 'productDesc')
        .addSelect('product.reg_name', 'regName')
        .addSelect('product.ad_target_first', 'adTargetFirst')
        .addSelect('product.ad_target_second', 'adTargetSecond')
        .addSelect('product.ad_target_third', 'adTargetThird')
        .addSelect('product.ad_target_fourth', 'adTargetFourth')
        .addSelect('metaverseFirst.metaverse_name', 'adTargetFirstName')
        .addSelect('metaverseSecond.metaverse_name', 'adTargetSecondName')
        .addSelect('metaverseThird.metaverse_name', 'adTargetThirdName')
        .addSelect('metaverseFourth.metaverse_name', 'adTargetFourthName')
        .addSelect('product.state', 'state')
        .addSelect('state.state_desc', 'stateDesc')
        .addSelect('product.start_dttm', 'startDttm')
        .addSelect('product.end_dttm', 'endDttm')
        .addSelect('file.file_name_first', 'fileNameFirst')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_first)",
          'fileUrlFirst',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_first)",
          'thumbnailFirst',
        )
        .addSelect('file.file_name_second', 'fileNameSecond')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_second)",
          'fileUrlSecond',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_second)",
          'thumbnailSecond',
        )
        .addSelect('file.file_name_third', 'fileNameThird')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_third)",
          'fileUrlThird',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_third)",
          'thumbnailThird',
        )
        .where(options);

      const list = await sql
        .orderBy(
          'product.product_no',
          getProductDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC',
        )
        .offset(skip)
        .limit(take)
        .groupBy(
          `product.product_no, metaverseFirst.metaverse_name, metaverseSecond.metaverse_name, metaverseThird.metaverse_name, metaverseFourth.metaverse_name, state.state_desc, file.file_no`,
        )
        .getRawMany();

      const totalCount = await sql.getCount();

      return new PageResponse(totalCount, getProductDto.pageSize, list);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 굿즈 목록 조회 (마이페이지)
   *
   * @param user
   * @param getProductDto
   * @returns
   */
  async getProductMyList(
    user: User,
    getProductDto: GetProductDto,
  ): Promise<any> {
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getProductDto.getOffset();
    const take = getProductDto.getLimit();
    const advertiser = getProductDto.advertiser;
    const adTarget = getProductDto.adTarget;
    const state = getProductDto.state;
    const startDttm = getProductDto.startDttm;
    const endDttm = getProductDto.endDttm;
    const word = getProductDto.word;
    const userNo = user.userNo;

    let options = `1 =1`;
    if (advertiser) {
      options += ` and product.reg_name like '%${advertiser}%'`;
    }
    if (adTarget == 1) {
      options += ` and product.ad_target_first = 1`;
    } else if (adTarget == 2) {
      options += ` and product.ad_target_second = 2`;
    } else if (adTarget == 3) {
      options += ` and product.ad_target_third = 3`;
    }

    if (startDttm) {
      if (endDttm) {
        const endDttm = new Date(getProductDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and product.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and product.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      } else {
        options += ` and product.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    } else {
      if (endDttm) {
        const endDttm = new Date(getProductDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and product.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    if (state) {
      options += ` and product.state = '${state}'`;
    }
    if (word) {
      // options += ` and product.product_desc like '%${word}%'`;
      options += ` and (product.product_name like '%${word}%' or product.product_desc like '%${word}%') `;
    }

    // console.log("options : "+options);

    try {
      const sql = this.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          Metaverse,
          'metaverseFirst',
          'product.ad_target_first = metaverseFirst.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseSecond',
          'product.ad_target_second = metaverseSecond.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseThird',
          'product.ad_target_third = metaverseThird.metaverse_no',
        )
        .leftJoin(
          Metaverse,
          'metaverseFourth',
          'product.ad_target_fourth = metaverseFourth.metaverse_no',
        )
        .leftJoin(State, 'state', 'state.state = product.state')
        .leftJoin(File, 'file', 'product.file_no = file.file_no')
        .select('product.product_no', 'productNo')
        .addSelect('product.product_name', 'productName')
        .addSelect('product.product_desc', 'productDesc')
        .addSelect('product.reg_name', 'regName')
        .addSelect('product.ad_target_first', 'adTargetFirst')
        .addSelect('product.ad_target_second', 'adTargetSecond')
        .addSelect('product.ad_target_third', 'adTargetThird')
        .addSelect('product.ad_target_fourth', 'adTargetFourth')
        .addSelect('metaverseFirst.metaverse_name', 'adTargetFirstName')
        .addSelect('metaverseSecond.metaverse_name', 'adTargetSecondName')
        .addSelect('metaverseThird.metaverse_name', 'adTargetThirdName')
        .addSelect('metaverseFourth.metaverse_name', 'adTargetFourthName')
        .addSelect('product.state', 'state')
        .addSelect('state.state_desc', 'stateDesc')
        .addSelect('product.start_dttm', 'startDttm')
        .addSelect('product.end_dttm', 'endDttm')
        .addSelect('file.file_name_first', 'fileNameFirst')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_first)",
          'fileUrlFirst',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_first)",
          'thumbnailFirst',
        )
        .addSelect('file.file_name_second', 'fileNameSecond')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_second)",
          'fileUrlSecond',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_second)",
          'thumbnailSecond',
        )
        .addSelect('file.file_name_third', 'fileNameThird')
        .addSelect(
          "concat('" + serverDomain + "/', file.file_path_third)",
          'fileUrlThird',
        )
        .addSelect(
          "concat('" + serverDomain + "/', file.thumbnail_third)",
          'thumbnailThird',
        )
        .where(options);

      sql.andWhere('product.user_no = :userNo', { userNo });

      const list = await sql
        .orderBy(
          'product.product_no',
          getProductDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC',
        )
        .offset(skip)
        .limit(take)
        .groupBy(
          `product.product_no, metaverseFirst.metaverse_name, metaverseSecond.metaverse_name,
                                   metaverseThird.metaverse_name, metaverseFourth.metaverse_name, state.state_desc, file.file_no`,
        )
        .getRawMany();

      const totalCount = await sql.getCount();

      return new PageResponse(totalCount, getProductDto.pageSize, list);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
  
}

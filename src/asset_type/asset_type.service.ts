import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { AssetType } from '../entities/asset_type.entity';
import { User } from '../entities/user.entity';
import { CreateAssetTypeDto } from '../dtos/create_asset_type.dto';
import { ModifyAssetTypeDto } from '../dtos/modify_asset_type.dto';
import { GetAssetTypeDto } from '../dtos/get_asset_type.dto';
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class AssetTypeService {
  private logger = new Logger('AssetTypeService');

  constructor(
    @Inject('ASSET_TYPE_REPOSITORY')
    private assetTypeRepository: Repository<AssetType>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
   * 에셋 타입 등록
   * 
   * @param user 
   * @param createAssetTypeDto 
   */
  async create(user: User, createAssetTypeDto: CreateAssetTypeDto): Promise<void> {
    try {
      // 에셋타입이 있는지 체크.
      const metaverseNo = createAssetTypeDto.metaverseNo;
      const typeDef = createAssetTypeDto.typeDef;
      const typeInfo = await this.assetTypeRepository.findOne({ where:{metaverseNo, typeDef} });
      if (typeInfo) {
        if(typeInfo.useYn == 'Y') {
          throw new ConflictException('Aready registered MetaverseName & TypeDefinition.');
        }else{
          this.reuse(typeInfo.typeNo);
        }
      }else{
        const typeInfo1 = await this.assetTypeRepository.findOne({ where:{metaverseNo}, order:{typeNo: 'DESC',}, });
        const newMetaverseAssetTypeNo = typeInfo1 ? typeInfo1.metaverseAssetTypeNo + 1 : 1;
        const newType = this.assetTypeRepository.create(createAssetTypeDto);
        newType.metaverseAssetTypeNo = newMetaverseAssetTypeNo;
        // console.log("newType : " + JSON.stringify(newType));
        await this.assetTypeRepository.save(newType);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 타입 수정
   * 
   * @param user 
   * @param typeNo 
   * @param modifyAssetTypeDto 
   */
  async update(user: User, typeNo: number, modifyAssetTypeDto: ModifyAssetTypeDto): Promise<void> {
    try {
      const typeInfo = await this.assetTypeRepository.findOne({ where:{typeNo} });
      if (!typeInfo) {
        throw new NotFoundException("Data Not found.");
      }

      await this.assetTypeRepository.update(typeNo, modifyAssetTypeDto)

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 타입 삭제
   * 
   * @param user 
   * @param typeNo 
   */
  async delete(user: User, typeNo: number): Promise<void> {
    try {
      const typeInfo = await this.assetTypeRepository.findOne({ where:{typeNo} });
      if (!typeInfo) {
        throw new NotFoundException("Data Not found.");
      }

      let data = { useYn: 'N' }
      await this.assetTypeRepository.update(typeNo, data);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 에셋 타입 재사용
   * 
   * @param typeNo 
   */
    async reuse(typeNo: number): Promise<void> {
      try {
        let data = { useYn: 'Y' }
        await this.assetTypeRepository.update(typeNo, data);
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

  /**
   * 에셋 타입 목록 조회
   * 
   * @param user 
   * @param getAssetTypeDto 
   * @returns 
   */
  async getAssetTypeList(user: User, getAssetTypeDto: GetAssetTypeDto): Promise<any> {

    const skip = getAssetTypeDto.getOffset();
    const take = getAssetTypeDto.getLimit();
    const metaverseNo = getAssetTypeDto.metaverseNo;
    const typeDef = getAssetTypeDto.typeDef;
    const word = getAssetTypeDto.word;

    let options = `use_yn='Y'`;
    if (metaverseNo) {
      options += `and metaverse_no = ${metaverseNo}`;
    }
    if (typeDef) {
      options += `and type_def like '%${typeDef}%'`;
    }
    if (word) {
        options += `and asset_type_desc like '%${word}%'`;
    }
    
    try {
      // console.log("=========== options : "+options);     
      const sql = this.assetTypeRepository.createQueryBuilder()
                            .select('type_no', 'typeNo')
                            .addSelect('metaverse_no', 'metaverseNo')
                            .addSelect('metaverse_asset_type_no', 'metaverseAssetTypeNo')
                            .addSelect('type_def', 'typeDef')
                            .addSelect('asset_type_desc', 'assetTypeDesc')
                            .where(options)

      const list = await sql.orderBy('type_no', getAssetTypeDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getAssetTypeDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
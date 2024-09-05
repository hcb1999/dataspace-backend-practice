import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { Metaverse } from '../entities/metaverse.entity';
import { User } from '../entities/user.entity';
import { MetaverseDto } from '../dtos/metaverse.dto';
import { GetMetaverseDto } from '../dtos/get_metaverse.dto';
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class MetaverseService {
  private logger = new Logger('MetaverseService');

  constructor(
    @Inject('METAVERSE_REPOSITORY')
    private metaverseRepository: Repository<Metaverse>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
   * 메타버스 등록
   * 
   * @param user 
   * @param metaverseDto 
   */
  async create(user: User, metaverseDto: MetaverseDto): Promise<void> {
    try {
      // 메타버스업체명이 있는지 체크.
      const metaverseName = metaverseDto.metaverseName;
      const metaverseInfo = await this.metaverseRepository.findOne({ where:{metaverseName} });
      if (metaverseInfo) {
        if(metaverseInfo.useYn == 'Y') {
          throw new ConflictException('Aready registered MetaverseName.');
        }else{
          this.reuse(metaverseInfo.metaverseNo);
        }
      }else{
        const newMetaverse = this.metaverseRepository.create(metaverseDto);
        await this.metaverseRepository.save(newMetaverse);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 메타버스 수정
   * 
   * @param user 
   * @param metaverseNo 
   * @param metaverseDto 
   */
  async update(user: User, metaverseNo: number, metaverseDto: MetaverseDto): Promise<void> {
    try {
      const metaverseInfo = await this.metaverseRepository.findOne({ where:{metaverseNo} });
      if (!metaverseInfo) {
        throw new NotFoundException("Data Not found.");
      }

      // const metaverseName = metaverseDto.metaverseName;
      // const ret = await this.metaverseRepository.findOne({ where:{metaverseName} });
      // if (ret) {
      //   throw new ConflictException('Aready registed Metaverse Name.');
      // }

      await this.metaverseRepository.update(metaverseNo, metaverseDto)

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 메타버스 정보 삭제
   * 
   * @param user 
   * @param metaverseNo 
   */
  async delete(user: User, metaverseNo: number): Promise<void> {
    try {
      const metaverseInfo = await this.metaverseRepository.findOne({ where:{metaverseNo} });
      if (!metaverseInfo) {
        throw new NotFoundException("Data Not found.");
      }

      let data = { useYn: 'N' }
      await this.metaverseRepository.update(metaverseNo, data);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 메타버스 정보 재사용
   * 
   * @param metaverseNo 
   */
    async reuse(metaverseNo: number): Promise<void> {
      try { 
        let data = { useYn: 'Y' }
        await this.metaverseRepository.update(metaverseNo, data);
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

  /**
   * 메타버스 목록 조회
   * 
   * @param user 
   * @param getMetaverseDto 
   * @returns 
   */
  async getMetaverseList(user: User, getMetaverseDto: GetMetaverseDto): Promise<any> {

    const skip = getMetaverseDto.getOffset();
    const take = getMetaverseDto.getLimit();
    const word = getMetaverseDto.word;

    let options = `use_yn='Y'`;
    if (word) {
        options += `and metaverse_name like '%${word}%'`;
    }
    
    try {
      // console.log("=========== options : "+options);     
      const sql = this.metaverseRepository.createQueryBuilder()
                            .select('metaverse_no', 'metaverseNo')
                            .addSelect('metaverse_name', 'metaverseName')
                            .where(options)

      const list = await sql.orderBy('metaverse_no', getMetaverseDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getMetaverseDto.pageSize, list);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

}
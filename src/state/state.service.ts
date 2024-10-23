import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { State } from '../entities/state.entity';
import { User } from '../entities/user.entity';
import { CreateStateDto } from '../dtos/create_state.dto';
import { ModifyStateDto } from '../dtos/modify_state.dto';
import { GetStateDto } from '../dtos/get_state.dto';
import { PageResponse } from '../common/page.response';

@Injectable()
export class StateService {
  private logger = new Logger('StateService');

  constructor(
    @Inject('STATE_REPOSITORY')
    private stateRepository: Repository<State>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
   * 상태 정보 등록
   * 
   * @param user 
   * @param createStateDto 
   */
  async create(user: User, createStateDto: CreateStateDto): Promise<void> {
    try {
      // 상태 정보 있는지 체크.
      const state = createStateDto.state;
      const stateInfo = await this.stateRepository.findOne({ where:{state} });
      if (stateInfo) {
        if(stateInfo.useYn == 'Y') {
          throw new ConflictException('Aready registered State.');
        }else{
          this.reuse(stateInfo.stateNo);
        }
      }else{
        const newState = this.stateRepository.create(createStateDto);
        await this.stateRepository.save(newState);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 상태 수정
   * 
   * @param user 
   * @param stateNo 
   * @param modifyStateDto 
   */
  async update(user: User, stateNo: number, modifyStateDto: ModifyStateDto): Promise<void> {
    try {
      const stateInfo = await this.stateRepository.findOne({ where:{stateNo} });
      if (!stateInfo) {
        throw new NotFoundException("Data Not found.");
      }

      // const state = modifyStateDto.state;
      // const stateVal = await this.stateRepository.findOne({ where:{state} });
      // if (stateVal) {
      //   throw new ConflictException('Aready registered State.');
      // }

      await this.stateRepository.update(stateNo, modifyStateDto)

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 상태 삭제
   * 
   * @param user 
   * @param stateNo 
   */
  async delete(user: User, stateNo: number): Promise<void> {
    try {
      const stateInfo = await this.stateRepository.findOne({ where:{stateNo} });
      if (!stateInfo) {
        throw new NotFoundException("Data Not found.");
      }

      let data = { useYn: 'N' }
      await this.stateRepository.update(stateNo, data);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 상태 정보 재사용
   * 
   * @param stateNo 
   */
    async reuse(stateNo: number): Promise<void> {
      try {
        let data = { useYn: 'Y' }
        await this.stateRepository.update(stateNo, data);
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

  /**
   * 상태 목록 조회
   * 
   * @param user 
   * @param getStateDto 
   * @returns 
   */
  async getStateList(user: User, getStateDto: GetStateDto): Promise<any> {

    const skip = getStateDto.getOffset();
    const take = getStateDto.getLimit();
    const category = getStateDto.category;
    const state = getStateDto.state;
    const word = getStateDto.word;

    let options = `use_yn='Y'`;
    if (category) {
      options += `and category like '%${category}%'`;
    }
    if (state) {
      options += `and state = '${state}'`;
    }
    if (word) {
        options += `and state_desc like '%${word}%'`;
    }
    
    try {
      // console.log("=========== options : "+options);     
      const sql = this.stateRepository.createQueryBuilder()
                            .select('state_no', 'stateNo')
                            .addSelect('category', 'category')
                            .addSelect('state', 'state')
                            .addSelect('state_desc', 'ststeDesc')
                            .where(options)

      const list = await sql.orderBy('state_no', getStateDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .offset(skip)
                            .limit(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getStateDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
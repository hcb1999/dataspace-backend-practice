import { BadRequestException, ConflictException, Inject, Injectable, Logger, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create_user.dto';
import { ModifyUserDto } from '../dtos/modify_user.dto';
import { UserNickChkDto } from '../dtos/user_nickchk.dto';
import { NftWallet } from "../entities/nft_wallet.entity";
// import { PageResponse } from 'src/common/page.response';
// import { ConfigModule } from '@nestjs/config';
import * as moment from 'moment-timezone';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
     * 닉네임 중복 확인
     *
     * @param nickName
     * @returns true/false
     */
  async nicknameChk(userNickChkDto: UserNickChkDto): Promise<any> {
    try {
      let ret:Boolean;
      const nickName = userNickChkDto.nickName;
      // console.log("======== nickName : "+nickName)
      const userInfo = await this.userRepository.findOne({ where:{nickName} });
      if (!userInfo) {
        ret = false;
      }else{
        ret = true;
      }
    
      return { "dupResult": ret};
      
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 사용자 정보 수정
   *
   * @param user
   * @param modifyUserDto
   */
  async update(user: User, modifyUserDto: ModifyUserDto): Promise<void> {
    try {
      const userNo = user.userNo;
      const userInfo = await this.userRepository.findOne({ where:{userNo} });
      if (!userInfo) {
        throw new NotFoundException("Data Not found.");
      }

      const modifyNickName = modifyUserDto.nickName;
      if(modifyNickName) {
        //  console.log("YES NickName");
        let userNickChkInfo = {"nickName": modifyNickName};
        if(user.nickName != modifyNickName ){
          const ret = await this.nicknameChk(userNickChkInfo)
          // console.log("=========  ret "+JSON.stringify(ret));
          if(ret.dupResult == false){
            await this.userRepository.update(userNo, modifyUserDto);
            // console.log("수정");
          }else{
              throw new ConflictException('Aready registered Nickname.');
          }
        } 
      }else{
        // console.log("NO NickName");
        await this.userRepository.update(userNo, modifyUserDto);
      }
  
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 사용자 정보 조회
   *
   * @param user
   * @returns
   */
  async getInfo(user: User): Promise<User> {
    try {
      const userNo = user.userNo;
      const userInfo = await this.userRepository.findOne({ where:{userNo} });
      if (!userInfo) {
        throw new NotFoundException("Data Not found.");
      }

      userInfo['addr'] = user.nftWalletAddr;
      
      return userInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

/**
 * 사용자 정보 삭제
 * 
 * @param user 
 */
  async delete(user: User): Promise<void> {
    try {
      const userNo = user.userNo;
      const userInfo = await this.userRepository.findOne({ where:{userNo} });
      if (!userInfo) {
        throw new NotFoundException("Data Not found.");
      }

      if (userInfo.userNo !== userNo) {
        throw new UnauthorizedException("Unauthorized User.");
      }

      let data = { useYn: 'N' }
      await this.userRepository.update(userNo, data);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getOne(userNo: number): Promise<User> {
    try {
        const ret = await this.userRepository.findOne({ where:{userNo, useYn: 'Y'} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getOneByNickname(nickName: string): Promise<User> {
    try {
        const ret = await this.userRepository.findOne({ where:{nickName} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getOneByAddress(addr: string): Promise<NftWallet> {
    try {
        const ret = await this.nftWalletRepository.findOne({ where:{addr} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 사용자 등록
   * 
   * @param createUserDto 
   * @returns 
   */
  async create(createUserDto: CreateUserDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // const walletAddress = createUserDto.addr;
      const walletAddress = createUserDto.addr.toLowerCase();
      const wallet = await this.nftWalletRepository.findOne({ where:{addr: walletAddress} });
      if (wallet) {
        throw new ConflictException('Aready registered Address.');
      }

      const nickName = createUserDto.nickName;
      if(nickName != null) {
        const user = await this.userRepository.findOne({ where:{nickName} });
        if (user) {
          throw new ConflictException('Aready registered Nickname.');
        }
      }else{
        // console.log("nickname is null")
      }

      // User 저장
      const newUser = queryRunner.manager.create(User, createUserDto);
      const regUser = await queryRunner.manager.save<User>(newUser);
      const userNo = regUser.userNo;
      // const addr = createUserDto.addr;

      // NftWallet 저장
      let nftWalletInfo = {userNo, addr: walletAddress};
      // console.log("nftWalletInfo : "+JSON.stringify(nftWalletInfo));
      const newNftWallet = queryRunner.manager.create(NftWallet, nftWalletInfo);
      await queryRunner.manager.save<NftWallet>(newNftWallet);

      await queryRunner.commitTransaction();

      return regUser;

    } catch (e) {
      this.logger.error(e);
    }finally {
      await queryRunner.release();
    }
  }  
}

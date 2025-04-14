import { BadRequestException, ConflictException, Inject, Injectable, Logger, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create_user.dto';
import { ModifyUserDto } from '../dtos/modify_user.dto';
import { UserNickChkDto } from '../dtos/user_nickchk.dto';
import { NftWallet } from "../entities/nft_wallet.entity";
import { DidWallet } from "../entities/did_wallet.entity";
import { ethers } from "ethers";
import { DidService } from '../did/did.service';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidWalletDto } from '../dtos/create_did_wallet.dto';
// import { PageResponse } from 'src/common/page.response';
// import { ConfigModule } from '@nestjs/config';
import * as moment from 'moment-timezone';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

  constructor(
    private didService: DidService,

    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    @Inject('DID_WALLET_REPOSITORY')
    private didWalletRepository: Repository<DidWallet>,

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
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const userNo = user.userNo;
      const userInfo = await this.userRepository.findOne({ where:{userNo} });
      if (!userInfo) {
        throw new NotFoundException("Data Not found.");
      }

      const modifyNickName = modifyUserDto.nickName;
      // if(modifyNickName) {
      //   //  console.log("YES NickName");
      //   let userNickChkInfo = {"nickName": modifyNickName};
      //   if(user.nickName != modifyNickName ){
      //     const ret = await this.nicknameChk(userNickChkInfo)
      //     // console.log("=========  ret "+JSON.stringify(ret));
      //     if(ret.dupResult == false){
      //       await this.userRepository.update(userNo, modifyUserDto);
      //       // console.log("수정");
      //     }else{
      //         throw new ConflictException('Aready registered Nickname.');
      //     }
      //   } 
      // }else{
      //   // console.log("NO NickName");
      //   await this.userRepository.update(userNo, modifyUserDto);
      // }

      if(modifyNickName) {
        //  console.log("YES NickName");
        let userNickChkInfo = {"nickName": modifyNickName};
        if(user.nickName != modifyNickName ){
          const ret = await this.nicknameChk(userNickChkInfo)
          // console.log("=========  ret "+JSON.stringify(ret));
          if(ret.dupResult) {
              throw new ConflictException('Aready registered Nickname.');
          }
        } 
      }

      await this.userRepository.update(userNo, modifyUserDto);

      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
    }finally {
      await queryRunner.release();
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

      userInfo['account'] = user.nftWalletAccount;
      userInfo['privateKey'] = user.nftWalletAccountPKey;
      userInfo['accountUrl'] = process.env.BC_EXPLORER+"accounts/"+user.nftWalletAccount;
      
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

  async getOneByAccount(account: string): Promise<NftWallet> {
    try {
        const ret = await this.nftWalletRepository.findOne({ where:{account} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getOneByEmail(email: string): Promise<User> {
    try {
        const ret = await this.userRepository.findOne({ where:{email} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getWalletAddress(userNo: number): Promise<NftWallet> {
    try {
        const ret = await this.nftWalletRepository.findOne({ where:{userNo} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getDidWallet(userNo: number): Promise<DidWallet> {
    try {
        const ret = await this.didWalletRepository.findOne({ where:{userNo} });

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

      const wallet = ethers.Wallet.createRandom();
      const account = wallet.address.toLowerCase();
      const pkey =  wallet.privateKey;

      // 계정 생성 및 계정 중복 체크 
      const walletInfo = await this.nftWalletRepository.findOne({ where:{account} });
      if (walletInfo) {
        throw new ConflictException('Aready registered Account.');
      }

      const email = createUserDto.email;
      if(email != null) {
        const user = await this.userRepository.findOne({ where:{email} });
        if (user) {
          throw new ConflictException('Aready registered email.');
        }
      }else{
        // console.log("email is null")
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
      // const account = createUserDto.account;

      // NftWallet 저장
      let nftWalletInfo = {userNo, account, pkey};
      // console.log("nftWalletInfo : "+JSON.stringify(nftWalletInfo));
      const newNftWallet = queryRunner.manager.create(NftWallet, nftWalletInfo);
      await queryRunner.manager.save<NftWallet>(newNftWallet);
      
      // // faucet userNo 찾기
      // const faucetEmail =  this.configService.get<string>('FAUCET_EMAIL');
      // const faucetAmount =  this.configService.get<number>('FAUCET_AMOUNT');
      // const faucetInfo = await this.userRepository.findOne({ where:{email: faucetEmail } });
      // if (!faucetInfo) {
      //   throw new NotFoundException("Data Not found. : faucet email");
      // }

      // // nftService.transferEth 호출      
      // const nftInfo = { userNo: faucetInfo.userNo, faucetAmount, toAddr: addr };
      // // console.log("===== nftInfo : "+ JSON.stringify(nftInfo)); 
      // this.nftService.transferEth(nftInfo);

      // ETRI API 호출
      // 1. 사용자 연결 인증 요청
      const createDidUserDto: CreateDidUserDto = {id: email, userNo: userNo};
      const userJwt = await this.didService.createUser(createDidUserDto);
      if (!userJwt) {      
        throw new NotFoundException('DID 등록 오류 - jwt');
      }
      console.log("userJwt: "+JSON.stringify(userJwt))

      // 2. 아바타 가상자갑 생성 요청
      const createDidWalletDto: CreateDidWalletDto = {nickName, imageUrl: '', id: email, jwt: userJwt.jwt};
      const userDid = await this.didService.createWallet(createDidWalletDto);
      if (!userDid) {
        throw new NotFoundException('DID 등록 오류 - did');
      }
      console.log("userDid: "+JSON.stringify(userDid))

      // DidWallet 저장
      let didWalletInfo = {userNo, jwt: userJwt.jwt, walletDid: userDid.did};
      // console.log("didWalletInfo : "+JSON.stringify(didWalletInfo));
      const newDidWallet = queryRunner.manager.create(DidWallet, didWalletInfo);
      await queryRunner.manager.save<DidWallet>(newDidWallet);

      await queryRunner.commitTransaction();

      return regUser;

    } catch (e) {
      await queryRunner.rollbackTransaction ();    
      // console.log("111111111111111111");      
      // console.log(e.message);      
      this.logger.error(e.message);
      if (e.message.includes('Aready registered Account.')) {
        throw new ConflictException('Aready registered Account.');
      } else if (e.message.includes('Aready registered email.')) {
        throw new ConflictException('Aready registered email.');
      } else if (e.message.includes('Aready registered Nickname.')) {
        throw new ConflictException('Aready registered Nickname.');
      } else if (e.message.includes('Data Not found. : faucet email')) {
        throw new NotFoundException('Data Not found. : faucet email');
      } else {
        throw new InternalServerErrorException(e.message);
      }
      
    }finally {
      await queryRunner.release();
    }
  }  
}

import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { NftService } from '../nft/nft.service';
import { DidService } from '../did/did.service';
import { GetUserDto } from '../dtos/get_user.dto';
import { GetDidUserDto } from '../dtos/get_did_user.dto';
import { CreateUserDto } from '../dtos/create_user.dto';
import { User } from '../entities/user.entity';
import { NftWallet } from "../entities/nft_wallet.entity";
import { PageResponse } from '../common/page.response';
import { GetUserNicknameDto } from '../dtos/get_user_nickname.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private nftService: NftService,
    private didService: DidService,
  ) { }

  /**
   * 사용자 검증
   * 
   * @param userNo 
   * @returns 
   */
  async validateUser(userNo: number): Promise<User> {
    const user = await this.userService.getOne(userNo);
    if (!user) {
      return null;
    }

    const nftWalletInfo = await this.nftService.getOne(userNo);
    // console.log('nftWalletInfo == ', nftWalletInfo);
    if (nftWalletInfo) {
      // user.nftWalletId = nftWalletInfo.walletId;
      user.nftWalletAccount = nftWalletInfo.account;
      user.nftWalletAccountPKey = nftWalletInfo.pkey;
    }

    return user;
  }

  /**
   * 사용자 등록 조회 및 등록된 사용자에게 accessToken 재발행
   * 
   * @param getUserDto
   * @returns 
   */
  async getAccessToken(getUserDto: GetUserDto): Promise<any> {

    try {
      // const addr = getUserDto.addr.toLowerCase();
      // // console.log("addr : "+addr);
      // const userWalletInfo = await this.nftService.getOneByAddress(addr);
      // if (!userWalletInfo) {
      //   throw new NotFoundException("Address not found.");
      // }

      const email = getUserDto.email;
      const userInfo = await this.userService.getOneByEmail(email);
      if (!userInfo) {
        throw new NotFoundException('User(email) not found.');
      }
      const userDidInfo = await this.userService.getDidWallet(userInfo.userNo);
      if (!userDidInfo) {
        throw new NotFoundException('UserDid(email) not found.');
      }

      // Authledger 사용자 DID verify 요청
      // for TEST
      const getDidUserDto: GetDidUserDto = {walletDid: userDidInfo.walletDid};
      const user = await this.didService.verifyUser(getDidUserDto);
      if (!user) {      
        throw new NotFoundException('사용자 DID verify 요청 오류');
      }
      
      console.log("verified user: "+JSON.stringify(user))      

      // 토큰생성
      // const payload = { userNo };
      const payload = { userNo: userInfo.userNo };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  
  /**
   * 사용자 등록 조회 및 등록된 사용자에게 accessToken 재발행
   * 
   * @param getUserDto
   * @returns 
   */
  async getNicknameAccessToken(getUserNicknameDto: GetUserNicknameDto): Promise<any> {

    try {
      const nickName = getUserNicknameDto.nickName;
      const userInfo = await this.userService.getOneByNickname(nickName);
      if (!userInfo) {
        throw new NotFoundException('User(nickName) not found.');
      }

    const userDidInfo = await this.userService.getDidWallet(userInfo.userNo);
      if (!userDidInfo) {
        throw new NotFoundException('UserDid(email) not found.');
      }

      // Authledger 사용자 DID verify 요청
      // for TEST
      const getDidUserDto: GetDidUserDto = {walletDid: userDidInfo.walletDid};
      const user = await this.didService.verifyUser(getDidUserDto);
      if (!user) {      
        throw new NotFoundException('사용자 DID verify 요청 오류');
      }
      
      console.log("verified user: "+JSON.stringify(user))      

      const payload = { userNo: userInfo.userNo };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 사용자 등록 조회 및 등록된 사용자에게 accessToken 재발행
   * 
   * @param getUserDto
   * @returns 
   */
  // async getBioAccessToken(getUserDto: GetUserDto): Promise<any> {

  //   try {
  //     const email = getUserDto.email;
  //     const userInfo = await this.userService.getOneByEmail(email);
  //     if (!userInfo) {
  //       throw new NotFoundException('User(email) not found.');
  //     }

  //     // DID 로긴 호출
  //     const newJwt = await this.didService.createUser({ id: getUserDto.email, userNo: userInfo.userNo });
  //     if(newJwt.jwt){
  //       // 토큰생성
  //       // const payload = { userNo };
  //       const payload = { userNo: userInfo.userNo };
  //       const accessToken = this.jwtService.sign(payload);

  //       return { accessToken };
  //     }else{
  //       return null
  //     }
  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   }
  // }

  /**
   * 사용자 등록
   * 
   * @param createUserDto 
   * @returns 
   */
  async register(createUserDto: CreateUserDto): Promise<any> {
    // const userInfo = await this.userService.create(createUserDto);

    try {
      // const account = createUserDto.account;
      const nickName = createUserDto.nickName;
      const email = createUserDto.email;
      const nickUser = await this.userService.getOneByNickname(nickName);
      if(nickUser != null) {
          throw new ConflictException('Aready registered Nickname.');
      }
      const emailUser = await this.userService.getOneByEmail(email);
      if(emailUser != null) {
          throw new ConflictException('Aready registered Email.');
      }

      const userInfo = await this.userService.create(createUserDto);
      if (userInfo) {
        let userNo = userInfo.userNo;
        // 토큰생성
        const payload = { userNo };
        const accessToken = this.jwtService.sign(payload);
        
        return { accessToken };
      }

    } catch (e) {
      this.logger.error(e);
      // throw new ConflictException(e.message);
      throw e;
      // 예외 메시지 추출
      // if (e instanceof ConflictException) {
      //   console.log('ConflictException');
      //   throw new ConflictException(e.message);
      // } else {
      //   console.log('Internal');
      //   throw new InternalServerErrorException('internal Server Error');
      // }
    }
     
  }

}

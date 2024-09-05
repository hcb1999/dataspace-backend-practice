import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { NftService } from '../nft/nft.service';
import { GetUserDto } from '../dtos/get_user.dto';
import { CreateUserDto } from '../dtos/create_user.dto';
import { User } from '../entities/user.entity';
import { NftWallet } from "../entities/nft_wallet.entity";
import { PageResponse } from '../common/page.response';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private nftService: NftService,
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
      user.nftWalletAddr = nftWalletInfo.addr;
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
      const userWalletInfo = await this.nftService.getOneByAddress(getUserDto.addr);
      if (!userWalletInfo) {
        throw new NotFoundException("Address not found.");
      }

      let userNo = userWalletInfo.userNo;
      const userInfo = await this.userService.getOne(userNo);
      if (!userInfo) {
        throw new NotFoundException("User not found.");
      }

      // 토큰생성
      const payload = { userNo };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };

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
  async register(createUserDto: CreateUserDto): Promise<any> {

    try {
      const addr = createUserDto.addr;
      const nickName = createUserDto.nickName;
      const wallet = await this.userService.getOneByAddress(addr);
      if (wallet) {
        throw new ConflictException('Aready registered Address.');
      }
      const nickUser = await this.userService.getOneByNickname(nickName);
      if(nickUser != null) {
          throw new ConflictException('Aready registered Nickname.');
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

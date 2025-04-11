import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidWalletDto } from '../dtos/create_did_wallet.dto';
import { CreateDidAcdgDto } from '../dtos/create_did_acdg.dto';
import { CreateDidAciDto } from '../dtos/create_did_aci.dto';
import { CreateDidAcrDto } from '../dtos/create_did_acr.dto';
import { GetDidAcmDto } from '../dtos/get_did_acm.dto';
import { GetDidAcdDto } from '../dtos/get_did_acd.dto';
import { DidWallet } from '../entities/did_wallet.entity';
import { User } from "../entities/user.entity";
import { createVC, parseVC } from 'src/common/vc-utils';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class DidService {
  private logger = new Logger('DidService');

  constructor(
    private configService: ConfigService,

    @Inject('DID_WALLET_REPOSITORY')
    private didWalletRepository: Repository<DidWallet>,

    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
   * 사용자 연결인증
   * 
   * @param createDidUserDto
   * @returns 
   */
  async createUser(createDidUserDto: CreateDidUserDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const serviceDomain = this.configService.get<string>('SERVICE_DOMAIN');
      const url = this.configService.get<string>('DID_USER_URL');
      const data = {
        operation: "UserConnectingAuthentication",
        id: createDidUserDto.id,
        authType: "FACE",
        serviceId: serviceDomain
      };
      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));

      try {
        const response = await axios.post(url, data, {
          headers: { "Content-Type": "application/json" },
        });
        // const response = await axios({
        //   method: 'post',
        //   url,
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   data: JSON.stringify({
        //     operation: 'UserConnectingAuthentication',
        //     id: 'aroseller@authrium.com',
        //   }),
        // });
        console.log("response.data: "+JSON.stringify(response.data));
        if(response.data){
          if(response.data.result == 'Success'){
            // did_wallet_update 저장 필요 
            const user = await this.userRepository.findOne({ where: { email: createDidUserDto.id } });

            await this.didWalletRepository.update({ userNo: user.userNo }, { jwt: response.data.jwt });

            return {jwt: response.data.jwt};
          }
        }else {
          console.error("POST(createUser) ERROR: "+response.data.failureReason);
          return null;
        }
      } catch (error) {
        if(error.response.data.failureReason == 'FAILURE_REASON_NO_REGISTRATION'){
          console.error("웹지갑에 등록되지 않은 사용자입니다.");
          // error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
          error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
        }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
          console.error("유효하지 않은 바이오 인증입니다.");
          error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
        }
  
        // console.log("failureReason: "+failureReason);
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: error.response.data.failureReason,
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 아바타 가상지갑 생성
   * 
   * @param createDidWalletDto 
   * @returns 
   */
  async createWallet(createDidWalletDto: CreateDidWalletDto, retryCount = 0): Promise<any> {
    if (retryCount > 1) {
      throw new InternalServerErrorException('JWT 재발급 후에도 실패했습니다.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serviceDomain = this.configService.get<string>('SERVICE_DOMAIN');
      const server = this.configService.get<string>('SERVER_DOMAIN');
      const url = this.configService.get<string>('DID_WALLET_URL');
      const data = {
        operation: 'AvatarVirtualWalletCreate',
        serviceId: serviceDomain,
        serviceName: 'AvataroAD',
        serviceImageUrl: server+'/k_top_logo.png',
        avatarName: createDidWalletDto.nickName,
        avatarImageUrl: createDidWalletDto.imageUrl,
        id: createDidWalletDto.id,
        jwt: createDidWalletDto.jwt,
      };
      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));

      try {
        const response = await axios.post(url, data, {
          headers: { "Content-Type": "application/json" },
        });
        if(response.data){
          if(response.data.result == 'Success')
            return {did: response.data.did};
        }else {
          console.error("POST(createWallet) ERROR: "+response.data.failureReason);
          return null;
        }
      } catch (error) {
        if(error.response.data.failureReason == 'FAILURE_REASEON_NO_REGISTRATION'){
          console.error("웹지갑에 등록되지 않은 사용자입니다.");
          error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
        }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
          console.error("유효하지 않은 바이오 인증입니다.");
          error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
        }else{
          // console.error('응답 데이터:', JSON.stringify(error.response.data.failureMessage));
      //  if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException')) {
          if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException') || error.response.data.failureMessage == 'JWT token is expired') {
            console.error("토큰이 만료 되었습니다.");
            const newJwt = await this.createUser({ id: createDidWalletDto.id });
            createDidWalletDto.jwt = newJwt.jwt;
              return await this.createWallet(createDidWalletDto, retryCount + 1);                       
          }
        }
  
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: error.response.data.failureReason,
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }

  }

  /**
   * 아바타 크리덴셜 DID 생성
   * 
   * @param createDidAcdgDto
   * @returns 
   */
  async createAcdg(createDidAcdgDto: CreateDidAcdgDto, retryCount = 0): Promise<any> {
    if (retryCount > 1) {
      throw new InternalServerErrorException('JWT 재발급 후에도 실패했습니다.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const url = this.configService.get<string>('DID_ACDG_URL');
      const data = {
        operation: 'AvatarCredentialDidGen',
        jwt: createDidAcdgDto.jwt,
        did: createDidAcdgDto.did,
      };
      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));

      try {
        const response = await axios.post(url, data, {
          headers: { "Content-Type": "application/json" },
        });
        if(response.data){
          if(response.data.result == 'Success')
            return {did: response.data.did};
        }else {
          console.error("POST(createAcdg) ERROR: "+response.data.failureReason);
          return null;
        }
      } catch (error) {
        console.error("error : "+JSON.stringify(error));
        if(error.response.data.failureReason == 'FAILURE_REASEON_NO_REGISTRATION'){
          console.error("웹지갑에 등록되지 않은 사용자입니다.");
          error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
        }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
          console.error("유효하지 않은 바이오 인증입니다.");
          error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
        }else{
          // console.error('응답 데이터:', JSON.stringify(error.response.data.failureMessage));
          if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException') || error.response.data.failureMessage == 'JWT token is expired') {
            console.error("토큰이 만료 되었습니다.");
            const newJwt = await this.createUser({ id: createDidAcdgDto.id });
            createDidAcdgDto.jwt = newJwt.jwt;
            return await this.createAcdg(createDidAcdgDto, retryCount + 1);                       
          }
        }
  
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: error.response.data.failureReason,
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 아바타 크리덴셜 발급
   * 
   * @param createDidAciDto 
   * @returns 
   */
  async createAci(createDidAciDto: CreateDidAciDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const url = this.configService.get<string>('DID_ACI_URL');
       const data = {
        operation: 'AvatarCredentialIssue',
        did: createDidAciDto.did,
        // vcSubType: 'Daram_ConcertAttendance',
        vcSubType: 'Avataroad_Kasset',
        nickName: createDidAciDto.nickName,
        attributes: createDidAciDto.attributes
      };
      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));
  
      try {
        const response = await axios.post(url, data, {
          headers: { "Content-Type": "application/json" },
        });
        if(response.data){
          if(response.data.result == 'Success')
            // console.log("response.data: "+JSON.stringify(response.data));
            // const parsed = parseVC(response.data.vc);
            // console.log("vc.id: "+parsed.credentialId);
            // console.log("vcIssuerName: "+response.data.vcIssuerName);
            // console.log("vcIssuerLogo: "+response.data.vcIssuerLogo);
            // console.log("vcTypeName: "+response.data.vcTypeName);
            return {vc: response.data.vc,
                    vcIssuerName: response.data.vcIssuerName,
                    vcIssuerLogo: response.data.vcIssuerLogo,
                    vcTypeName: response.data.vcTypeName};
        }else {
          console.error("POST(createAci) ERROR: "+response.data.failureReason);
          return null;
        }
      } catch (error) {       
        if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_VC_TYPE'){
          console.error("유효하지 않은 VC TYPE 입니다.");
          error.response.data.failureReason = '유효하지 않은 VC TYPE 입니다.';
        }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_DID'){
          console.error("유효하지 않은 DID 입니다.");
          error.response.data.failureReason = '유효하지 않은 DID 입니다.';
        }
  
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: error.response.data.failureReason,
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  
  }

  /**
   * 아바타 크리덴셜 등록
   * 
   * @param createDidAcrDto 
   * @returns 
   */
  async createAcr(createDidAcrDto: CreateDidAcrDto, retryCount = 0): Promise<any> {
    if (retryCount > 1) {
      throw new InternalServerErrorException('JWT 재발급 후에도 실패했습니다.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const url = this.configService.get<string>('DID_ACR_URL');
       const data = {
        operation: 'AvatarCredentialRegister',
        id: createDidAcrDto.id,
        jwt: createDidAcrDto.jwt,
        did: createDidAcrDto.did,
        vc: createDidAcrDto.vc,
        vcIssuerName: createDidAcrDto.vcIssuerName,
        vcIssuerLogo: createDidAcrDto.vcIssuerLogo,
        vcTypeName: createDidAcrDto.vcTypeName,
        checkBusinessCard: false
      };
      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));
  
      try {
        const response = await axios.post(url, data, {
          headers: { "Content-Type": "application/json" },
        });
        if(response.data){
          if(response.data.result == 'Success')
            return {result: response.data.result};
        }else {
          console.error("POST(createAcr) ERROR: "+response.data.failureReason);
          return null;
        }
      } catch (error) {

        if(error.response.data.failureReason == 'FAILURE_REASEON_NO_REGISTRATION'){
          console.error("웹지갑에 등록되지 않은 사용자입니다.");
          error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
        }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
          console.error("유효하지 않은 바이오 인증입니다.");
          error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
        }else{
          // console.error('응답 데이터:', JSON.stringify(error.response.data.failureMessage));
          if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException') || error.response.data.failureMessage == 'JWT token is expired') {
            console.error("토큰이 만료 되었습니다.");
            const newJwt = await this.createUser({ id: createDidAcrDto.id });
            createDidAcrDto.jwt = newJwt.jwt;
              return await this.createAcr(createDidAcrDto, retryCount + 1);                       
          }else if(error.response.data.failureMessage?.startsWith('org.springframework.dao.DuplicateKeyException')) {
            console.error("이미 등록된 에셋입니다.");
            error.response.data.failureReason = '이미 등록된 에셋입니다.';
          }else{
            error.response.data.failureReason += " : "+error.response.data.failureMessage;
          }
        }
  
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: error.response.data.failureReason,
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  
  }

  /**
   * 아바타 크리덴셜 메타정보 조회 ( 사용 ? )
   * 
   * @param getDidAcmDto 
   * @returns 
   */
  async getAcm(getDidAcmDto: GetDidAcmDto, retryCount = 0): Promise<any> {
    if (retryCount > 1) {
      throw new InternalServerErrorException('JWT 재발급 후에도 실패했습니다.');
    }

    const url = this.configService.get<string>('DID_ACM_URL');
    const data = {
      operation: 'AvatarCredentialMeta',
      id: getDidAcmDto.id,
      jwt: getDidAcmDto.jwt,
      did: getDidAcmDto.did,
      vcType: getDidAcmDto.vcType,
    };
    console.log("url: "+url);
    console.log("data: "+JSON.stringify(data));

    try {
      const response = await axios.post(url, data, {
        headers: { "Content-Type": "application/json" },
      });
      if(response.data){
        if(response.data.result == 'Success')
          return {vcMetas: response.data.vcMetas, operation: response.data.operation};
      }else {
        console.error("POST(getAcm) ERROR: "+response.data.failureReason);
        return null;
      }
    } catch (error) {
      if(error.response.data.failureReason == 'FAILURE_REASEON_NO_REGISTRATION'){
        console.error("웹지갑에 등록되지 않은 사용자입니다.");
        error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
      }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
        console.error("유효하지 않은 바이오 인증입니다.");
        error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
      }else{
        // console.error('응답 데이터:', JSON.stringify(error.response.data.failureMessage));
        if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException') || error.response.data.failureMessage == 'JWT token is expired') {
          console.error("토큰이 만료 되었습니다.");
          const newJwt = await this.createUser({ id: getDidAcmDto.id });
          getDidAcmDto.jwt = newJwt.jwt;
            return await this.getAcm(getDidAcmDto, retryCount + 1);                       
        }
      }

      throw new InternalServerErrorException({
        statusCode: error.response.status,
        message: error.response.data.failureReason,
        // error: error.response.data.error,
      });
    
    }

  }

  /**
   * 아바타 크리덴셜 상세정보 조회
   * 
   * @param getDidAcdDto
   * @returns 
   */
  async getAcd(getDidAcdDto: GetDidAcdDto, retryCount = 0): Promise<any> {
    if (retryCount > 1) {
      throw new InternalServerErrorException('JWT 재발급 후에도 실패했습니다.');
    }
    const url = this.configService.get<string>('DID_ACD_URL');
    const data = {
      operation: 'AvatarCredentialDetail',
      id: getDidAcdDto.id,
      jwt: getDidAcdDto.jwt,
      vcId: getDidAcdDto.vcId,
    };
    console.log("url: "+url);
    console.log("data: "+JSON.stringify(data));

    try {
      const response = await axios.post(url, data, {
        headers: { "Content-Type": "application/json" },
      });
      if(response.data){
        if(response.data.result == 'Success')
          return {vc: response.data.vc};
      }else {
        console.error("POST(getAcd) ERROR: "+response.data.failureReason);
        return null;
      }
    } catch (error) {

      if(error.response.data.failureReason == 'FAILURE_REASEON_NO_REGISTRATION'){
        console.error("웹지갑에 등록되지 않은 사용자입니다.");
        error.response.data.failureReason = '웹지갑에 등록되지 않은 사용자입니다.';
      }else if(error.response.data.failureReason == 'FAILURE_REASEON_INVALID_BIO_AUTHENTICATION'){
        console.error("유효하지 않은 바이오 인증입니다.");
        error.response.data.failureReason = '유효하지 않은 바이오 인증입니다.';
      }else{
        // console.error('응답 데이터:', JSON.stringify(error.response.data.failureMessage));
        if(error.response.data.failureMessage?.startsWith('io.jsonwebtoken.ExpiredJwtException') || error.response.data.failureMessage == 'JWT token is expired') {
          console.error("토큰이 만료 되었습니다.");
          const newJwt = await this.createUser({ id: getDidAcdDto.id });
            getDidAcdDto.jwt = newJwt.jwt;
            return await this.getAcd(getDidAcdDto, retryCount + 1);                       
        }else if(error.response.data.failureMessage?.startsWith('java.lang.NullPointerException')) {
          console.error("등록되지않은 에셋입니다.");
          error.response.data.failureReason = '등록되지않은 에셋입니다.';
        }
      }

      throw new InternalServerErrorException({
        statusCode: error.response.status,
        message: error.response.data.failureReason,
        // error: error.response.data.error,
      });

    }
  }

}
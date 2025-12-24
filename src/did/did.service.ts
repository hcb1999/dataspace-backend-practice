import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidVcDto } from '../dtos/create_did_vc.dto';
import { GetDidUserDto } from '../dtos/get_did_user.dto';
import { GetDidVcDto } from '../dtos/get_did_vc.dto';
import { DidWallet } from '../entities/did_wallet.entity';
import { User } from "../entities/user.entity";
import { createVC, parseVC } from 'src/common/vc-utils';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
// import { Console } from 'console';

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
   * 사용자 등록
   * 
   * @param createDidUserDto
   * @returns 
   */
  async createUser(createDidUserDto: CreateDidUserDto): Promise<any> {

    try {

      const email = createDidUserDto.email;
      const nickname = createDidUserDto.nickName;
      const apiToken = this.configService.get<string>('AL_API_TOKEN');
      const dataspace = this.configService.get<string>('DID_DATASPACE');
      const url = this.configService.get<string>('DID_ISSUE_URL');
      const data = {
        "issuerDid": dataspace,
        "sourceHolderDid": "", 
        "targetHolderDid": "", 
        "payload": {
          "issueType": "1",
          "vcType": "4",
          "credential": {
            email,
            nickname
            }
          }
      };

      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));
      // console.log("apiToken: "+apiToken);

      try {
        const response = await axios.post(url, data, {
          timeout: 1000 * 60 * 5, // 5분
          headers: { 
            Authorization: `Bearer ${apiToken}` ,
            'Content-Type': 'application/json',   
          },
        });
 
        console.log("response.data: "+JSON.stringify(response.data));
        if(response.data){
          if(response.data.resultMessage == 'SUCCESS'){                       
            return {did: response.data.data.did, 
              walletAddress: response.data.data.smcWalletAddress,
              orgId: response.data.data.orgId
            };
          }
        }else {
          console.error("POST(createUser) ERROR: "+response.data.resultMessage);
          return null;
        }
      } catch (error) {
        console.log("POST(createUser) ERROR "+JSON.stringify(error.response.data));
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: "Internal Error",
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 사용자 검증 By email
   * 
   * @param getDidUserDto
   * @returns 
   */
  async verifyUser(getDidUserDto: GetDidUserDto): Promise<any> {

    try {

      const did = getDidUserDto.walletDid;
      const apiToken = this.configService.get<string>('AL_API_TOKEN');
      const dataspace = this.configService.get<string>('DID_DATASPACE');
      const url = this.configService.get<string>('DID_VERIFY_URL');
      const data = {
        "sourceHolderDid": did,
        "verfierDid": dataspace, 
        "payload": {
          "proofs": [
            {
              "vcType": "4",
               "proofItem": ["nickname", "email"]
            }
          ]
        }
      };

      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));

      try {
        const response = await axios.post(url, data, {
          headers: { 
            Authorization: `Bearer ${apiToken}` 
          },
        });
 
        console.log("response.data: "+JSON.stringify(response.data));
        console.log("response.data: "+JSON.stringify(response.data.data.proofs));
        if(response.data){
          if(response.data.resultMessage == 'SUCCESS'){                       
            return {email: response.data.data.proofs[0].proof.email, nickname: response.data.data.proofs[0].proof.nickname};
          }
        }else {
          console.error("POST(verifyUser) ERROR: "+response.data.resultMessage);
          return null;
        }
      } catch (error) {
        console.log("POST(verifyUser) ERROR: "+JSON.stringify(error.response.data));
        throw new InternalServerErrorException({
          statusCode: error.response.resultCode,
          message: "Internal Error",
          // error: error.response.data.error,
        });
      }
      
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 데이터 스페이스 VC 등록
   * 
   * @param createDidVcDto
   * @returns 
   */
  async createVC(createDidVcDto: CreateDidVcDto): Promise<any> {

    try {

      const walletDid = createDidVcDto.walletDid;
      const vcType = createDidVcDto.vcType;
      const apiToken = this.configService.get<string>('AL_API_TOKEN');
      const dataspace = this.configService.get<string>('DID_DATASPACE');
      const url = this.configService.get<string>('DID_ISSUE_URL');
      delete createDidVcDto.walletDid;
      delete createDidVcDto.vcType;
      const data = {
        "issuerDid": dataspace,
        "sourceHolderDid": walletDid, 
        "targetHolderDid": "", 
        "payload": {
        "issueType": "1",
        "vcType": vcType,
        "credential": {
          ...createDidVcDto 
          }
        }
      };

      console.log("createVC url: "+url);
      console.log("createVC data: "+JSON.stringify(data));
      // console.log("apiToken: "+apiToken);

      try {
        const response = await axios.post(url, data, {
          headers: { 
            Authorization: `Bearer ${apiToken}` 
          },
        });
 
        console.log("response.data: "+JSON.stringify(response.data));
        if(response.data){
          if(response.data.resultMessage == 'SUCCESS'){                       
            return {did: response.data.data.did, walletAddress: response.data.data.smcWalletAddress};
          }
        }else {
          console.error("POST(createVC) ERROR: "+response.data.resultMessage);
          return null;
        }
      } catch (error) {
        console.log("POST(createVC) ERROR "+JSON.stringify(error.response.data));
        throw new InternalServerErrorException({
          statusCode: error.response.status,
          message: "Internal Error",
          // error: error.response.data.error,
        });
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 데이터 스페이스 VC 조회
   * 
   * @param getDidVcDto
   * @returns 
   */
  async verifyVC(getDidVcDto: GetDidVcDto): Promise<any> {

    try {

      const did = getDidVcDto.walletDid;
      const apiToken = this.configService.get<string>('AL_API_TOKEN');
      const dataspace = this.configService.get<string>('DID_DATASPACE');
      const url = this.configService.get<string>('DID_VERIFY_URL');
      const data = {
        "sourceHolderDid": did,
        "verfierDid": dataspace, 
        "payload": {
          "proofs": [
            {
              "vcType": getDidVcDto.vcType,
               "proofItem": ["dataId", "issuerDid", "dataName", "dataDesc", "productType", "language", "keyWord",
                "doi", "subject", "issuer", "doiUrl", "registrantEmail", "registrantWalletAddress",
                "dataPrice", "txId", "contractAddress", "imageURL", "registrationDate"]
            }
          ]
        }
      };

      console.log("url: "+url);
      console.log("data: "+JSON.stringify(data));

      try {
        const response = await axios.post(url, data, {
          headers: { 
            Authorization: `Bearer ${apiToken}` 
          },
        });
 
        console.log("response.data: "+JSON.stringify(response.data));
        if(response.data){
          if(response.data.resultMessage == 'SUCCESS'){              
            console.log("response.data vc : "+JSON.stringify(response.data.data.proofs[0].proof));         
            return {vc: response.data.data.proofs[0].proof};
          }
        }else {
          console.error("POST(verifyVC) ERROR: "+response.data.resultMessage);
          return null;
        }
      } catch (error) {
        console.log("POST(verifyVC) ERROR: "+JSON.stringify(error.response.data));
        throw new InternalServerErrorException({
          statusCode: error.response.resultCode,
          message: "Internal Error",
          // error: error.response.data.error,
        });
      }
      
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

}
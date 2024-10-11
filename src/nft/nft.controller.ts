import { Body, Controller, HttpStatus, Post, Get, ValidationPipe, UseGuards, Query, Param } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { NftService } from './nft.service';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { GetMintBurnDto } from '../dtos/get_mint_burn.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { GetTransferDto } from '../dtos/get_transfer.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('nft')
@ApiTags('NFT API')
export class NftController {
  constructor(
    private responseMessage: ResponseMessage,
    private responseMetadata: ResponseMetadata,
    private nftService: NftService
  ) {}
 
  @Post("/mint")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Mint', description: 'NFT Mint' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createMint(@GetUser() user: User, @Body(ValidationPipe) createMintDto: CreateMintDto): Promise<any> {
    fileLogger.info('mint-create');
    fileLogger.info(user);
    fileLogger.info(createMintDto);
    await this.nftService.createMint(user,createMintDto);
    const result = {message: 'Minting process started'};
    return this.responseMessage.response(result);
  }
 
  @Post("/transfer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Transfer', description: 'NFT Transfer' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createTransfer(@GetUser() user: User, @Body(ValidationPipe) createTransferDto: CreateTransferDto): Promise<any> {
    await this.nftService.createTransfer(user, createTransferDto);
    const result = {message: 'Transfer process started'};
    return this.responseMessage.response(result);
  }

  @Post("/burn")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Burn', description: 'NFT Burn' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createBurn(@GetUser() user: User, @Body() createBurnDto: CreateBurnDto): Promise<any> {
    await this.nftService.createBurn(user, createBurnDto);
    const result = {message: 'Burn process started'};
    return this.responseMessage.response(result);
  }

  /**
   * MINT 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  @Get('/mint')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 민팅 목록 조회', description: '에셋 민팅 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getMintList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
    const mintList = await this.nftService.getMintList(user, getMintBurnDto);

    const updatedList = mintList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...mintList,
      list: updatedList
    });

  }

  /**
   * TRANSFER 목록 조회
   * @param user 
   * @param getTransferDto 
   * @returns 
   */
  @Get('/transfer')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 트랜스퍼 목록 조회', description: '에셋 트랜스퍼 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getTransferList(@GetUser() user: User, @Query() getTransferDto: GetTransferDto ): Promise<void> {
    const transferList = await this.nftService.getTransferList(user, getTransferDto);

    const updatedList = transferList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...transferList,
      list: updatedList
    });

  }

  /**
   * BURN 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  @Get('/burn')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 버닝 목록 조회', description: '에셋 버닝 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getBurnList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
    const burnList = await this.nftService.getBurnList(user, getMintBurnDto);

    const updatedList = burnList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...burnList,
      list: updatedList
    });

  }

}

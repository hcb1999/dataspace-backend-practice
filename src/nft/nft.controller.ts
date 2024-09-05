import { Body, Controller, HttpStatus, Post, Get, ValidationPipe, UseGuards, Query, Param } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
// import { CreateDeoaDto } from '../dtos/create_deoa.dto';
// import { CreateMetaDataDto } from '../dtos/create_metadata.dto';
import { NftService } from './nft.service';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { GetMintDto } from '../dtos/get_mint.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { GetTransferDto } from '../dtos/get_transfer.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { CreateMintCallBackDto } from '../dtos/create_mint_callback.dto';
import { CreateTransferCallBackDto } from '../dtos/create_transfer_callback.dto';
import { CreateBurnCallBackDto } from '../dtos/create_burn_callback.dto';
import fileLogger from '../common/logger';

@Controller('nft')
@ApiTags('NFT API')
export class NftController {
  constructor(
    private responseMessage: ResponseMessage,
    private responseMetadata: ResponseMetadata,
    private nftService: NftService
  ) {}
 /* 
  @Post("/mint")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Mint', description: 'NFT Mint' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createMint(@GetUser() user: User, @Body(ValidationPipe) createMintDto: CreateMintDto): Promise<void> {
    fileLogger.info('mint-create');
    fileLogger.info(user);
    fileLogger.info(createMintDto);
    await this.nftService.createMint(user,createMintDto);
    return this.responseMessage.response(null);
  }

  @Get('/mint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT 발행 목록 조회', description: 'NFT 발행 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      resultCode: 200,
      resultMessage: 'SUCCESS',
      data: {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "nftMintNo": 20,
            "assetNo": 4,
            "issuedTo": "0x2345678901",
            "tokenIdx": "19",
            "useYn": "N"
          }
        ]
      }
    }}})
  async getMintList(@GetUser() user: User, @Query() getMintDto: GetMintDto ): Promise<void> {
    const mintList = await this.nftService.getMintList(user, getMintDto);
    return this.responseMessage.response(mintList);
  }
*/
  // @Get('/mint/:tokenidx')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '발행된 NFT token 정보 조회', description: '발행된 NFT token 정보를 조회한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  // async gettoken(@GetUser() user: User, @Param('tokenidx') tokenidx: string ): Promise<any> {
  //   const mintInfo = await this.nftService.gettoken(user, tokenidx);
  //   return this.responseMessage.response(mintInfo);
  // }
/*
  @Get('/mint/tokenidx/:count')
  @ApiOperation({ summary: '발행될 NFT token index 조회', description: '발행될 NFT token index를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      resultCode: 200,
      resultMessage: 'SUCCESS',
      data: {
        "tokenIdx": "16"
      }
    }}})
  async gettokenNewIdx(@GetUser() user: User, @Param('count') count: number ): Promise<any> {
    const tokenIdx = await this.nftService.gettokenNewIdx(user, count);
    return this.responseMessage.response(tokenIdx);
  }

  @Get('/mint/tokenidx/:asseteNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '발행된 NFT token index 조회', description: '발행된 NFT token index를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      resultCode: 200,
      resultMessage: 'SUCCESS',
      data: {
        "tokenIdx": "16"
      }
    }}})
  async gettokenIdx(@GetUser() user: User, @Param('asseteNo') asseteNo: number ): Promise<any> {
    const tokenIdx = await this.nftService.gettokenIdx(user, asseteNo);
    return this.responseMessage.response(tokenIdx);
  }

  @Get('/mint/tokenidx/:asseteNo/:productNo/:count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '발행된 NFT token indexes 조회', description: '발행된 NFT token indexes를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "tokenIdAry": [
          "28",
          "29",
          "30"
        ]
  }
    }}})
  async tokenidx(@GetUser() user: User, @Param('asseteNo') asseteNo: number, @Param('productNo') productNo: number, @Param('count') count: number ): Promise<any> {
    const tokenIdxes = await this.nftService.tokenidx(user, asseteNo, productNo, count);
    return this.responseMessage.response(tokenIdxes);
  }
*/
/*
  @Get('/mint/tokenidx/:asseteNo/:productNo/:count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '발행된 NFT token indexes 조회', description: '발행된 NFT token indexes를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": [
        {
          "mintNo": 119,
          "tokenIdx": "28"
        },
        {
          "mintNo": 120,
          "tokenIdx": "29"
        },
        {
          "mintNo": 122,
          "tokenIdx": "30"
        }
      ]
    }}})
  async tokenidxes(@GetUser() user: User, @Param('asseteNo') asseteNo: number, @Param('productNo') productNo: number, @Param('count') count: number ): Promise<any> {
    const tokenIdxes = await this.nftService.tokenidxes(user, asseteNo, productNo, count);
    return this.responseMessage.response(tokenIdxes);
  }
  */

  /*
  @Get('/tokenMetadata/:tokenIdx')
  @ApiOperation({ summary: '발행한 NFT token index의 Metadata 조회', description: '발행한 NFT token index의 Metadata를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "description": "테스트 에셋1 - 한벌의상",
      "name": "테스트 에셋1",
      "image": "http://localhost:3000/file/20230807/1691383976002.png"
    }}})
  async gettokenMetadata(@GetUser() user: User, @Param('tokenIdx') tokenIdx: string ): Promise<void> {
    const tokenMetadata = await this.nftService.gettokenMetadata(user, tokenIdx);
    return this.responseMetadata.response(tokenMetadata);
  }
*/
/*
  @Post("/transfer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Transfer', description: 'NFT Transfer' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createTransfer(@GetUser() user: User, @Body(ValidationPipe) createTransferDto: CreateTransferDto): Promise<void> {
    const result = await this.nftService.createTransfer(user, createTransferDto);
    return this.responseMessage.response(null);
  }
*/
/*
  @Get('/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT 이전 목록 조회', description: 'NFT 이전 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      resultCode: 200,
      resultMessage: 'SUCCESS',
      data: {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "nftTransferNo": 3,
            "fromAddr": "0x2345678901",
            "toAddr": "0x1234567890",
            "tokenIdx": "15"
          }
        ]
      }
    }}})
  async getTransferList(@GetUser() user: User, @Query() getTransferDto: GetTransferDto ): Promise<void> {
    const transferList = await this.nftService.getTransferList(user, getTransferDto);
    return this.responseMessage.response(transferList);
  }
*/
/*
  @Post("/burn")
  @ApiOperation({ summary: 'NFT Burn', description: 'NFT Burn' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createBurn(@GetUser() user: User, @Body() createBurnDto: CreateBurnDto): Promise<void> {
    const result = await this.nftService.createBurn(user, createBurnDto);
    return this.responseMessage.response(null);
  }
*/
/*
  @Get('/burn/tokenidx/:asseteNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용되지않은 NFT token index 조회', description: '사용되지않은 NFT token index를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "tokenIdAry": [
          "38",
          "39",
          "40"
        ]
      }
    }}})
  async getBurntokenIdxes(@GetUser() user: User, @Param('asseteNo') asseteNo: number ): Promise<any> {
    const tokenIdx = await this.nftService.getBurntokenIdxes(user, asseteNo);
    return this.responseMessage.response(tokenIdx);
  }
*/
/*
  @Get('/burn/tokenidx/:asseteNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용되지않은 NFT token index 조회', description: '사용되지않은 NFT token index를 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": [
        {
          "mintNo": 130,
          "tokenIdx": "38"
        },
        {
          "mintNo": 131,
          "tokenIdx": "39"
        },
        {
          "mintNo": 132,
          "tokenIdx": "40"
        }
      ]
    }}})
  async getBurntokenIdx(@GetUser() user: User, @Param('asseteNo') asseteNo: number ): Promise<any> {
    const tokenIdx = await this.nftService.getBurntokenIdx(user, asseteNo);
    return this.responseMessage.response(tokenIdx);
  }
*/
/*
  @Post("/mint/token/callback")
  @ApiOperation({ summary: 'NFT Mint 콜백 ', description: 'NFT Mint 콜백' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  async createMintCallBack(@Body() createMintCallBackDto: CreateMintCallBackDto): Promise<void> {
    const result = await this.nftService.createMintCallBack(createMintCallBackDto);
    return this.responseMessage.response(result);
  }

  @Post("/transfer/token/callback")
  @ApiOperation({ summary: 'NFT Transfer 콜백 ', description: 'NFT Transfer 콜백' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  async createTransferCallBack(@Body() createTransferCallBackDto: CreateTransferCallBackDto): Promise<void> {
    const result = await this.nftService.createTransferCallBack(createTransferCallBackDto);
    return this.responseMessage.response(result);
  }

  @Post("/burn/token/callback")
  @ApiOperation({ summary: 'NFT Burn 콜백 ', description: 'NFT Burn 콜백' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  async createBurnCallBack(@Body() createBurnCallBackDto: CreateBurnCallBackDto): Promise<void> {
    const result = await this.nftService.createBurnCallBack(createBurnCallBackDto);
    return this.responseMessage.response(result);
  }
*/
}

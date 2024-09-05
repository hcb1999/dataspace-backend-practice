import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/multer.options';
import { SharpPipe } from '../common/sharp.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreateProductDto } from '../dtos/create_product.dto';
import { ModifyProductDto } from '../dtos/modify_product.dto';
import { GetProductDto } from '../dtos/get_product.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('product')
@ApiTags('굿즈 API')
export class ProductController {
  private logger = new Logger('ProductController');

  constructor(
    private responseMessage: ResponseMessage,
    private productService: ProductService
  ) { }

  /**
   * 굿즈 정보 등록
   * 
   * @param user 
   * @param files 
   * @param createProductDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 2 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '굿즈 정보 등록', description: '굿즈 정보를 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '파일 미입력' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동일한 파일 존재' })
  @ApiCreatedResponse({ description: '성공', schema: { example: { resultCode: HttpStatus.CREATED, resultMessage: 'SUCCESS' } } })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        resultCode: 200,
        resultMessage: 'SUCCESS',
        data: {
          "productNo": 28
        }
      }
    }
  })
  async create(@GetUser() user: User, 
    @UploadedFiles(SharpPipe) files: Express.Multer.File[], 
    @Body(ValidationPipe) createProductDto: CreateProductDto): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('product-create');
    fileLogger.info(user);
    fileLogger.info(createProductDto);
    const product: any = await this.productService.create(user, files, createProductDto);
    return this.responseMessage.response(product);
  }

  /**
   * 굿즈 정보 수정
   * 
   * @param user 
   * @param productNo 
   * @param modifyProductDto 
   * @returns 
   */
  @Put('/:productNo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 2 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '굿즈 정보 수정', description: '굿즈 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 광고제품 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동일한 파일 존재' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('productNo') productNo: number, 
    @UploadedFiles(SharpPipe) files: Express.Multer.File[],
    @Body(ValidationPipe) modifyProductDto: ModifyProductDto): Promise<void> {
    fileLogger.info('product-update');
    fileLogger.info(user);
    fileLogger.info(`productNo: ${productNo}`);
    fileLogger.info(modifyProductDto);
    await this.productService.update(user, productNo, files, modifyProductDto);
    return this.responseMessage.response(null);
  }

  /**
   * 굿즈 정보 삭제
   * 
   * @param user 
   * @param productNo 
   * @returns 
   */
  @Delete('/:productNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '굿즈 정보 삭제', description: '굿즈 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('productNo') productNo: number): Promise<void> {
    fileLogger.info('product-delete');
    fileLogger.info(user);
    fileLogger.info(`productNo: ${productNo}`);
    await this.productService.delete(user, productNo);
    return this.responseMessage.response(null);
  }

  /**
   * 굿즈 게시 중지
   * 
   * @param user 
   * @param productNo 
   * @returns 
   */
  @Put('/stop/:productNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '굿즈 게시 중지', description: '굿즈 게시를 중지한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modifyState(@GetUser() user: User, @Param('productNo') productNo: number): Promise<void> {
    fileLogger.info('product-update stop');
    fileLogger.info(user);
    fileLogger.info(`productNo: ${productNo}`);
    await this.productService.updateStop(user, productNo);
    return this.responseMessage.response(null);
  }

  /**
   * 굿즈 목록 조회
   * 
   * @param user 
   * @param getProductDto 
   * @returns 
   */
  @Get('/')
  @ApiOperation({ summary: '굿즈 목록 조회', description: '굿즈 목록을 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "pageSize": 10,
          "totalCount": 2,
          "totalPage": 1,
          "list": [
            {
              "state": "N2",
              "productNo": 25,
              "productName": "블링원 테스트 굿즈3",
              "productDesc": "블링원 테스트 굿즈3 입니다.",
              "regName": "테스트유저0",
              "adTargetFirst": 1,
              "adTargetSecond": 2,
              "adTargetThird": 3,
              "adTargetFirstName": "로블록스",
              "adTargetSecondName": "제페토",
              "adTargetThirdName": "K-POP 월드",
              "startDttm": "2024-07-30 21:14:30",
              "endDttm": "2024-09-30 21:14:30",
              "fileNameFirst": "blingone_3.png",
              "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725023097074.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725023097074.png"
            },
            {
              "state": "N2",
              "productNo": 24,
              "productName": "블링원 테스트 굿즈2",
              "productDesc": "블링원 테스트 굿즈2 입니다.",
              "regName": "테스트유저0",
              "adTargetFirst": 1,
              "adTargetSecond": 2,
              "adTargetThird": 3,
              "adTargetFirstName": "로블록스",
              "adTargetSecondName": "제페토",
              "adTargetThirdName": "K-POP 월드",
              "startDttm": "2024-08-30 21:14:30",
              "endDttm": "2024-10-30 21:14:30",
              "fileNameFirst": "blingone_2.png",
              "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725023083032.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725023083032.png"
            }
          ]
        }
      }
    }
  })
  async getProductList(@Query() getProductDto: GetProductDto): Promise<any> {
    const productList = await this.productService.getProductList(getProductDto);

    const updatedList = productList.list.map((item: any) => ({
      ...item,
      startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...productList,
      list: updatedList
    });

  }

    /**
   * 굿즈 목록 조회 (마이페이지)
   * 
   * @param user 
   * @param getProductDto 
   * @returns 
   */
    @Get('/mypage')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '굿즈 목록 조회', description: '굿즈 목록을 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          "resultCode": 200,
          "resultMessage": "SUCESS",
          "data": {
            "pageSize": 10,
            "totalCount": 4,
            "totalPage": 1,
            "list": [
              {
                "state": "N1",
                "productNo": 26,
                "productName": "블링원 테스트 굿즈4",
                "productDesc": "블링원 테스트 굿즈4 입니다.",
                "regName": "테스트유저0",
                "adTargetFirst": 1,
                "adTargetSecond": 2,
                "adTargetThird": 3,
                "adTargetFirstName": "로블록스",
                "adTargetSecondName": "제페토",
                "adTargetThirdName": "K-POP 월드",
                "startDttm": "2024-09-11 09:00:00",
                "endDttm": "2024-11-01 09:00:00",
                "fileNameFirst": "blingone_4.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725025423591.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725025423591.png"
              },
              {
                "state": "N2",
                "productNo": 25,
                "productName": "블링원 테스트 굿즈3",
                "productDesc": "블링원 테스트 굿즈3 입니다.",
                "regName": "테스트유저0",
                "adTargetFirst": 1,
                "adTargetSecond": 2,
                "adTargetThird": 3,
                "adTargetFirstName": "로블록스",
                "adTargetSecondName": "제페토",
                "adTargetThirdName": "K-POP 월드",
                "startDttm": "2024-07-30 21:14:30",
                "endDttm": "2024-09-30 21:14:30",
                "fileNameFirst": "blingone_3.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725023097074.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725023097074.png"
              },
              {
                "state": "N2",
                "productNo": 24,
                "productName": "블링원 테스트 굿즈2",
                "productDesc": "블링원 테스트 굿즈2 입니다.",
                "regName": "테스트유저0",
                "adTargetFirst": 1,
                "adTargetSecond": 2,
                "adTargetThird": 3,
                "adTargetFirstName": "로블록스",
                "adTargetSecondName": "제페토",
                "adTargetThirdName": "K-POP 월드",
                "startDttm": "2024-08-30 21:14:30",
                "endDttm": "2024-10-30 21:14:30",
                "fileNameFirst": "blingone_2.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725023083032.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725023083032.png"
              },
              {
                "state": "N1",
                "productNo": 23,
                "productName": "블링원 테스트 굿즈1",
                "productDesc": "블링원 테스트 굿즈1 입니다.",
                "regName": "테스트유저0",
                "adTargetFirst": 1,
                "adTargetSecond": null,
                "adTargetThird": 3,
                "adTargetFirstName": "로블록스",
                "adTargetSecondName": null,
                "adTargetThirdName": "K-POP 월드",
                "startDttm": "2024-09-30 09:00:00",
                "endDttm": "2024-11-30 09:00:00",
                "fileNameFirst": "blingone.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725002565657.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725002565657.png"
              }
            ]
          }
        }
      }
    })
    async getProductMyList(@GetUser() user: User, @Query() getProductDto: GetProductDto): Promise<any> {
      // fileLogger.info('product-mypage');
      // fileLogger.info(user);
      // fileLogger.info(`getProductDto: ${getProductDto}`);
      const productList = await this.productService.getProductMyList(user, getProductDto);

      const updatedList = productList.list.map((item: any) => ({
        ...item,
        startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      }));
    
      return this.responseMessage.response({
        ...productList,
        list: updatedList
      });

    }

  /**
   * 굿즈 상세 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param productNo 
   * @returns 
   */
    @Get('/mypage/:productNo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '굿즈 정보 조회', description: '굿즈 정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          "resultCode": 200,
          "resultMessage": "SUCESS",
          "data": {
            "productInfo": {
              "state": "N1",
              "productNo": 26,
              "regName": "테스트유저0",
              "regAddr": "0x12345678900",
              "productName": "블링원 테스트 굿즈4",
              "adTargetFirst": 1,
              "adTargetSecond": 2,
              "adTargetThird": 3,
              "adTargetFirstName": "로블록스",
              "adTargetSecondName": "제페토",
              "adTargetThirdName": "K-POP 월드",
              "adtypesfirst": "",
              "adtypessecond": "",
              "adtypesthird": "7, 8, 5, 6",
              "adtypesfirstname": null,
              "adtypessecondname": null,
              "adtypesthirdname": null,
              "productDesc": "블링원 테스트 굿즈4 입니다.",
              "startDttm": "2024-09-11 09:00:00",
              "endDttm": "2024-11-01 09:00:00",
              "regDttm": "2024-08-30 22:43:43",
              "fileNameFirst": "blingone_4.png",
              "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725025423591.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725025423591.png"
            },
            "assetList": []
          }
        }
      }
    })
    async getMyInfo(@GetUser() user: User, @Param('productNo') productNo: number): Promise<any> {
      const product = await this.productService.getMyInfo(user, productNo);

      const updatedProductInfo = {
        ...product.productInfo,
        startDttm: moment(product.productInfo.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(product.productInfo.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(product.productInfo.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      };

      return this.responseMessage.response({
        ...product,
        productInfo: updatedProductInfo,
      });
    }

      /**
   * 굿즈 상세 정보 조회
   * 
   * @param user 
   * @param productNo 
   * @returns 
   */
      @Get('/:productNo')
      // @UseGuards(JwtAuthGuard)
      // @ApiBearerAuth('access-token')
      @ApiOperation({ summary: '굿즈 정보 조회', description: '굿즈 정보를 조회한다.' })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
      @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
      @ApiOkResponse({
        description: '성공',
        schema: {
          example: {
            "resultCode": 200,
            "resultMessage": "SUCESS",
            "data": {
              "productNo": 26,
              "regName": "테스트유저0",
              "regAddr": "0x12345678900",
              "productName": "블링원 테스트 굿즈4",
              "adTargetFirst": 1,
              "adTargetSecond": 2,
              "adTargetThird": 3,
              "adTargetFirstName": "로블록스",
              "adTargetSecondName": "제페토",
              "adTargetThirdName": "K-POP 월드",
              "adtypesfirst": "",
              "adtypessecond": "",
              "adtypesthird": "7, 8, 5, 6",
              "adtypesfirstname": null,
              "adtypessecondname": null,
              "adtypesthirdname": null,
              "productDesc": "블링원 테스트 굿즈4 입니다.",
              "startDttm": "2024-09-11 09:00:00",
              "endDttm": "2024-11-01 09:00:00",
              "regDttm": "2024-08-30 22:43:43",
              "fileNameFirst": "blingone_4.png",
              "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725025423591.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725025423591.png"
            }
          }
        }
      })
      async getInfo(@Param('productNo') productNo: number): Promise<any> {
        const product = await this.productService.getInfo(productNo);
        
        return this.responseMessage.response({
          ...product,
          startDttm: moment(product.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
          endDttm: moment(product.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
          regDttm: moment(product.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
        });  
      }
  
}
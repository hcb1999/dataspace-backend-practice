import { HttpException, HttpStatus } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import * as moment from 'moment-timezone';
import { diskStorage } from "multer";
import { extname } from "path";

export const multerOptions = {
  fileFilter: (request, file, callback) => {
    let isMovie = false;
    if (request.originalUrl.indexOf('/video') === 0) {
      isMovie = true;
    }

    // if (!isMovie && file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      if (!isMovie && (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/) || file.mimetype.match(/\/(JPG|JPEG|PNG|GIF)$/) 
         || file.originalname.endsWith('.glb') || file.originalname.endsWith('.GLB') 
         || file.originalname.endsWith('.ply') || file.originalname.endsWith('.PLY')
         || file.originalname.endsWith('.fbx') || file.originalname.endsWith('.FBX'))) {
       // 이미지 형식은 jpg, jpeg, png, gif, 또는 glb 확장자를 가진 파일을 허용합니다.
    
      callback(null, true);
    } else if (isMovie && file.mimetype.match(/\/(mp4)$/)) {
      // 동영상 형식은 mp4만 허용합니다.
      callback(null, true);
    } else {
      callback(
        new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: '지원하지 않는 이미지 형식입니다.'
          },
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: (request, file, callback) => {
      let uploadPath = 'public';
      // if (request.originalUrl.indexOf('/product') === 0) {
      //   uploadPath += '/product';
      // } else if (request.originalUrl.indexOf('/item') === 0) {
      //   uploadPath += '/item';
      // } else if (request.originalUrl.indexOf('/avatar') === 0) {
      //   uploadPath += '/avatar';
      // } else if (request.originalUrl.indexOf('/video') === 0) {
      //   uploadPath += '/video';
      // }

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }

      uploadPath += '/file'
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }

      uploadPath += '/' + moment().format("YYYYMMDD");
      if (!existsSync(uploadPath)) {
        // uploads 폴더가 존재하지 않을시, 생성합니다.
        mkdirSync(uploadPath);
      }

      callback(null, uploadPath);
    },
    filename: (request, file, callback) => {
      //파일 이름 설정

      callback(null, `${Date.now()}${extname(file.originalname)}`);
    },
  })
}
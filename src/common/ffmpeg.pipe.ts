import { Injectable, PipeTransform } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync, readFileSync } from "fs";
import * as crypto from 'crypto';
import { join } from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require("fluent-ffmpeg");

@Injectable()
export class FFmpegPipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
  constructor(private configService: ConfigService) {}
  
  async transform(image: Express.Multer.File): Promise<Express.Multer.File> {
    if(image){
      // 원본 파일 해쉬값 
      const orgFileName = join(__dirname, `../../${image.path}`);
      const orgBuf = readFileSync(orgFileName);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(orgBuf);
      const orgFileHex = hashSum.digest('hex');
      //console.log('orgFileHex = ', orgFileHex);

      // 디렉토리 생성
      let newFileName = image.path.replace('file','thumbnail');
      const orgExt = newFileName.substring(newFileName.lastIndexOf('.') + 1);
      newFileName = newFileName.replace(orgExt, 'png');

      const fileName = join(__dirname, `../../${image.path}`);
      const buf = readFileSync(fileName);

      let idx = newFileName.lastIndexOf('/');
      if(idx === -1){
        idx = newFileName.lastIndexOf('\\');
      }

      let idxThumb = newFileName.substring(0,idx).lastIndexOf('/');
      if(idxThumb === -1){
        idxThumb = newFileName.substring(0,idx).lastIndexOf('\\');
      }

      const thumbPath = newFileName.substring(0,idxThumb);      
      if (!existsSync(thumbPath)) {
        mkdirSync(thumbPath);
      }

      const uploadPath = newFileName.substring(0,idx);      
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }

      // 동영상 정보 분석 및 썸네일 생성
      const domain = this.configService.get<string>('server.domain');
      const url = domain + image.destination.replace('public','') + '/' + image.filename;

      let fileLength = 0;

      ffmpeg.ffprobe(url, function (err, metadata) {
        //url을 받으면 해당 비디오에대한 정보가 metadata에담김
        //console.log(metadata); //metadata안에담기는 모든정보들 체킹
        fileLength = metadata.format.duration; //동영상길이대입
        //console.log('fileLength = ', fileLength);
      });

      //썸네일 생성
      ffmpeg(url) //클라이언트에서보낸 비디오저장경로
        .on("filenames", function (filenames) {
          //해당 url에있는 동영상을 밑에 스크린샷옵션을 기반으로
          //캡처한후 filenames라는 이름에 파일이름들을 저장
          //console.log("will generate " + filenames.join(","));
          //console.log("filenames:", filenames);

          //filePath = "uploads/thumbnails/" + filenames[0];
        })
        .on("end", function () {
          console.log("Screenshots taken");
        })
        .on("error", function (err) {
          console.log(err);
        })
        .screenshots({
          //Will take screenshots at 20% 40% 60% and 80% of the video
          count: 1,
          folder: uploadPath,
          size: "320x240",
          //'%b':input basename(filename w/o extension) = 확장자제외파일명
          filename: "%b.png",
        });

      image['fileName'] = image.originalname;
      image['fileType'] = image.mimetype;
      image['filePath'] = image.path.replace('public','').replace(/\\/g,'/').substring(1);
      image['fileSize'] = image.size;
      image['fileHash'] = orgFileHex;
      image['thumbnail'] = newFileName.replace('public','').replace(/\\/g,'/').substring(1);
      image['fileLength'] = fileLength;  
    }
    
    return image;
  }
}
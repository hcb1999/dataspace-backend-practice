import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { existsSync, mkdirSync, readFileSync } from "fs";
import * as crypto from 'crypto';
import path, { join } from "path";
import * as sharp from "sharp";

@Injectable()
export class SharpPipe implements PipeTransform {
  async transform(files:  Record<string, Express.Multer.File[]>): Promise<Express.Multer.File[]> {
    const fileKeys = Object.keys(files);
    // console.log("======= : "+fileKeys.length)
    if (fileKeys.length > 0) {
    // if (files) {
      // console.log('============  Yes image files');
      const images = files['files'];
      const promises = images.map(async (image) => {
      //throw new BadRequestException("파일 미입력");
      // 원본 파일 해쉬값 
        const orgFileName = join(__dirname, `../../${image.path}`);
        const orgBuf = readFileSync(orgFileName);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(orgBuf);
        const orgFileHex = hashSum.digest('hex');
        // console.log('orgFileHex = ', orgFileHex)

        image['fileName'] = image.originalname;
        image['fileType'] = image.mimetype;
        image['filePath'] = image.path.replace('public', '').replace(/\\/g, '/').substring(1);
        image['fileSize'] = image.size;
        image['fileHash'] = orgFileHex;

        if(!orgFileName.endsWith('.glb') && !orgFileName.endsWith('.ply') && !orgFileName.endsWith('.fbx')){
          // thumbnail로 변환
          const newFileName = image.path.replace('file', 'thumbnail');
          const fileName = join(__dirname, `../../${image.path}`);
          const buf = readFileSync(fileName);

          let idx = newFileName.lastIndexOf('/');
          if (idx === -1) {
            idx = newFileName.lastIndexOf('\\');
          }

          let idxThumb = newFileName.substring(0, idx).lastIndexOf('/');
          if (idxThumb === -1) {
            idxThumb = newFileName.substring(0, idx).lastIndexOf('\\');
          }

          const thumbPath = newFileName.substring(0, idxThumb);
          if (!existsSync(thumbPath)) {
            mkdirSync(thumbPath);
          }

          const uploadPath = newFileName.substring(0, idx);
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath);
          }

          await sharp(buf)
            .resize(100)
            .toFile(newFileName);
          // .webp({ effort: 3 })

          image['thumbnail'] = newFileName.replace('public', '').replace(/\\/g, '/').substring(1);
          // image['buf'] = buf;
          // console.log("============== image :"+JSON.stringify(image));
        }
        
        return image;
      });

      const results = await Promise.all(promises);
      return results;
    }else{
      // console.log('============  No image files');
    }
    
  }
}
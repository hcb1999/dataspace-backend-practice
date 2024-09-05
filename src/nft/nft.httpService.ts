import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Observable, catchError, lastValueFrom, map} from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data'

@Injectable()
export class NftHttpService {
  private logger = new Logger('NftHttpService');

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ){}

  async sendHttpRequest(path:string, data: any, token: string): Promise<Observable<AxiosResponse<any>>> {
    const domain = this.configService.get<string>('nft.domain');
    const url = domain + path;
    // AxiosResponse<any>
    const options: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };

    const responseData = await lastValueFrom (
      this.httpService.post(url, data, options)
      .pipe(
        map((response) => {
          return response.data;
        })
      )
      .pipe(
        catchError((e) => {
          this.logger.error(e.response.data);
          throw new ForbiddenException(e.response.data.message);
        })
      )
    );

    return responseData;
  }

  async sendHttpFormRequest(path:string, formData: FormData, token: string): Promise<Observable<AxiosResponse<any>>> {
    const domain = this.configService.get<string>('nft.domain');
    const url = domain + path;
    
    // AxiosResponse<any>
    const options: AxiosRequestConfig = {
      headers: {
        //...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer ' + token
      },
      //data: formData
      //transformRequest:formData => formData
    };

    const responseData = await lastValueFrom (
      this.httpService.post(url, formData, options)
      .pipe(
        map((response) => {
          return response.data;
        })
      )
      .pipe(
        catchError((e) => {
          this.logger.error(e.response.data);
          throw new ForbiddenException(e.response.data.message);
        })
      )
    );

    return responseData;
  }
}

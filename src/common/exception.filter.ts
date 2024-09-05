import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    const res: any = exception.getResponse();
    const resultCode = res.statusCode;
    const resultMessage = res.message;

    console.log(exception);
    
    response
      .status(status)
      .json({resultCode, resultMessage});
  }
}
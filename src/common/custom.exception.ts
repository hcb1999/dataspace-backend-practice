import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode } from "./error.code";

export class CustomException extends HttpException  {
  constructor(statusCode: number) {
    const message = ErrorCode(statusCode);
    //const message = 'CustomException';
    super({statusCode, message}, statusCode);
  }
}
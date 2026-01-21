import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ConfirmEmailVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code: string;
}


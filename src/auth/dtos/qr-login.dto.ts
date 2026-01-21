import { IsEmail, IsNotEmpty } from 'class-validator';

export class CompleteQrLoginSessionDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}


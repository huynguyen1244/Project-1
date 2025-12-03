import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0(3|5|7|8|9)[0-9]{8})$/, {
    message:
      'Số điện thoại phải là 10 số và có các đầu số (03/05/07/08/09 + 8 kí tự)',
  })
  phone?: string;
}

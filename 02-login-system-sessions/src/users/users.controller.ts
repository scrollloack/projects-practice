import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() registerUserDto: Prisma.UserCreateInput) {
    return this.usersService.register(registerUserDto);
  }

  // login
}

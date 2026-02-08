import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from 'src/generated/prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async register(dto: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.databaseService.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }
}

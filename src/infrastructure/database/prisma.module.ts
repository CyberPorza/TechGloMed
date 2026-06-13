import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() means this module is registered once at the root and its
 * exports are available to all modules without re-importing.
 * PrismaService is stateful (holds the connection pool), so singleton
 * scope is correct and desired.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

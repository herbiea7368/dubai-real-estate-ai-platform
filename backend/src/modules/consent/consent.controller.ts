import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { RevokeConsentDto } from './dto/revoke-consent.dto';
import { BulkCheckConsentDto } from './dto/bulk-check-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import type { Request } from 'express';

@Controller('consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  async grantConsent(@Body() grantConsentDto: GrantConsentDto, @Req() req: Request) {
    const personId = (req.user as any).id;
    const ipAddress = req.ip || (req.connection as any)?.remoteAddress || 'unknown';

    return this.consentService.grantConsent(personId, grantConsentDto, ipAddress);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.CREATED)
  async revokeConsent(@Body() revokeConsentDto: RevokeConsentDto, @Req() req: Request) {
    const personId = (req.user as any).id;
    const ipAddress = req.ip || (req.connection as any)?.remoteAddress || 'unknown';

    return this.consentService.revokeConsent(personId, revokeConsentDto, ipAddress);
  }

  @Get('check/:consentType')
  @HttpCode(HttpStatus.OK)
  async checkConsent(@Param('consentType') consentType: string, @Req() req: Request) {
    const personId = (req.user as any).id;

    return this.consentService.checkConsent(personId, consentType);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getHistory(@Req() req: Request) {
    const personId = (req.user as any).id;

    return this.consentService.getConsentHistory(personId);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async getUserConsent(@Param('userId') userId: string) {
    return this.consentService.getConsentHistory(userId);
  }

  @Post('bulk-check')
  @HttpCode(HttpStatus.OK)
  async bulkCheckConsents(@Body() bulkCheckConsentDto: BulkCheckConsentDto, @Req() req: Request) {
    const personId = (req.user as any).id;

    return this.consentService.bulkCheckConsents(personId, bulkCheckConsentDto.consentTypes);
  }
}

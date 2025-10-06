import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PermitsService } from '../../modules/permits/permits.service';
import { Market } from '../../modules/permits/entities/permit.entity';

/**
 * Guard to validate RERA/DLD Trakheesi permits before listing publication
 *
 * Usage:
 * @Post('/listings/publish')
 * @UseGuards(JwtAuthGuard, PermitValidationGuard)
 * async publishListing(@Body() dto: PublishListingDto) { ... }
 *
 * Expected request body fields:
 * - trakheesiNumber: string
 * - market: 'Dubai' | 'Abu Dhabi'
 */
@Injectable()
export class PermitValidationGuard implements CanActivate {
  constructor(private readonly permitsService: PermitsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { trakheesiNumber, market } = request.body;

    if (!trakheesiNumber) {
      throw new BadRequestException('Trakheesi number is required for publication');
    }

    if (!market) {
      throw new BadRequestException('Market is required for permit validation');
    }

    // Validate market enum
    if (!Object.values(Market).includes(market)) {
      throw new BadRequestException(
        `Invalid market. Must be one of: ${Object.values(Market).join(', ')}`,
      );
    }

    // Check permit validity
    const result = await this.permitsService.checkPermit(trakheesiNumber, market as Market);

    if (!result.valid) {
      // Log validation attempt
      console.log(
        `[PermitValidationGuard] Blocked publication - Permit ${trakheesiNumber}: ${result.errors.join(', ')}`,
      );

      throw new ForbiddenException(
        `Cannot publish listing: ${result.errors.join(', ')}. Please ensure permit is valid and not expired.`,
      );
    }

    // Log successful validation
    console.log(
      `[PermitValidationGuard] Permit ${trakheesiNumber} validated successfully for publication`,
    );

    return true;
  }
}

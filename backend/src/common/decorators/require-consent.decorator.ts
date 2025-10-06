import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConsentService } from '../../modules/consent/consent.service';

export const CONSENT_KEY = 'required_consent';

/**
 * Decorator to require consent before executing a route handler
 * Usage: @RequireConsent('whatsapp')
 */
export const RequireConsent = (consentType: string) => SetMetadata(CONSENT_KEY, consentType);

/**
 * Guard to check consent before route execution
 * Automatically applied when @RequireConsent decorator is used
 */
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private consentService: ConsentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredConsentType = this.reflector.getAllAndOverride<string>(CONSENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredConsentType) {
      return true; // No consent required for this route
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const personId = user.id;

    // Check if user has granted consent
    const consentStatus = await this.consentService.checkConsent(personId, requiredConsentType);

    if (!consentStatus.granted) {
      // Log blocked attempt (will be enhanced with AuditLogService)
      console.log(
        `Consent blocked: User ${personId} attempted ${requiredConsentType} action without consent`,
      );

      throw new ForbiddenException({
        message: `Consent required for ${requiredConsentType} communication`,
        consentType: requiredConsentType,
        statusCode: 403,
      });
    }

    return true; // Consent granted, allow access
  }
}

/**
 * Combined decorator that applies both the metadata and the guard
 * Usage: @RequireConsentWithGuard('whatsapp')
 */
export const RequireConsentWithGuard = (consentType: string) =>
  applyDecorators(RequireConsent(consentType), UseGuards(ConsentGuard));

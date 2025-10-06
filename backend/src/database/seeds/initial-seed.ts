import { AppDataSource } from '../../data-source';
import { User, UserRole, UserLocale } from '../../modules/auth/entities/user.entity';
import { Consent, ConsentType } from '../../modules/consent/entities/consent.entity';
import {
  Permit,
  PermitType,
  Market,
  Issuer,
  PermitStatus,
} from '../../modules/permits/entities/permit.entity';
import {
  Property,
  PropertyType,
  PropertyPurpose,
  CompletionStatus,
} from '../../modules/properties/entities/property.entity';
import {
  Listing,
  ListingStatus,
  ListingLanguage,
  MediaType,
} from '../../modules/properties/entities/listing.entity';
import {
  Lead,
  LeadSource,
  LeadTier,
  LeadStatus,
  PropertyType as LeadPropertyType,
} from '../../modules/leads/entities/lead.entity';
import {
  LeadActivity,
  ActivityType,
} from '../../modules/leads/entities/lead-activity.entity';
import { MarketData } from '../../modules/valuations/entities/market-data.entity';
import { Valuation, ConfidenceLevel, ValuationMethod } from '../../modules/valuations/entities/valuation.entity';
import { AnalyticsEvent, EventType, DeviceType } from '../../modules/analytics/entities/analytics-event.entity';
import { FunnelStage, FunnelStageType } from '../../modules/analytics/entities/funnel-stage.entity';
import { Message, MessageChannel, MessageType, MessageStatus, MessageLanguage } from '../../modules/messaging/entities/message.entity';
import { MessageTemplate, TemplateCategory } from '../../modules/messaging/entities/message-template.entity';
import { Document, DocumentType, FileType, ProcessingStatus, DocumentLanguage } from '../../modules/documents/entities/document.entity';
import { ExtractedField, FieldType } from '../../modules/documents/entities/extracted-field.entity';
import { Payment, PaymentType, PaymentStatus, PaymentMethod, PaymentGateway } from '../../modules/payments/entities/payment.entity';
import { EscrowAccount, EscrowStatus } from '../../modules/payments/entities/escrow-account.entity';
import { InstallmentPlan, InstallmentFrequency, InstallmentPlanStatus } from '../../modules/payments/entities/installment-plan.entity';
import { ReportDefinition, ReportCategory, ReportType } from '../../modules/reports/entities/report-definition.entity';
import { hashPassword } from '../../common/utils/password.util';

/**
 * Initial Database Seed Script
 *
 * WARNING: This is for DEVELOPMENT ONLY
 * Creates test users and sample consent records for testing purposes
 *
 * Default password for all test users: TestPass123!
 */

async function seed() {
  try {
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    const userRepository = AppDataSource.getRepository(User);
    const consentRepository = AppDataSource.getRepository(Consent);
    const permitRepository = AppDataSource.getRepository(Permit);
    const propertyRepository = AppDataSource.getRepository(Property);
    const listingRepository = AppDataSource.getRepository(Listing);
    const leadRepository = AppDataSource.getRepository(Lead);
    const activityRepository = AppDataSource.getRepository(LeadActivity);
    const marketDataRepository = AppDataSource.getRepository(MarketData);
    const valuationRepository = AppDataSource.getRepository(Valuation);
    const analyticsEventRepository = AppDataSource.getRepository(AnalyticsEvent);
    const funnelStageRepository = AppDataSource.getRepository(FunnelStage);
    const messageRepository = AppDataSource.getRepository(Message);
    const templateRepository = AppDataSource.getRepository(MessageTemplate);
    const documentRepository = AppDataSource.getRepository(Document);
    const extractedFieldRepository = AppDataSource.getRepository(ExtractedField);
    const paymentRepository = AppDataSource.getRepository(Payment);
    const escrowRepository = AppDataSource.getRepository(EscrowAccount);
    const installmentRepository = AppDataSource.getRepository(InstallmentPlan);
    const reportDefinitionRepository = AppDataSource.getRepository(ReportDefinition);

    // Hash the default password for all test users
    const defaultPassword = 'TestPass123!';
    const hashedPassword = await hashPassword(defaultPassword);
    console.log('🔐 Default password hashed for test users');

    // Create test users for each role
    const testUsers = [
      {
        email: 'agent@test.com',
        phone: '+971501234567',
        name: 'Ahmed Al-Mansouri',
        locale: UserLocale.EN,
        roles: [UserRole.AGENT],
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
      {
        email: 'marketing@test.com',
        phone: '+971501234568',
        name: 'Fatima Hassan',
        locale: UserLocale.AR,
        roles: [UserRole.MARKETING],
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
      {
        email: 'compliance@test.com',
        phone: '+971501234569',
        name: 'Mohammed Khalid',
        locale: UserLocale.EN,
        roles: [UserRole.COMPLIANCE],
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
      {
        email: 'buyer@test.com',
        phone: '+971501234570',
        name: 'Sarah Johnson',
        locale: UserLocale.EN,
        roles: [UserRole.BUYER],
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
      },
      {
        email: 'buyer2@test.com',
        phone: '+971501234571',
        name: 'Ali Rahman',
        locale: UserLocale.AR,
        roles: [UserRole.BUYER],
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
      },
    ];

    console.log('🌱 Seeding users...');
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`  ⏭️  User ${userData.email} already exists, skipping...`);
        createdUsers.push(existingUser);
      } else {
        const user = userRepository.create(userData);
        const savedUser = await userRepository.save(user);
        console.log(`  ✅ Created user: ${savedUser.email} (${savedUser.roles.join(', ')})`);
        createdUsers.push(savedUser);
      }
    }

    // Create sample consent records
    console.log('🌱 Seeding consent records...');
    const consentData = [
      // Buyer 1 consents
      {
        personId: createdUsers[3].id,
        consentType: ConsentType.EMAIL,
        granted: true,
        ipAddress: '192.168.1.100',
        version: '1.0',
        termsUrl: 'https://example.com/privacy-policy',
        metadata: { channel: 'web', userAgent: 'Mozilla/5.0' },
      },
      {
        personId: createdUsers[3].id,
        consentType: ConsentType.WHATSAPP,
        granted: true,
        ipAddress: '192.168.1.100',
        version: '1.0',
        termsUrl: 'https://example.com/privacy-policy',
        metadata: { channel: 'web' },
      },
      {
        personId: createdUsers[3].id,
        consentType: ConsentType.SMS,
        granted: false,
        ipAddress: '192.168.1.100',
        version: '1.0',
        termsUrl: 'https://example.com/privacy-policy',
        metadata: { channel: 'web' },
      },
      // Buyer 2 consents
      {
        personId: createdUsers[4].id,
        consentType: ConsentType.EMAIL,
        granted: true,
        ipAddress: '192.168.1.101',
        version: '1.0',
        termsUrl: 'https://example.com/privacy-policy',
        metadata: { channel: 'mobile_app' },
      },
      {
        personId: createdUsers[4].id,
        consentType: ConsentType.PHONE,
        granted: true,
        ipAddress: '192.168.1.101',
        version: '1.0',
        termsUrl: 'https://example.com/privacy-policy',
        metadata: { channel: 'mobile_app' },
      },
    ];

    for (const consentItem of consentData) {
      const existingConsent = await consentRepository.findOne({
        where: {
          personId: consentItem.personId,
          consentType: consentItem.consentType,
        },
      });

      if (existingConsent) {
        console.log(
          `  ⏭️  Consent record for user ${consentItem.personId} (${consentItem.consentType}) already exists, skipping...`,
        );
      } else {
        const consent = consentRepository.create(consentItem);
        await consentRepository.save(consent);
        console.log(
          `  ✅ Created consent: ${consentItem.consentType} (${consentItem.granted ? 'granted' : 'revoked'}) for user ${consentItem.personId}`,
        );
      }
    }

    // Create sample permits
    console.log('🌱 Seeding permits...');
    const now = new Date();
    const permitData = [
      // Valid permit 1 (Dubai, expires in 6 months)
      {
        trakheesiNumber: 'DLD-2024-12345',
        permitType: PermitType.LISTING,
        market: Market.DUBAI,
        issuer: Issuer.DLD,
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        status: PermitStatus.VALID,
        validationHistory: [],
      },
      // Valid permit 2 (Abu Dhabi, expires in 3 months)
      {
        trakheesiNumber: 'ADREC-2024-67890',
        permitType: PermitType.BROKER,
        market: Market.ABU_DHABI,
        issuer: Issuer.ADREC,
        issueDate: new Date('2024-02-01'),
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        status: PermitStatus.VALID,
        validationHistory: [],
      },
      // Expired permit (Dubai)
      {
        trakheesiNumber: 'RERA-2023-54321',
        permitType: PermitType.ADVERTISEMENT,
        market: Market.DUBAI,
        issuer: Issuer.RERA,
        issueDate: new Date('2023-01-01'),
        expiryDate: new Date('2023-12-31'),
        status: PermitStatus.EXPIRED,
        validationHistory: [],
      },
      // Permit expiring in 15 days (Dubai, for testing alerts)
      {
        trakheesiNumber: 'DLD-2024-98765',
        permitType: PermitType.LISTING,
        market: Market.DUBAI,
        issuer: Issuer.DLD,
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: PermitStatus.VALID,
        validationHistory: [],
      },
      // Valid permit for Abu Dhabi market (ADGM issuer)
      {
        trakheesiNumber: 'ADGM-2024-11111',
        permitType: PermitType.BROKER,
        market: Market.ABU_DHABI,
        issuer: Issuer.ADGM,
        issueDate: new Date('2024-03-01'),
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: PermitStatus.VALID,
        validationHistory: [],
      },
    ];

    for (const permitItem of permitData) {
      const existingPermit = await permitRepository.findOne({
        where: { trakheesiNumber: permitItem.trakheesiNumber },
      });

      if (existingPermit) {
        console.log(`  ⏭️  Permit ${permitItem.trakheesiNumber} already exists, skipping...`);
      } else {
        const permit = permitRepository.create(permitItem);
        await permitRepository.save(permit);
        console.log(
          `  ✅ Created permit: ${permitItem.trakheesiNumber} (${permitItem.market}, ${permitItem.status})`,
        );
      }
    }

    // Fetch created permits for listings
    const permits = await permitRepository.find();

    // Create sample properties
    console.log('🌱 Seeding properties...');
    const propertyData = [
      {
        type: PropertyType.PENTHOUSE,
        purpose: PropertyPurpose.SALE,
        community: 'Palm Jumeirah',
        subCommunity: 'Golden Mile',
        developer: 'Nakheel',
        bedrooms: 4,
        bathrooms: 5.5,
        areaSqft: 6500,
        priceAed: 25000000,
        completionStatus: CompletionStatus.READY,
        amenities: ['Private Pool', 'Beach Access', 'Maid Room', 'Study', 'Sea View'],
        location: { lat: 25.1124, lng: 55.139 },
        address: { street: 'Palm West Beach', building: 'Tiara Residences', area: 'Palm Jumeirah' },
        agentId: createdUsers[0].id,
      },
      {
        type: PropertyType.APARTMENT,
        purpose: PropertyPurpose.RENT,
        community: 'Downtown Dubai',
        subCommunity: 'Burj Khalifa District',
        developer: 'Emaar',
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        priceAed: 120000,
        completionStatus: CompletionStatus.READY,
        amenities: ['Gym', 'Pool', 'Parking', 'Burj View'],
        location: { lat: 25.1972, lng: 55.2744 },
        address: { building: 'Boulevard Point', area: 'Downtown Dubai' },
        agentId: createdUsers[0].id,
      },
      {
        type: PropertyType.VILLA,
        purpose: PropertyPurpose.SALE,
        community: 'Jumeirah Village Circle',
        developer: 'Nshama',
        bedrooms: 5,
        bathrooms: 6,
        areaSqft: 4500,
        priceAed: 4800000,
        completionStatus: CompletionStatus.READY,
        amenities: ['Private Garden', 'Maid Room', 'Driver Room', 'Private Pool', 'Smart Home'],
        location: { lat: 25.0543, lng: 55.2066 },
        address: { area: 'JVC District 13' },
        agentId: createdUsers[0].id,
      },
      {
        type: PropertyType.APARTMENT,
        purpose: PropertyPurpose.SALE,
        community: 'Dubai Marina',
        subCommunity: 'Marina Promenade',
        developer: 'Emaar',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 2100,
        priceAed: 3200000,
        completionStatus: CompletionStatus.READY,
        amenities: ['Marina View', 'Balcony', 'Gym', 'Pool', 'Concierge'],
        location: { lat: 25.0764, lng: 55.1399 },
        address: { building: 'Botanica Tower', area: 'Dubai Marina' },
        agentId: createdUsers[0].id,
      },
      {
        type: PropertyType.TOWNHOUSE,
        purpose: PropertyPurpose.RENT,
        community: 'Business Bay',
        developer: 'Damac',
        bedrooms: 3,
        bathrooms: 4,
        areaSqft: 2500,
        priceAed: 180000,
        completionStatus: CompletionStatus.OFF_PLAN,
        handoverDate: new Date('2025-12-31'),
        amenities: ['Community Pool', 'Gym', 'Parking', 'Pet Friendly'],
        location: { lat: 25.1867, lng: 55.2631 },
        address: { area: 'Business Bay' },
        agentId: createdUsers[0].id,
      },
    ];

    const createdProperties = [];
    for (const propData of propertyData) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
      const referenceNumber = `PROP-${year}-${random}`;

      const property = propertyRepository.create({
        ...propData,
        referenceNumber,
      });
      const savedProperty = await propertyRepository.save(property);
      console.log(
        `  ✅ Created property: ${savedProperty.referenceNumber} (${savedProperty.community})`,
      );
      createdProperties.push(savedProperty);
    }

    // Create sample listings
    console.log('🌱 Seeding listings...');
    const listingData = [
      {
        propertyId: createdProperties[0].id,
        permitId: permits[0]?.id,
        titleEn: 'Luxury 4BR Penthouse on Palm Jumeirah with Private Pool',
        titleAr: 'بنتهاوس فاخر 4 غرف نوم في نخلة جميرا مع مسبح خاص',
        descriptionEn:
          'Experience ultimate luxury in this stunning 4-bedroom penthouse located on the prestigious Palm Jumeirah. This exquisite property features panoramic sea views, a private pool, and direct beach access. The residence boasts high-end finishes throughout, including marble flooring, designer kitchen with Miele appliances, and smart home automation. Perfect for those seeking an exclusive beachfront lifestyle.',
        descriptionAr:
          'استمتع بالرفاهية المطلقة في هذا البنتهاوس المذهل المكون من 4 غرف نوم الواقع في نخلة جميرا المرموقة. تتميز هذه الوحدة الرائعة بإطلالات بانورامية على البحر ومسبح خاص ووصول مباشر للشاطئ.',
        features: [
          'Sea View',
          'Private Pool',
          'Beach Access',
          'Smart Home',
          'Maid Room',
          'Study Room',
        ],
        language: ListingLanguage.BOTH,
        mediaUrls: [
          {
            url: 'https://images.example.com/palm-penthouse-1.jpg',
            type: MediaType.IMAGE,
            order: 1,
          },
          {
            url: 'https://images.example.com/palm-penthouse-tour.mp4',
            type: MediaType.VIDEO,
            order: 2,
          },
        ],
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedChannels: ['website', 'bayut', 'dubizzle'],
        createdBy: createdUsers[0].id,
        badges: ['exclusive', 'verified'],
      },
      {
        propertyId: createdProperties[1].id,
        permitId: permits[1]?.id,
        titleEn: 'Modern 2BR Apartment in Downtown Dubai with Burj View',
        titleAr: 'شقة عصرية من غرفتي نوم في وسط دبي مع إطلالة على برج خليفة',
        descriptionEn:
          'Discover this beautifully appointed 2-bedroom apartment in the heart of Downtown Dubai. Enjoy stunning views of the Burj Khalifa from your living room. Features include contemporary design, open-plan kitchen, and access to world-class amenities including gym, pool, and 24/7 concierge services.',
        descriptionAr:
          'اكتشف هذه الشقة الجميلة المكونة من غرفتي نوم في قلب وسط دبي. استمتع بإطلالات خلابة على برج خليفة من غرفة المعيشة الخاصة بك.',
        features: ['Burj View', 'Gym', 'Pool', 'Concierge', 'Parking'],
        language: ListingLanguage.BOTH,
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedChannels: ['website', 'bayut'],
        createdBy: createdUsers[0].id,
        badges: ['hot_deal'],
      },
      {
        propertyId: createdProperties[2].id,
        permitId: permits[3]?.id,
        titleEn: 'Spacious 5BR Villa in JVC with Private Pool and Garden',
        titleAr: 'فيلا واسعة 5 غرف نوم في جي في سي مع مسبح وحديقة خاصة',
        descriptionEn:
          'This magnificent 5-bedroom villa in Jumeirah Village Circle offers the perfect family home. Features include a private pool, landscaped garden, maid and driver rooms, and smart home technology. The villa is designed with modern architecture and premium finishes.',
        descriptionAr:
          'تقدم هذه الفيلا الرائعة المكونة من 5 غرف نوم في قرية جميرا الدائرية منزل العائلة المثالي.',
        features: ['Private Pool', 'Garden', 'Maid Room', 'Driver Room', 'Smart Home'],
        language: ListingLanguage.BOTH,
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedChannels: ['website', 'pf'],
        createdBy: createdUsers[0].id,
        badges: ['new_launch'],
      },
      {
        propertyId: createdProperties[3].id,
        titleEn: '3BR Marina View Apartment in Dubai Marina',
        titleAr: 'شقة 3 غرف نوم مطلة على المارينا في دبي مارينا',
        descriptionEn:
          'Draft listing for a beautiful 3-bedroom apartment with stunning marina views.',
        descriptionAr: 'قائمة مسودة لشقة جميلة مكونة من 3 غرف نوم مع إطلالات خلابة على المارينا.',
        features: ['Marina View', 'Balcony', 'Gym'],
        language: ListingLanguage.BOTH,
        status: ListingStatus.DRAFT,
        createdBy: createdUsers[0].id,
      },
      {
        propertyId: createdProperties[4].id,
        titleEn: 'Off-Plan 3BR Townhouse in Business Bay',
        titleAr: 'تاون هاوس قيد الإنشاء 3 غرف نوم في الخليج التجاري',
        descriptionEn: 'Draft listing for off-plan townhouse.',
        descriptionAr: 'قائمة مسودة لتاون هاوس قيد الإنشاء.',
        features: ['Off-Plan', 'Community Pool'],
        language: ListingLanguage.BOTH,
        status: ListingStatus.DRAFT,
        createdBy: createdUsers[0].id,
      },
    ];

    for (const listingItem of listingData) {
      const listing = listingRepository.create(listingItem as any) as unknown as Listing;
      const savedListing = await listingRepository.save(listing);
      console.log(
        `  ✅ Created listing: ${savedListing.titleEn.substring(0, 50)}... (${savedListing.status})`,
      );
    }

    // Create sample leads
    console.log('🌱 Seeding leads...');
    const leadData = [
      // HOT LEADS (score >= 0.7)
      {
        firstName: 'Ahmed',
        lastName: 'Al-Maktoum',
        email: 'ahmed.maktoum@example.ae',
        phone: '+971501111111',
        countryCode: '+971',
        source: LeadSource.WEBSITE,
        budget: { min: 3000000, max: 5000000, currency: 'AED' },
        preferredCommunities: ['Palm Jumeirah', 'Emirates Hills'],
        preferredPropertyType: LeadPropertyType.VILLA,
        interestedInOffPlan: false,
        investorProfile: true,
        visaEligibilityInterest: false,
        status: LeadStatus.CONTACTED,
        assignedToAgentId: createdUsers[0].id,
        score: 0.85,
        tier: LeadTier.HOT,
        propertyInterests: [{ propertyId: createdProperties[0].id, community: 'Palm Jumeirah' }],
        scoringFeatures: { budgetScore: 1.0, sourceScore: 1.0, engagementScore: 0.8, responseScore: 0.5, completenessScore: 1.0 },
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@example.com',
        phone: '+971502222222',
        countryCode: '+971',
        source: LeadSource.REFERRAL,
        budget: { min: 4000000, max: 7000000, currency: 'AED' },
        preferredCommunities: ['Downtown Dubai', 'Dubai Marina'],
        preferredPropertyType: LeadPropertyType.PENTHOUSE,
        interestedInOffPlan: true,
        investorProfile: false,
        visaEligibilityInterest: true,
        status: LeadStatus.QUALIFIED,
        assignedToAgentId: createdUsers[0].id,
        score: 0.92,
        tier: LeadTier.HOT,
        propertyInterests: [{ propertyId: createdProperties[0].id, community: 'Palm Jumeirah' }],
        scoringFeatures: { budgetScore: 1.0, sourceScore: 0.9, engagementScore: 1.0, responseScore: 0.5, completenessScore: 1.0 },
      },
      {
        firstName: 'Rashid',
        lastName: 'Al-Falasi',
        email: 'rashid.falasi@example.ae',
        phone: '+971503333333',
        countryCode: '+971',
        source: LeadSource.WEBSITE,
        campaign: 'luxury_homes_2024',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'palm_jumeirah',
        budget: { min: 2500000, max: 4000000, currency: 'AED' },
        preferredCommunities: ['Palm Jumeirah', 'Jumeirah Beach Residence'],
        preferredPropertyType: LeadPropertyType.APARTMENT,
        interestedInOffPlan: false,
        investorProfile: true,
        status: LeadStatus.NEW,
        score: 0.78,
        tier: LeadTier.HOT,
        scoringFeatures: { budgetScore: 0.9, sourceScore: 1.0, engagementScore: 0.7, responseScore: 0.5, completenessScore: 1.0 },
      },
      // WARM LEADS (score 0.4-0.7)
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+971504444444',
        countryCode: '+971',
        source: LeadSource.BAYUT,
        budget: { min: 800000, max: 1200000, currency: 'AED' },
        preferredCommunities: ['JVC', 'Dubai Sports City'],
        preferredPropertyType: LeadPropertyType.APARTMENT,
        interestedInOffPlan: false,
        investorProfile: false,
        status: LeadStatus.CONTACTED,
        assignedToAgentId: createdUsers[0].id,
        score: 0.55,
        tier: LeadTier.WARM,
        scoringFeatures: { budgetScore: 0.5, sourceScore: 0.7, engagementScore: 0.5, responseScore: 0.5, completenessScore: 0.83 },
      },
      {
        firstName: 'Fatima',
        lastName: 'Hassan',
        email: 'fatima.hassan@example.ae',
        phone: '+971505555555',
        countryCode: '+971',
        source: LeadSource.DUBIZZLE,
        budget: { min: 1500000, max: 2500000, currency: 'AED' },
        preferredCommunities: ['Arabian Ranches', 'Dubai Hills Estate'],
        preferredPropertyType: LeadPropertyType.VILLA,
        interestedInOffPlan: true,
        investorProfile: false,
        visaEligibilityInterest: true,
        status: LeadStatus.NURTURE,
        score: 0.62,
        tier: LeadTier.WARM,
        scoringFeatures: { budgetScore: 0.7, sourceScore: 0.7, engagementScore: 0.7, responseScore: 0.5, completenessScore: 0.83 },
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phone: '+971506666666',
        countryCode: '+971',
        source: LeadSource.PF,
        budget: { min: 1000000, max: 1800000, currency: 'AED' },
        preferredCommunities: ['Business Bay', 'DIFC'],
        preferredPropertyType: LeadPropertyType.APARTMENT,
        interestedInOffPlan: false,
        investorProfile: true,
        status: LeadStatus.NEW,
        score: 0.58,
        tier: LeadTier.WARM,
        scoringFeatures: { budgetScore: 0.7, sourceScore: 0.7, engagementScore: 0.5, responseScore: 0.5, completenessScore: 0.83 },
      },
      {
        firstName: 'Layla',
        lastName: 'Ahmed',
        email: 'layla.ahmed@example.ae',
        phone: '+971507777777',
        countryCode: '+971',
        source: LeadSource.WALK_IN,
        budget: { min: 600000, max: 900000, currency: 'AED' },
        preferredCommunities: ['International City', 'Discovery Gardens'],
        preferredPropertyType: LeadPropertyType.APARTMENT,
        interestedInOffPlan: false,
        investorProfile: false,
        status: LeadStatus.CONTACTED,
        score: 0.48,
        tier: LeadTier.WARM,
        scoringFeatures: { budgetScore: 0.5, sourceScore: 0.6, engagementScore: 0.3, responseScore: 0.5, completenessScore: 0.83 },
      },
      // COLD LEADS (score < 0.4)
      {
        firstName: 'David',
        lastName: 'Chen',
        email: 'david.chen@example.com',
        phone: '+971508888888',
        countryCode: '+971',
        source: LeadSource.FACEBOOK,
        budget: { min: 300000, max: 500000, currency: 'AED' },
        preferredCommunities: ['International City'],
        interestedInOffPlan: false,
        investorProfile: false,
        status: LeadStatus.NEW,
        score: 0.32,
        tier: LeadTier.COLD,
        scoringFeatures: { budgetScore: 0.3, sourceScore: 0.5, engagementScore: 0.3, responseScore: 0.5, completenessScore: 0.67 },
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@example.com',
        phone: '+971509999999',
        countryCode: '+971',
        source: LeadSource.INSTAGRAM,
        budget: { min: 400000, max: 600000, currency: 'AED' },
        interestedInOffPlan: true,
        investorProfile: false,
        status: LeadStatus.NEW,
        score: 0.36,
        tier: LeadTier.COLD,
        scoringFeatures: { budgetScore: 0.3, sourceScore: 0.5, engagementScore: 0.5, responseScore: 0.5, completenessScore: 0.5 },
      },
      {
        firstName: 'Omar',
        lastName: 'Abdullah',
        email: 'omar.abdullah@example.ae',
        phone: '+971501010101',
        countryCode: '+971',
        source: LeadSource.CALL,
        budget: { min: 250000, max: 400000, currency: 'AED' },
        status: LeadStatus.LOST,
        score: 0.28,
        tier: LeadTier.COLD,
        scoringFeatures: { budgetScore: 0.3, sourceScore: 0.6, engagementScore: 0.3, responseScore: 0.5, completenessScore: 0.33 },
      },
    ];

    const createdLeads = [];
    for (const leadItem of leadData) {
      const existingLead = await leadRepository.findOne({
        where: { email: leadItem.email },
      });

      if (existingLead) {
        console.log(`  ⏭️  Lead ${leadItem.email} already exists, skipping...`);
        createdLeads.push(existingLead);
      } else {
        const lead = leadRepository.create(leadItem);
        const savedLead = await leadRepository.save(lead);
        console.log(
          `  ✅ Created lead: ${savedLead.firstName} ${savedLead.lastName} (${savedLead.tier}, score: ${savedLead.score})`,
        );
        createdLeads.push(savedLead);
      }
    }

    // Create sample lead activities
    console.log('🌱 Seeding lead activities...');
    const activityData = [
      // Activities for hot lead 1
      {
        leadId: createdLeads[0].id,
        activityType: ActivityType.LEAD_CREATED,
        details: { source: LeadSource.WEBSITE },
        performedBy: null,
      },
      {
        leadId: createdLeads[0].id,
        activityType: ActivityType.CALL_MADE,
        details: { duration: '15 minutes', outcome: 'Interested in Palm properties' },
        performedBy: createdUsers[0].id,
      },
      {
        leadId: createdLeads[0].id,
        activityType: ActivityType.PROPERTY_VIEWED,
        details: { propertyId: createdProperties[0].id, duration: '45 minutes' },
        performedBy: createdUsers[0].id,
      },
      // Activities for hot lead 2
      {
        leadId: createdLeads[1].id,
        activityType: ActivityType.LEAD_CREATED,
        details: { source: LeadSource.REFERRAL },
        performedBy: null,
      },
      {
        leadId: createdLeads[1].id,
        activityType: ActivityType.EMAIL_SENT,
        details: { subject: 'Luxury Penthouses in Dubai' },
        performedBy: createdUsers[0].id,
      },
      {
        leadId: createdLeads[1].id,
        activityType: ActivityType.EMAIL_OPENED,
        details: { openedAt: new Date() },
        performedBy: null,
      },
      {
        leadId: createdLeads[1].id,
        activityType: ActivityType.MEETING_SCHEDULED,
        details: { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), location: 'Office' },
        performedBy: createdUsers[0].id,
      },
      // Activities for warm lead
      {
        leadId: createdLeads[3].id,
        activityType: ActivityType.LEAD_CREATED,
        details: { source: LeadSource.BAYUT },
        performedBy: null,
      },
      {
        leadId: createdLeads[3].id,
        activityType: ActivityType.WHATSAPP_SENT,
        details: { message: 'Hello! I saw your interest in JVC properties' },
        performedBy: createdUsers[0].id,
      },
      // Activities for cold lead
      {
        leadId: createdLeads[7].id,
        activityType: ActivityType.LEAD_CREATED,
        details: { source: LeadSource.FACEBOOK },
        performedBy: null,
      },
    ];

    for (const activityItem of activityData) {
      const activity = activityRepository.create(activityItem);
      await activityRepository.save(activity);
      console.log(
        `  ✅ Created activity: ${activityItem.activityType} for lead ${activityItem.leadId.substring(0, 8)}...`,
      );
    }

    // Create market data for major communities
    console.log('🌱 Seeding market data...');
    const today = new Date();
    const marketDataItems = [
      // Palm Jumeirah
      {
        community: 'Palm Jumeirah',
        propertyType: PropertyType.APARTMENT,
        avgPriceSqft: 2500,
        avgRentSqft: 150,
        transactionCount: 45,
        priceChangeYoY: 8.5,
        dataDate: today,
        source: 'DLD',
      },
      {
        community: 'Palm Jumeirah',
        propertyType: PropertyType.VILLA,
        avgPriceSqft: 3200,
        avgRentSqft: 180,
        transactionCount: 28,
        priceChangeYoY: 10.2,
        dataDate: today,
        source: 'DLD',
      },
      // Downtown Dubai
      {
        community: 'Downtown Dubai',
        propertyType: PropertyType.APARTMENT,
        avgPriceSqft: 2200,
        avgRentSqft: 140,
        transactionCount: 78,
        priceChangeYoY: 7.3,
        dataDate: today,
        source: 'DLD',
      },
      {
        community: 'Downtown Dubai',
        propertyType: PropertyType.PENTHOUSE,
        avgPriceSqft: 2800,
        avgRentSqft: 160,
        transactionCount: 12,
        priceChangeYoY: 9.1,
        dataDate: today,
        source: 'DLD',
      },
      // Dubai Marina
      {
        community: 'Dubai Marina',
        propertyType: PropertyType.APARTMENT,
        avgPriceSqft: 1900,
        avgRentSqft: 130,
        transactionCount: 95,
        priceChangeYoY: 6.8,
        dataDate: today,
        source: 'DLD',
      },
      // JVC (Jumeirah Village Circle)
      {
        community: 'Jumeirah Village Circle',
        propertyType: PropertyType.APARTMENT,
        avgPriceSqft: 1100,
        avgRentSqft: 85,
        transactionCount: 142,
        priceChangeYoY: 5.2,
        dataDate: today,
        source: 'internal',
      },
      {
        community: 'Jumeirah Village Circle',
        propertyType: PropertyType.VILLA,
        avgPriceSqft: 1300,
        avgRentSqft: 95,
        transactionCount: 56,
        priceChangeYoY: 6.1,
        dataDate: today,
        source: 'internal',
      },
      // Business Bay
      {
        community: 'Business Bay',
        propertyType: PropertyType.APARTMENT,
        avgPriceSqft: 1700,
        avgRentSqft: 120,
        transactionCount: 112,
        priceChangeYoY: 5.9,
        dataDate: today,
        source: 'DLD',
      },
    ];

    for (const item of marketDataItems) {
      const marketData = marketDataRepository.create(item);
      await marketDataRepository.save(marketData);
      console.log(
        `  ✅ Created market data: ${item.community} - ${item.propertyType} (${item.avgPriceSqft} AED/sqft)`,
      );
    }

    // Create sample valuations for some properties
    console.log('🌱 Seeding valuations...');
    const valuationData = [
      // Valuation for Palm Jumeirah penthouse
      {
        propertyId: createdProperties[0].id,
        estimatedValueAed: 15750000,
        confidenceLowAed: 14500000,
        confidenceHighAed: 17000000,
        confidenceLevel: ConfidenceLevel.HIGH,
        valuationMethod: ValuationMethod.COMPARATIVE,
        comparableProperties: [
          { propertyId: 'comp-1', similarityScore: 0.92, price: 15500000, adjustedPrice: 15600000 },
          { propertyId: 'comp-2', similarityScore: 0.88, price: 16200000, adjustedPrice: 15900000 },
          { propertyId: 'comp-3', similarityScore: 0.85, price: 15100000, adjustedPrice: 15700000 },
        ],
        features: {
          locationScore: 1.0,
          sizeScore: 0.92,
          amenityScore: 0.85,
          ageScore: 0.9,
          viewScore: 1.0,
        },
        marketFactors: {
          avgPriceSqft: 2500,
          marketTrend: 'up',
          transactionVolume: 45,
        },
        pricePerSqft: 2500,
        estimatedRentAed: 850000,
        grossYieldPct: 5.4,
        mae: 8.5,
        requestedBy: createdUsers[0].id,
      },
      // Valuation for Downtown apartment
      {
        propertyId: createdProperties[1].id,
        estimatedValueAed: 2420000,
        confidenceLowAed: 2200000,
        confidenceHighAed: 2650000,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        valuationMethod: ValuationMethod.COMPARATIVE,
        comparableProperties: [
          { propertyId: 'comp-4', similarityScore: 0.78, price: 2380000, adjustedPrice: 2400000 },
          { propertyId: 'comp-5', similarityScore: 0.72, price: 2500000, adjustedPrice: 2450000 },
        ],
        features: {
          locationScore: 0.95,
          sizeScore: 0.65,
          amenityScore: 0.70,
          ageScore: 1.0,
        },
        marketFactors: {
          avgPriceSqft: 2200,
          marketTrend: 'up',
          transactionVolume: 78,
        },
        pricePerSqft: 2200,
        estimatedRentAed: 160000,
        grossYieldPct: 6.6,
        mae: 11.2,
        requestedBy: createdUsers[0].id,
      },
      // Valuation for JVC villa
      {
        propertyId: createdProperties[2].id,
        estimatedValueAed: 4550000,
        confidenceLowAed: 4200000,
        confidenceHighAed: 4900000,
        confidenceLevel: ConfidenceLevel.HIGH,
        valuationMethod: ValuationMethod.COMPARATIVE,
        comparableProperties: [
          { propertyId: 'comp-6', similarityScore: 0.89, price: 4480000, adjustedPrice: 4520000 },
          { propertyId: 'comp-7', similarityScore: 0.87, price: 4600000, adjustedPrice: 4580000 },
          { propertyId: 'comp-8', similarityScore: 0.83, price: 4420000, adjustedPrice: 4550000 },
        ],
        features: {
          locationScore: 0.70,
          sizeScore: 0.88,
          amenityScore: 0.92,
          ageScore: 1.0,
        },
        marketFactors: {
          avgPriceSqft: 1300,
          marketTrend: 'up',
          transactionVolume: 56,
        },
        pricePerSqft: 1300,
        estimatedRentAed: 340000,
        grossYieldPct: 7.5,
        mae: 9.3,
        requestedBy: createdUsers[0].id,
      },
    ];

    for (const item of valuationData) {
      const valuation = valuationRepository.create(item);
      await valuationRepository.save(valuation);
      console.log(
        `  ✅ Created valuation: Property ${item.propertyId.substring(0, 8)}... - ${item.estimatedValueAed.toLocaleString()} AED (${item.confidenceLevel})`,
      );
    }

    // Create analytics events and funnel stages
    console.log('🌱 Seeding analytics events and funnel stages...');

    // Generate 10 unique session IDs
    const sessionIds = Array.from({ length: 10 }, (_, i) => `session-${Date.now()}-${i}`);

    // Create events spread across last 30 days
    const deviceTypes = [DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP];
    const sources = ['google', 'facebook', 'direct', 'instagram', 'bayut'];

    let eventCount = 0;
    let funnelCount = 0;
    const createdListings = await listingRepository.find();

    for (let i = 0; i < sessionIds.length; i++) {
      const sessionId = sessionIds[i];
      const userId = i < 5 ? createdUsers[3].id : createdUsers[4].id; // Mix of buyers
      const deviceType = deviceTypes[i % 3];
      const source = sources[i % 5];

      // Randomize timestamp within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const sessionStart = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // 1. Start with search event
      const searchEvent = analyticsEventRepository.create({
        eventType: EventType.SEARCH,
        sessionId,
        userId,
        deviceType,
        userAgent: `Mozilla/5.0 (${deviceType === DeviceType.MOBILE ? 'Mobile' : 'Desktop'})`,
        ipAddress: `192.168.1.${100 + i}`,
        eventData: {
          filters: { bedrooms: [2, 3], priceRange: [1000000, 3000000] },
          resultsCount: 15,
          source,
        },
        timestamp: new Date(sessionStart.getTime() + 1000),
      });
      await analyticsEventRepository.save(searchEvent);
      eventCount++;

      // Create search funnel stage
      const searchStage = funnelStageRepository.create({
        sessionId,
        stage: FunnelStageType.SEARCH,
        enteredAt: searchEvent.timestamp,
      });
      const savedSearchStage = await funnelStageRepository.save(searchStage);
      funnelCount++;

      // 2. Add 2-3 listing clicks
      const listingCount = 2 + (i % 2);
      for (let j = 0; j < listingCount; j++) {
        const property = createdProperties[j % createdProperties.length];
        const listing = createdListings[j % createdListings.length];

        const listingEvent = analyticsEventRepository.create({
          eventType: EventType.LISTING_CLICK,
          sessionId,
          userId,
          propertyId: property.id,
          listingId: listing.id,
          deviceType,
          userAgent: searchEvent.userAgent,
          ipAddress: searchEvent.ipAddress,
          timestamp: new Date(sessionStart.getTime() + (j + 2) * 1000),
        });
        await analyticsEventRepository.save(listingEvent);
        eventCount++;
      }

      // Update search stage and create listing stage
      savedSearchStage.exitedAt = new Date(sessionStart.getTime() + 3000);
      savedSearchStage.timeInStageSeconds = 2;
      savedSearchStage.convertedToNextStage = true;
      await funnelStageRepository.save(savedSearchStage);

      const listingStage = funnelStageRepository.create({
        sessionId,
        stage: FunnelStageType.LISTING,
        previousStageId: savedSearchStage.id,
        enteredAt: new Date(sessionStart.getTime() + 3000),
      });
      const savedListingStage = await funnelStageRepository.save(listingStage);
      funnelCount++;

      // 3. Add 1-2 property views (detail page)
      const viewCount = 1 + (i % 2);
      for (let j = 0; j < viewCount; j++) {
        const property = createdProperties[j % createdProperties.length];
        const listing = createdListings[j % createdListings.length];

        const viewEvent = analyticsEventRepository.create({
          eventType: EventType.PROPERTY_VIEW,
          sessionId,
          userId,
          propertyId: property.id,
          listingId: listing.id,
          deviceType,
          userAgent: searchEvent.userAgent,
          ipAddress: searchEvent.ipAddress,
          timestamp: new Date(sessionStart.getTime() + (4 + j) * 1000),
        });
        await analyticsEventRepository.save(viewEvent);
        eventCount++;
      }

      // Update listing stage and create detail stage
      savedListingStage.exitedAt = new Date(sessionStart.getTime() + 5000);
      savedListingStage.timeInStageSeconds = 2;
      savedListingStage.convertedToNextStage = true;
      await funnelStageRepository.save(savedListingStage);

      const detailStage = funnelStageRepository.create({
        sessionId,
        stage: FunnelStageType.DETAIL,
        propertyId: createdProperties[i % createdProperties.length].id,
        listingId: createdListings[i % createdListings.length].id,
        previousStageId: savedListingStage.id,
        enteredAt: new Date(sessionStart.getTime() + 5000),
      });
      const savedDetailStage = await funnelStageRepository.save(detailStage);
      funnelCount++;

      // 4. 50% of sessions add contact event
      if (i % 2 === 0) {
        const property = createdProperties[i % createdProperties.length];
        const listing = createdListings[i % createdListings.length];
        const contactTypes = [EventType.WHATSAPP_CLICK, EventType.CALL_CLICK, EventType.EMAIL_CLICK];
        const contactType = contactTypes[i % 3];

        const contactEvent = analyticsEventRepository.create({
          eventType: contactType,
          sessionId,
          userId,
          propertyId: property.id,
          listingId: listing.id,
          deviceType,
          userAgent: searchEvent.userAgent,
          ipAddress: searchEvent.ipAddress,
          timestamp: new Date(sessionStart.getTime() + 6000),
        });
        await analyticsEventRepository.save(contactEvent);
        eventCount++;

        // Update detail stage and create contact stage
        savedDetailStage.exitedAt = new Date(sessionStart.getTime() + 6000);
        savedDetailStage.timeInStageSeconds = 1;
        savedDetailStage.convertedToNextStage = true;
        await funnelStageRepository.save(savedDetailStage);

        const contactStage = funnelStageRepository.create({
          sessionId,
          stage: FunnelStageType.CONTACT,
          propertyId: property.id,
          listingId: listing.id,
          previousStageId: savedDetailStage.id,
          enteredAt: new Date(sessionStart.getTime() + 6000),
        });
        const savedContactStage = await funnelStageRepository.save(contactStage);
        funnelCount++;

        // 5. 20% of total sessions (40% of contact sessions) convert
        if (i % 5 === 0) {
          // Update contact stage and create conversion stage
          savedContactStage.exitedAt = new Date(sessionStart.getTime() + 7000);
          savedContactStage.timeInStageSeconds = 1;
          savedContactStage.convertedToNextStage = true;
          await funnelStageRepository.save(savedContactStage);

          const conversionStage = funnelStageRepository.create({
            sessionId,
            stage: FunnelStageType.CONVERSION,
            propertyId: property.id,
            listingId: listing.id,
            previousStageId: savedContactStage.id,
            enteredAt: new Date(sessionStart.getTime() + 7000),
          });
          await funnelStageRepository.save(conversionStage);
          funnelCount++;
        }
      } else {
        // Mark as dropoff (no conversion)
        savedDetailStage.exitedAt = new Date(sessionStart.getTime() + 8000);
        savedDetailStage.timeInStageSeconds = 3;
        savedDetailStage.convertedToNextStage = false;
        await funnelStageRepository.save(savedDetailStage);
      }

      // Add some additional engagement events
      if (i % 3 === 0) {
        const favoriteEvent = analyticsEventRepository.create({
          eventType: EventType.FAVORITE_ADD,
          sessionId,
          userId,
          propertyId: createdProperties[i % createdProperties.length].id,
          deviceType,
          userAgent: searchEvent.userAgent,
          ipAddress: searchEvent.ipAddress,
          timestamp: new Date(sessionStart.getTime() + 4500),
        });
        await analyticsEventRepository.save(favoriteEvent);
        eventCount++;
      }

      if (i % 4 === 0) {
        const shareEvent = analyticsEventRepository.create({
          eventType: EventType.SHARE_CLICK,
          sessionId,
          userId,
          propertyId: createdProperties[i % createdProperties.length].id,
          deviceType,
          userAgent: searchEvent.userAgent,
          ipAddress: searchEvent.ipAddress,
          eventData: { platform: 'whatsapp' },
          timestamp: new Date(sessionStart.getTime() + 5500),
        });
        await analyticsEventRepository.save(shareEvent);
        eventCount++;
      }
    }

    console.log(`  ✅ Created ${eventCount} analytics events`);
    console.log(`  ✅ Created ${funnelCount} funnel stages`);

    // =================== MESSAGING DATA ===================
    console.log('\n📨 Seeding Messaging Data...');

    // Create message templates
    const templates = [
      {
        templateKey: 'property_alert_en',
        channel: MessageChannel.WHATSAPP,
        language: MessageLanguage.EN,
        name: 'Property Alert - English',
        content: 'Hi {{customerName}}, a new property matching your criteria is now available in {{location}}! {{propertyName}} - AED {{price}}. View details: {{link}}',
        category: TemplateCategory.PROPERTY_ALERT,
        variables: ['customerName', 'location', 'propertyName', 'price', 'link'],
        whatsappTemplateId: 'property_alert_en_v1',
        active: true,
        approvedBy: createdUsers[2].id, // Compliance officer
      },
      {
        templateKey: 'property_alert_ar',
        channel: MessageChannel.WHATSAPP,
        language: MessageLanguage.AR,
        name: 'Property Alert - Arabic',
        content: 'مرحباً {{customerName}}، عقار جديد متاح الآن في {{location}}! {{propertyName}} - {{price}} درهم. عرض التفاصيل: {{link}}',
        category: TemplateCategory.PROPERTY_ALERT,
        variables: ['customerName', 'location', 'propertyName', 'price', 'link'],
        whatsappTemplateId: 'property_alert_ar_v1',
        active: true,
        approvedBy: createdUsers[2].id,
      },
      {
        templateKey: 'appointment_reminder_en',
        channel: MessageChannel.SMS,
        language: MessageLanguage.EN,
        name: 'Appointment Reminder - English',
        content: 'Reminder: Your viewing appointment for {{propertyName}} is scheduled for {{date}} at {{time}}. Location: {{address}}. Contact: {{agentPhone}}',
        category: TemplateCategory.APPOINTMENT_REMINDER,
        variables: ['propertyName', 'date', 'time', 'address', 'agentPhone'],
        active: true,
        approvedBy: createdUsers[2].id,
      },
      {
        templateKey: 'appointment_reminder_ar',
        channel: MessageChannel.SMS,
        language: MessageLanguage.AR,
        name: 'Appointment Reminder - Arabic',
        content: 'تذكير: موعدك لمعاينة {{propertyName}} محدد في {{date}} الساعة {{time}}. العنوان: {{address}}. للتواصل: {{agentPhone}}',
        category: TemplateCategory.APPOINTMENT_REMINDER,
        variables: ['propertyName', 'date', 'time', 'address', 'agentPhone'],
        active: true,
        approvedBy: createdUsers[2].id,
      },
      {
        templateKey: 'new_listing_notification',
        channel: MessageChannel.WHATSAPP,
        language: MessageLanguage.EN,
        name: 'New Listing Notification',
        content: '🏡 New listing just published! {{propertyName}} in {{community}} - {{bedrooms}} BR, {{price}} AED. Contact {{agentName}} for details.',
        category: TemplateCategory.PROPERTY_ALERT,
        variables: ['propertyName', 'community', 'bedrooms', 'price', 'agentName'],
        active: true,
        approvedBy: createdUsers[2].id,
      },
    ];

    const createdTemplates = [];
    for (const templateData of templates) {
      const template = templateRepository.create(templateData);
      await templateRepository.save(template);
      createdTemplates.push(template);
    }

    console.log(`  ✅ Created ${createdTemplates.length} message templates`);

    // Create sample messages with various statuses
    const messages = [
      // Successfully sent WhatsApp messages
      {
        recipientId: createdUsers[3].id, // Buyer
        recipientPhone: '+971501234570',
        channel: MessageChannel.WHATSAPP,
        messageType: MessageType.MARKETING,
        templateId: 'property_alert_en',
        content: 'Hi Sarah, a new property matching your criteria is now available in Palm Jumeirah! Luxury Villa - AED 15,000,000. View details: https://example.com/property/1',
        language: MessageLanguage.EN,
        status: MessageStatus.SENT,
        sentAt: new Date(Date.now() - 3600000), // 1 hour ago
        consentVerified: true,
        consentVersion: 'v1.0',
        metadata: { propertyId: createdProperties[0].id, campaignId: 'camp_001' },
        vendorMessageId: 'whatsapp_msg_001',
        createdBy: createdUsers[0].id, // Agent
      },
      {
        recipientId: createdUsers[4].id,
        recipientPhone: '+971501234571',
        channel: MessageChannel.SMS,
        messageType: MessageType.NOTIFICATION,
        content: 'Reminder: Your viewing appointment for Downtown Apartment is scheduled for 2025-10-06 at 14:00. Location: Business Bay. Contact: +971501234567',
        language: MessageLanguage.EN,
        status: MessageStatus.DELIVERED,
        sentAt: new Date(Date.now() - 7200000), // 2 hours ago
        deliveredAt: new Date(Date.now() - 7000000),
        consentVerified: true,
        consentVersion: 'v1.0',
        metadata: { propertyId: createdProperties[1].id, appointmentId: 'apt_001' },
        vendorMessageId: 'sms_msg_002',
        createdBy: createdUsers[0].id,
      },
      {
        recipientPhone: '+971505555555',
        channel: MessageChannel.WHATSAPP,
        messageType: MessageType.MARKETING,
        templateId: 'property_alert_en',
        content: 'Hi Ahmed, new property in Dubai Marina! Luxury Penthouse - AED 8,000,000.',
        language: MessageLanguage.EN,
        status: MessageStatus.SENT,
        sentAt: new Date(Date.now() - 86400000), // 1 day ago
        consentVerified: true,
        metadata: { propertyId: createdProperties[3].id },
        vendorMessageId: 'whatsapp_msg_003',
        createdBy: createdUsers[1].id, // Marketing
      },
      // Blocked messages (outside TDRA window)
      {
        recipientPhone: '+971506666666',
        channel: MessageChannel.SMS,
        messageType: MessageType.MARKETING,
        content: 'Check out our latest properties in Dubai!',
        language: MessageLanguage.EN,
        status: MessageStatus.BLOCKED,
        blockReason: 'Outside TDRA window (07:00-21:00 UAE time)',
        scheduledFor: new Date(Date.now() + 43200000), // 12 hours from now
        consentVerified: true,
        metadata: { campaignId: 'camp_002' },
        createdBy: createdUsers[1].id,
      },
      {
        recipientPhone: '+971507777777',
        channel: MessageChannel.SMS,
        messageType: MessageType.MARKETING,
        content: 'Limited time offer on Palm Jumeirah properties!',
        language: MessageLanguage.EN,
        status: MessageStatus.BLOCKED,
        blockReason: 'Outside TDRA window (07:00-21:00 UAE time)',
        scheduledFor: new Date(Date.now() + 32400000), // 9 hours from now
        consentVerified: true,
        metadata: { campaignId: 'camp_003' },
        createdBy: createdUsers[1].id,
      },
      // Blocked messages (missing consent)
      {
        recipientPhone: '+971508888888',
        channel: MessageChannel.WHATSAPP,
        messageType: MessageType.MARKETING,
        content: 'Exclusive property listings just for you!',
        language: MessageLanguage.EN,
        status: MessageStatus.BLOCKED,
        blockReason: 'Missing whatsapp consent for marketing messages',
        consentVerified: false,
        metadata: { campaignId: 'camp_004' },
        createdBy: createdUsers[1].id,
      },
      {
        recipientPhone: '+971509999999',
        channel: MessageChannel.SMS,
        messageType: MessageType.MARKETING,
        content: 'New properties available in Business Bay!',
        language: MessageLanguage.EN,
        status: MessageStatus.BLOCKED,
        blockReason: 'Missing sms consent for marketing messages',
        consentVerified: false,
        metadata: { campaignId: 'camp_005' },
        createdBy: createdUsers[1].id,
      },
      // Queued messages (scheduled for future)
      {
        recipientPhone: '+971501111111',
        channel: MessageChannel.SMS,
        messageType: MessageType.MARKETING,
        content: 'Weekend open house viewing in JVC! Saturday 10 AM - 4 PM.',
        language: MessageLanguage.EN,
        status: MessageStatus.QUEUED,
        scheduledFor: new Date(Date.now() + 172800000), // 2 days from now
        consentVerified: true,
        consentVersion: 'v1.0',
        metadata: { propertyId: createdProperties[2].id, eventId: 'event_001' },
        createdBy: createdUsers[1].id,
      },
      {
        recipientPhone: '+971502222222',
        channel: MessageChannel.WHATSAPP,
        messageType: MessageType.MARKETING,
        templateId: 'new_listing_notification',
        content: '🏡 New listing just published! Marina Penthouse in Dubai Marina - 3 BR, 8000000 AED. Contact Ahmed Al-Mansouri for details.',
        language: MessageLanguage.EN,
        status: MessageStatus.QUEUED,
        scheduledFor: new Date(Date.now() + 86400000), // 1 day from now
        consentVerified: true,
        consentVersion: 'v1.0',
        metadata: { propertyId: createdProperties[3].id },
        createdBy: createdUsers[0].id,
      },
      // Failed message
      {
        recipientPhone: '+971503333333',
        channel: MessageChannel.SMS,
        messageType: MessageType.NOTIFICATION,
        content: 'Your property valuation report is ready for download.',
        language: MessageLanguage.EN,
        status: MessageStatus.FAILED,
        sentAt: new Date(Date.now() - 3600000),
        consentVerified: true,
        vendorResponse: { success: false, error: 'Invalid phone number' },
        retryCount: 2,
        metadata: { valuationId: 'val_001' },
        createdBy: createdUsers[0].id,
      },
    ];

    const createdMessages = [];
    for (const messageData of messages) {
      const message = messageRepository.create(messageData);
      await messageRepository.save(message);
      createdMessages.push(message);
    }

    console.log(`  ✅ Created ${createdMessages.length} sample messages`);
    console.log(`    - ${messages.filter(m => m.status === MessageStatus.SENT || m.status === MessageStatus.DELIVERED).length} sent/delivered`);
    console.log(`    - ${messages.filter(m => m.status === MessageStatus.BLOCKED).length} blocked (TDRA window + consent)`);
    console.log(`    - ${messages.filter(m => m.status === MessageStatus.QUEUED).length} queued for future`);
    console.log(`    - ${messages.filter(m => m.status === MessageStatus.FAILED).length} failed`);

    // Seed documents
    console.log('🌱 Seeding documents...');

    const documentData = [
      // Emirates ID - Completed processing
      {
        fileName: 'emirates_id_784_2020_1234567_8.jpg',
        fileUrl: './uploads/documents/sample_emirates_id.jpg',
        fileType: FileType.JPEG,
        documentType: DocumentType.EMIRATES_ID,
        uploadedBy: createdUsers[0].id,
        relatedToPersonId: createdUsers[3].id, // Related to buyer
        processingStatus: ProcessingStatus.COMPLETED,
        ocrCompleted: true,
        validationCompleted: true,
        extractedData: {
          idNumber: '784-2020-1234567-8',
          fullName: 'Mohammed Ahmed Al-Rashid',
          fullNameAr: 'محمد أحمد الراشد',
          dateOfBirth: '15/03/1985',
          expiryDate: '14/03/2028',
          nationality: 'United Arab Emirates',
        },
        validationResults: {
          valid: true,
          errors: [],
          warnings: [],
          validatedAt: new Date().toISOString(),
        },
        ocrProvider: 'tesseract',
        confidenceScore: 0.92,
        language: DocumentLanguage.MIXED,
        pageCount: 1,
        fileSize: 2048576, // 2MB
      },
      // Trade License - Completed
      {
        fileName: 'trade_license_123456.pdf',
        fileUrl: './uploads/documents/sample_trade_license.pdf',
        fileType: FileType.PDF,
        documentType: DocumentType.TRADE_LICENSE,
        uploadedBy: createdUsers[0].id,
        processingStatus: ProcessingStatus.COMPLETED,
        ocrCompleted: true,
        validationCompleted: true,
        extractedData: {
          licenseNumber: 'CN-1234567',
          companyName: 'Dubai Real Estate Solutions LLC',
          companyNameAr: 'شركة دبي للحلول العقارية ذ.م.م',
          issueDate: '01/01/2024',
          expiryDate: '31/12/2024',
          legalForm: 'Limited Liability Company',
        },
        validationResults: {
          valid: true,
          errors: [],
          warnings: ['Trade license expires within 60 days'],
          validatedAt: new Date().toISOString(),
        },
        ocrProvider: 'tesseract',
        confidenceScore: 0.88,
        language: DocumentLanguage.MIXED,
        pageCount: 1,
        fileSize: 3145728, // 3MB
      },
      // Title Deed - Completed, linked to property
      {
        fileName: 'title_deed_palm_jumeirah.pdf',
        fileUrl: './uploads/documents/sample_title_deed.pdf',
        fileType: FileType.PDF,
        documentType: DocumentType.TITLE_DEED,
        uploadedBy: createdUsers[0].id,
        relatedToPropertyId: createdProperties[0].id, // Palm Jumeirah property
        processingStatus: ProcessingStatus.COMPLETED,
        ocrCompleted: true,
        validationCompleted: true,
        extractedData: {
          plotNumber: 'PALM-VIL-001',
          community: 'Palm Jumeirah',
          area: '6200',
          ownerName: 'Mohammed Hassan Al-Maktoum',
          dldNumber: 'DLD-2023-987654',
        },
        validationResults: {
          valid: true,
          errors: [],
          warnings: [],
          validatedAt: new Date().toISOString(),
        },
        ocrProvider: 'tesseract',
        confidenceScore: 0.85,
        language: DocumentLanguage.EN,
        pageCount: 2,
        fileSize: 4194304, // 4MB
      },
      // Passport - Pending processing
      {
        fileName: 'passport_scan.jpg',
        fileUrl: './uploads/documents/sample_passport.jpg',
        fileType: FileType.JPEG,
        documentType: DocumentType.PASSPORT,
        uploadedBy: createdUsers[0].id,
        relatedToPersonId: createdUsers[4].id, // Related to another buyer
        processingStatus: ProcessingStatus.PENDING,
        ocrCompleted: false,
        validationCompleted: false,
        ocrProvider: 'tesseract',
        language: DocumentLanguage.EN,
        pageCount: 1,
        fileSize: 1572864, // 1.5MB
      },
      // NOC - Failed processing
      {
        fileName: 'noc_blurry.jpg',
        fileUrl: './uploads/documents/sample_noc_failed.jpg',
        fileType: FileType.JPEG,
        documentType: DocumentType.NOC,
        uploadedBy: createdUsers[0].id,
        relatedToPropertyId: createdProperties[1].id,
        processingStatus: ProcessingStatus.FAILED,
        ocrCompleted: false,
        validationCompleted: false,
        processingErrors: ['OCR failed: Image quality too low', 'Unable to extract text'],
        ocrProvider: 'tesseract',
        confidenceScore: 0.32,
        language: DocumentLanguage.EN,
        pageCount: 1,
        fileSize: 1048576, // 1MB
      },
    ];

    const createdDocuments = [];
    for (const docData of documentData) {
      const document = documentRepository.create(docData);
      await documentRepository.save(document);
      createdDocuments.push(document);
    }

    console.log(`  ✅ Created ${createdDocuments.length} sample documents`);

    // Seed extracted fields for completed documents
    console.log('🌱 Seeding extracted fields...');

    const fieldData = [
      // Fields for Emirates ID
      { documentId: createdDocuments[0].id, fieldName: 'idNumber', fieldValue: '784-2020-1234567-8', fieldType: FieldType.TEXT, confidence: 0.95 },
      { documentId: createdDocuments[0].id, fieldName: 'fullName', fieldValue: 'Mohammed Ahmed Al-Rashid', fieldType: FieldType.TEXT, confidence: 0.90 },
      { documentId: createdDocuments[0].id, fieldName: 'fullNameAr', fieldValue: 'محمد أحمد الراشد', fieldType: FieldType.TEXT, confidence: 0.88 },
      { documentId: createdDocuments[0].id, fieldName: 'dateOfBirth', fieldValue: '15/03/1985', fieldType: FieldType.DATE, confidence: 0.92 },
      { documentId: createdDocuments[0].id, fieldName: 'expiryDate', fieldValue: '14/03/2028', fieldType: FieldType.DATE, confidence: 0.93 },
      { documentId: createdDocuments[0].id, fieldName: 'nationality', fieldValue: 'United Arab Emirates', fieldType: FieldType.TEXT, confidence: 0.91 },

      // Fields for Trade License
      { documentId: createdDocuments[1].id, fieldName: 'licenseNumber', fieldValue: 'CN-1234567', fieldType: FieldType.TEXT, confidence: 0.94 },
      { documentId: createdDocuments[1].id, fieldName: 'companyName', fieldValue: 'Dubai Real Estate Solutions LLC', fieldType: FieldType.TEXT, confidence: 0.87 },
      { documentId: createdDocuments[1].id, fieldName: 'companyNameAr', fieldValue: 'شركة دبي للحلول العقارية ذ.م.م', fieldType: FieldType.TEXT, confidence: 0.85 },
      { documentId: createdDocuments[1].id, fieldName: 'issueDate', fieldValue: '01/01/2024', fieldType: FieldType.DATE, confidence: 0.90 },
      { documentId: createdDocuments[1].id, fieldName: 'expiryDate', fieldValue: '31/12/2024', fieldType: FieldType.DATE, confidence: 0.91 },
      { documentId: createdDocuments[1].id, fieldName: 'legalForm', fieldValue: 'Limited Liability Company', fieldType: FieldType.TEXT, confidence: 0.86 },

      // Fields for Title Deed
      { documentId: createdDocuments[2].id, fieldName: 'plotNumber', fieldValue: 'PALM-VIL-001', fieldType: FieldType.TEXT, confidence: 0.93 },
      { documentId: createdDocuments[2].id, fieldName: 'community', fieldValue: 'Palm Jumeirah', fieldType: FieldType.TEXT, confidence: 0.92 },
      { documentId: createdDocuments[2].id, fieldName: 'area', fieldValue: '6200', fieldType: FieldType.NUMBER, confidence: 0.88 },
      { documentId: createdDocuments[2].id, fieldName: 'ownerName', fieldValue: 'Mohammed Hassan Al-Maktoum', fieldType: FieldType.TEXT, confidence: 0.84 },
      { documentId: createdDocuments[2].id, fieldName: 'dldNumber', fieldValue: 'DLD-2023-987654', fieldType: FieldType.TEXT, confidence: 0.89 },
    ];

    let fieldCount = 0;
    for (const data of fieldData) {
      const field = extractedFieldRepository.create(data);
      await extractedFieldRepository.save(field);
      fieldCount++;
    }

    console.log(`  ✅ Created ${fieldCount} extracted fields`);
    console.log(`    - ${documentData.filter(d => d.processingStatus === ProcessingStatus.COMPLETED).length} documents fully processed`);
    console.log(`    - ${documentData.filter(d => d.processingStatus === ProcessingStatus.PENDING).length} documents pending`);
    console.log(`    - ${documentData.filter(d => d.processingStatus === ProcessingStatus.FAILED).length} documents failed`);

    // Index properties and listings in OpenSearch
    console.log('\n🔍 Indexing properties and listings in OpenSearch...');

    try {
      // @ts-expect-error - Dynamic import at runtime
      const { SearchIndexService } = await import('../../modules/search/services/index.service');
      // @ts-expect-error - Dynamic import at runtime
      const { OPENSEARCH_PROPERTIES_INDEX, OPENSEARCH_LISTINGS_INDEX } = await import('../../modules/search/config/opensearch.config');

      const searchIndexService = new SearchIndexService();

      // Create indices
      await searchIndexService.createIndices();
      console.log('  ✓ OpenSearch indices created');

      // Get all properties with relations
      const allProperties = await propertyRepository.find({ relations: ['agent'] });

      // Bulk index properties
      const propertiesResult = await searchIndexService.bulkIndex(
        allProperties,
        OPENSEARCH_PROPERTIES_INDEX,
        'property'
      );

      console.log(`  ✓ Indexed ${propertiesResult.successful} properties`);
      if (propertiesResult.failed > 0) {
        console.log(`  ⚠ Failed to index ${propertiesResult.failed} properties`);
      }

      // Get all listings with relations
      const allListings = await listingRepository.find({ relations: ['property', 'agent'] });

      // Bulk index listings
      const listingsResult = await searchIndexService.bulkIndex(
        allListings,
        OPENSEARCH_LISTINGS_INDEX,
        'listing'
      );

      console.log(`  ✓ Indexed ${listingsResult.successful} listings`);
      if (listingsResult.failed > 0) {
        console.log(`  ⚠ Failed to index ${listingsResult.failed} listings`);
      }

    } catch (error) {
      console.log('  ⚠ OpenSearch indexing skipped (OpenSearch may not be running)');
      console.log(`    Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ===== CREATE PAYMENTS, ESCROW, AND INSTALLMENTS =====
    console.log('\n💰 Creating payments, escrow accounts, and installment plans...');

    const buyerUser = await userRepository.findOne({ where: { email: 'buyer@test.com' } });
    const agentUser = await userRepository.findOne({ where: { email: 'agent@test.com' } });

    if (!buyerUser || !agentUser) {
      console.log('  ⚠ Skipping payment seed - required users not found');
      console.log('\n✨ Database seeding completed successfully!');
      await AppDataSource.destroy();
      process.exit(0);
      return;
    }

    const property1 = createdProperties[0]; // Palm Jumeirah property
    const property2 = createdProperties[1]; // Downtown property
    const lead1 = createdLeads[0]; // Hot lead

    // Create completed payments
    const payment1 = paymentRepository.create({
      transactionId: 'TXN-2025-123456789',
      paymentType: PaymentType.BOOKING_DEPOSIT,
      amount: 150000, // 10% of 1.5M AED property
      currency: 'AED',
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      gateway: PaymentGateway.MANUAL,
      propertyId: property1.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      receivedBy: agentUser.id,
      processingFee: 3750, // 2.5%
      netAmount: 146250,
      metadata: { reference: 'BANK-REF-001', bankName: 'Emirates NBD' },
    });

    const payment2 = paymentRepository.create({
      transactionId: 'TXN-2025-234567890',
      paymentType: PaymentType.DOWN_PAYMENT,
      amount: 300000, // 20% down payment
      currency: 'AED',
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      gateway: PaymentGateway.TELR,
      gatewayTransactionId: 'TELR-TXN-98765',
      propertyId: property1.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      receivedBy: agentUser.id,
      processingFee: 7500,
      netAmount: 292500,
      gatewayResponse: { status: 'approved', cardLast4: '1234' },
    });

    const payment3 = paymentRepository.create({
      transactionId: 'TXN-2025-345678901',
      paymentType: PaymentType.AGENCY_FEE,
      amount: 30000, // 2% agency fee
      currency: 'AED',
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      gateway: PaymentGateway.MANUAL,
      propertyId: property2.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      receivedBy: agentUser.id,
      processingFee: 750,
      netAmount: 29250,
    });

    const payment4 = paymentRepository.create({
      transactionId: 'TXN-2025-456789012',
      paymentType: PaymentType.SERVICE_FEE,
      amount: 5000,
      currency: 'AED',
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      gateway: PaymentGateway.STRIPE,
      gatewayTransactionId: 'ch_3ABC123XYZ',
      propertyId: property1.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      processingFee: 125,
      netAmount: 4875,
    });

    const payment5 = paymentRepository.create({
      transactionId: 'TXN-2025-567890123',
      paymentType: PaymentType.INSTALLMENT,
      amount: 50000, // First installment
      currency: 'AED',
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      gateway: PaymentGateway.MANUAL,
      propertyId: property1.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      processingFee: 1250,
      netAmount: 48750,
      metadata: { installmentNumber: 1, planId: 'to-be-linked' },
    });

    // Create pending payments
    const payment6 = paymentRepository.create({
      transactionId: 'TXN-2025-678901234',
      paymentType: PaymentType.INSTALLMENT,
      amount: 50000,
      currency: 'AED',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      gateway: PaymentGateway.MANUAL,
      propertyId: property1.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      processingFee: 1250,
      netAmount: 48750,
      metadata: { installmentNumber: 2, dueDate: '2025-11-01' },
    });

    const payment7 = paymentRepository.create({
      transactionId: 'TXN-2025-789012345',
      paymentType: PaymentType.BOOKING_DEPOSIT,
      amount: 75000,
      currency: 'AED',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      gateway: PaymentGateway.PAYFORT,
      propertyId: property2.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      processingFee: 1875,
      netAmount: 73125,
    });

    // Create failed payment
    const payment8 = paymentRepository.create({
      transactionId: 'TXN-2025-890123456',
      paymentType: PaymentType.DOWN_PAYMENT,
      amount: 200000,
      currency: 'AED',
      status: PaymentStatus.FAILED,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      gateway: PaymentGateway.STRIPE,
      gatewayTransactionId: 'pi_FAILED123',
      propertyId: property2.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      processingFee: 5000,
      netAmount: 195000,
      failureReason: 'Insufficient funds',
      gatewayResponse: { error: 'card_declined', decline_code: 'insufficient_funds' },
    });

    // Create refunded payment
    const payment9 = paymentRepository.create({
      transactionId: 'TXN-2025-901234567',
      paymentType: PaymentType.EARNEST_MONEY,
      amount: 25000,
      currency: 'AED',
      status: PaymentStatus.REFUNDED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      gateway: PaymentGateway.MANUAL,
      propertyId: property2.id,
      leadId: lead1.id,
      paidBy: buyerUser.id,
      refundAmount: 25000,
      refundedAt: new Date('2025-09-15'),
      processingFee: 625,
      netAmount: 24375,
      metadata: { refundReason: 'Deal cancelled by buyer', refundId: 'REF-001' },
    });

    const createdPayments = await paymentRepository.save([
      payment1, payment2, payment3, payment4, payment5,
      payment6, payment7, payment8, payment9,
    ]);

    // Create escrow accounts
    const escrow1 = escrowRepository.create({
      accountNumber: 'ESC-2025-100001',
      propertyId: property1.id,
      buyerId: buyerUser.id,
      sellerId: agentUser.id, // In real scenario, this would be property owner
      totalAmount: 1500000,
      depositedAmount: 450000, // booking + down payment
      releasedAmount: 0,
      status: EscrowStatus.FUNDED,
      conditions: [
        {
          id: '1',
          description: 'Title deed transfer completed',
          required: true,
          fulfilled: false,
        },
        {
          id: '2',
          description: 'NOC obtained from developer',
          required: true,
          fulfilled: false,
        },
        {
          id: '3',
          description: 'Final property inspection completed',
          required: true,
          fulfilled: false,
        },
      ],
      releaseApprovals: [],
      bankName: 'Emirates NBD',
      bankAccountNumber: '1234567890',
      iban: 'AE070331234567890123456',
      openedAt: new Date('2025-09-01'),
    });

    const escrow2 = escrowRepository.create({
      accountNumber: 'ESC-2025-100002',
      propertyId: property2.id,
      buyerId: buyerUser.id,
      sellerId: agentUser.id,
      totalAmount: 2500000,
      depositedAmount: 500000,
      releasedAmount: 500000,
      status: EscrowStatus.COMPLETED,
      conditions: [
        {
          id: '1',
          description: 'Title deed transfer completed',
          required: true,
          fulfilled: true,
          fulfilledAt: new Date('2025-09-20'),
        },
        {
          id: '2',
          description: 'Property handover completed',
          required: true,
          fulfilled: true,
          fulfilledAt: new Date('2025-09-25'),
        },
      ],
      releaseApprovals: [
        {
          requestId: 'REL-001',
          amount: 500000,
          reason: 'All conditions met, releasing full amount',
          requestedBy: agentUser.id,
          requestedAt: new Date('2025-09-26'),
          buyerApproved: true,
          buyerApprovedAt: new Date('2025-09-27'),
          sellerApproved: true,
          sellerApprovedAt: new Date('2025-09-27'),
          executed: true,
          executedAt: new Date('2025-09-28'),
          recipient: agentUser.id,
        },
      ],
      bankName: 'First Abu Dhabi Bank',
      bankAccountNumber: '9876543210',
      iban: 'AE070331234567890987654',
      openedAt: new Date('2025-08-01'),
      closedAt: new Date('2025-09-28'),
    });

    const createdEscrows = await escrowRepository.save([escrow1, escrow2]);

    // Create installment plan
    const installmentStartDate = new Date('2025-10-01');
    const installments = [];

    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(installmentStartDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        number: i + 1,
        amount: 50000,
        dueDate,
        status: (i === 0 || i === 1 || i === 2 ? 'paid' : 'pending') as 'paid' | 'pending' | 'overdue' | 'waived',
        paidDate: i < 3 ? new Date(`2025-${10 + i}-01`) : undefined,
        paymentId: i === 0 ? payment5.id : undefined,
      });
    }

    const installmentPlan = installmentRepository.create({
      propertyId: property1.id,
      leadId: lead1.id,
      totalAmount: 1500000,
      downPaymentAmount: 300000, // 20% down
      installmentCount: 12,
      installmentAmount: 50000,
      frequency: InstallmentFrequency.MONTHLY,
      startDate: installmentStartDate,
      endDate: new Date('2026-09-01'),
      status: InstallmentPlanStatus.ACTIVE,
      installments,
    });

    const createdPlans = await installmentRepository.save([installmentPlan]);
    const createdPlan = createdPlans[0];

    console.log(`  ✓ Created ${createdPayments.length} payments`);
    console.log(`  ✓ Created ${createdEscrows.length} escrow accounts`);
    console.log(`  ✓ Created 1 installment plan with ${createdPlan.installmentCount} installments`);

    // ===== Report Definitions =====
    console.log('\n📊 Seeding report definitions...');

    const complianceUser = await userRepository.findOne({ where: { email: 'compliance@test.com' } });
    if (!complianceUser) {
      throw new Error('Compliance user not found');
    }

    const reportDefinitions = [
      {
        reportKey: 'sales_summary',
        name: 'Sales Summary Report',
        description: 'Monthly aggregated sales metrics including listings, leads, conversions, and revenue',
        category: ReportCategory.SALES,
        reportType: ReportType.SUMMARY,
        dataSource: 'listings',
        parameters: {
          required: ['dateFrom', 'dateTo'],
        },
        columns: [
          { key: 'month', label: 'Month', type: 'date' },
          { key: 'total_listings', label: 'Total Listings', type: 'number' },
          { key: 'total_leads', label: 'Total Leads', type: 'number' },
          { key: 'total_conversions', label: 'Conversions', type: 'number' },
          { key: 'total_revenue', label: 'Revenue (AED)', type: 'currency' },
          { key: 'conversion_rate', label: 'Conversion Rate (%)', type: 'number' },
          { key: 'average_deal_size', label: 'Avg Deal Size (AED)', type: 'currency' },
        ],
        accessRoles: ['marketing', 'compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'lead_funnel',
        name: 'Lead Funnel Report',
        description: 'Detailed lead funnel metrics by source, tier, and status with conversion rates',
        category: ReportCategory.LEADS,
        reportType: ReportType.DETAIL,
        dataSource: 'leads',
        parameters: {
          required: ['dateFrom', 'dateTo'],
          optional: ['agentId'],
        },
        columns: [
          { key: 'source', label: 'Source', type: 'string' },
          { key: 'tier', label: 'Tier', type: 'string' },
          { key: 'status', label: 'Status', type: 'string' },
          { key: 'lead_count', label: 'Lead Count', type: 'number' },
          { key: 'avg_days_to_conversion', label: 'Avg Days to Convert', type: 'number' },
        ],
        accessRoles: ['marketing', 'compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'property_performance',
        name: 'Property Performance Report',
        description: 'Top performing properties with views, contacts, conversions, and days on market',
        category: ReportCategory.OPERATIONS,
        reportType: ReportType.COMPARISON,
        dataSource: 'properties',
        parameters: {
          required: ['dateFrom', 'dateTo'],
          optional: ['limit'],
        },
        columns: [
          { key: 'property_id', label: 'Property ID', type: 'string' },
          { key: 'title', label: 'Title', type: 'string' },
          { key: 'propertyType', label: 'Type', type: 'string' },
          { key: 'views', label: 'Views', type: 'number' },
          { key: 'contacts', label: 'Contacts', type: 'number' },
          { key: 'conversions', label: 'Conversions', type: 'number' },
          { key: 'conversion_rate', label: 'Conversion Rate (%)', type: 'number' },
          { key: 'days_on_market', label: 'Days on Market', type: 'number' },
        ],
        accessRoles: ['agent', 'marketing', 'compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'agent_performance',
        name: 'Agent Performance Leaderboard',
        description: 'Agent performance metrics including listings, leads, conversions, and revenue',
        category: ReportCategory.OPERATIONS,
        reportType: ReportType.COMPARISON,
        dataSource: 'users',
        parameters: {
          required: ['dateFrom', 'dateTo'],
        },
        columns: [
          { key: 'agent_name', label: 'Agent Name', type: 'string' },
          { key: 'listings_created', label: 'Listings Created', type: 'number' },
          { key: 'leads_assigned', label: 'Leads Assigned', type: 'number' },
          { key: 'leads_converted', label: 'Leads Converted', type: 'number' },
          { key: 'total_revenue', label: 'Total Revenue (AED)', type: 'currency' },
          { key: 'avg_response_time_hours', label: 'Avg Response Time (hrs)', type: 'number' },
          { key: 'conversion_rate', label: 'Conversion Rate (%)', type: 'number' },
        ],
        accessRoles: ['marketing', 'compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'financial_summary',
        name: 'Financial Summary Report',
        description: 'Comprehensive financial report with payments, escrow, installments, and refunds',
        category: ReportCategory.FINANCE,
        reportType: ReportType.SUMMARY,
        dataSource: 'payments',
        parameters: {
          required: ['dateFrom', 'dateTo'],
        },
        columns: [
          { key: 'paymentType', label: 'Payment Type', type: 'string' },
          { key: 'transaction_count', label: 'Transaction Count', type: 'number' },
          { key: 'total_amount', label: 'Total Amount (AED)', type: 'currency' },
        ],
        accessRoles: ['compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'compliance_summary',
        name: 'Compliance Summary Report',
        description: 'Compliance metrics for permits, TDRA, consents, and document verification',
        category: ReportCategory.COMPLIANCE,
        reportType: ReportType.SUMMARY,
        dataSource: 'permits',
        parameters: {
          required: ['dateFrom', 'dateTo'],
        },
        columns: [
          { key: 'total_listings', label: 'Total Listings', type: 'number' },
          { key: 'listings_with_valid_permits', label: 'Valid Permits', type: 'number' },
          { key: 'permits_expiring_soon', label: 'Expiring Soon', type: 'number' },
          { key: 'expired_permits', label: 'Expired', type: 'number' },
        ],
        accessRoles: ['compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
      {
        reportKey: 'marketing_analytics',
        name: 'Marketing Analytics Report',
        description: 'Marketing performance with channel effectiveness, search analytics, and content performance',
        category: ReportCategory.MARKETING,
        reportType: ReportType.TREND,
        dataSource: 'leads',
        parameters: {
          required: ['dateFrom', 'dateTo'],
        },
        columns: [
          { key: 'channel', label: 'Channel', type: 'string' },
          { key: 'total_leads', label: 'Total Leads', type: 'number' },
          { key: 'conversions', label: 'Conversions', type: 'number' },
          { key: 'conversion_rate', label: 'Conversion Rate (%)', type: 'number' },
        ],
        accessRoles: ['marketing', 'compliance'],
        createdBy: complianceUser.id,
        isActive: true,
      },
    ];

    const createdReports = await reportDefinitionRepository.save(
      reportDefinitions.map(def => reportDefinitionRepository.create(def))
    );

    console.log(`  ✓ Created ${createdReports.length} report definitions`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\nTest Users Created:');
    console.log('  - agent@test.com (Agent)');
    console.log('  - marketing@test.com (Marketing)');
    console.log('  - compliance@test.com (Compliance)');
    console.log('  - buyer@test.com (Buyer)');
    console.log('  - buyer2@test.com (Buyer)');
    console.log(`\n🔑 Password for all test users: ${defaultPassword}`);
    console.log('\nTest Permits Created:');
    console.log('  - DLD-2024-12345 (Dubai, Valid, expires in 6 months)');
    console.log('  - ADREC-2024-67890 (Abu Dhabi, Valid, expires in 3 months)');
    console.log('  - RERA-2023-54321 (Dubai, Expired)');
    console.log('  - DLD-2024-98765 (Dubai, Valid, expires in 15 days)');
    console.log('  - ADGM-2024-11111 (Abu Dhabi, Valid, expires in 1 year)');
    console.log('\nTest Properties Created:');
    console.log(
      '  - 5 properties across Palm Jumeirah, Downtown Dubai, JVC, Dubai Marina, Business Bay',
    );
    console.log('\nTest Listings Created:');
    console.log('  - 3 published listings with valid permits');
    console.log('  - 2 draft listings');
    console.log('\nTest Leads Created:');
    console.log('  - 3 hot leads (score >= 0.7) with high budgets');
    console.log('  - 4 warm leads (score 0.4-0.7) with medium budgets');
    console.log('  - 3 cold leads (score < 0.4) with low budgets');
    console.log('  - 10 activities across various leads');
    console.log('\nMarket Data Created:');
    console.log('  - 8 market data entries for Palm, Downtown, Marina, JVC, Business Bay');
    console.log('  - Realistic Dubai prices: Palm (2,500-3,200 AED/sqft), Downtown (2,200-2,800), JVC (1,100-1,300)');
    console.log('\nValuations Created:');
    console.log('  - 3 property valuations with confidence intervals and comparables');
    console.log('\nAnalytics Data Created:');
    console.log(`  - ${eventCount} analytics events across 10 user sessions`);
    console.log(`  - ${funnelCount} funnel stages tracking user journey`);
    console.log('  - Event types: search, listing_click, property_view, contact (whatsapp/call/email), conversion, favorite_add, share_click');
    console.log('  - Conversion funnel: 100% search → 100% listing → 100% detail → 50% contact → 20% conversion');
    console.log('\nMessaging Data Created:');
    console.log(`  - ${createdTemplates.length} message templates (WhatsApp & SMS, EN/AR)`);
    console.log(`  - ${createdMessages.length} sample messages with mixed statuses`);
    console.log('  - Templates: property_alert, appointment_reminder, new_listing_notification');
    console.log('  - TDRA compliance: Messages blocked outside 07:00-21:00 UAE window');
    console.log('  - Consent verification: Messages blocked without proper consent');
    console.log('\nDocument AI Data Created:');
    console.log(`  - ${createdDocuments.length} sample documents (Emirates ID, Trade License, Title Deed, Passport, NOC)`);
    console.log(`  - ${fieldCount} extracted fields with confidence scores`);
    console.log('  - OCR provider: Tesseract.js with EN/AR language support');
    console.log('  - Processing statuses: 3 completed, 1 pending, 1 failed');
    console.log('  - Validation: Format checks, expiry date validation, Emirates ID checksum');
    console.log('\nPayment & Escrow Data Created:');
    console.log(`  - ${createdPayments.length} payments (5 completed, 2 pending, 1 failed, 1 refunded)`);
    console.log('  - Payment types: Booking deposit, down payment, installments, agency fees, service fees');
    console.log('  - Gateways: Telr, Stripe, PayFort, Manual bank transfers');
    console.log(`  - ${createdEscrows.length} escrow accounts (1 funded, 1 completed with release)`);
    console.log(`  - 1 installment plan: 12 monthly payments of 50K AED (3 paid, 9 pending)`);
    console.log('  - Realistic UAE amounts: Deposits 10-20% of property value');
    console.log('\nReport Definitions Created:');
    console.log(`  - ${createdReports.length} report definitions for sales, marketing, finance, compliance`);
    console.log('  - Reports: sales_summary, lead_funnel, property_performance, agent_performance');
    console.log('  - Reports: financial_summary, compliance_summary, marketing_analytics');
    console.log('  - Role-based access: Agents, Marketing, Compliance');
    console.log('  - Dashboards: Executive, Agent, Marketing, Compliance');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();

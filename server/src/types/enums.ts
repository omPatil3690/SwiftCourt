// Local enum mirrors for Prisma enums
export enum UserRole { USER = 'USER', OWNER = 'OWNER', ADMIN = 'ADMIN' }
export enum UserStatus { ACTIVE = 'ACTIVE', BANNED = 'BANNED' }
export enum FacilityStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum BookingStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', CANCELLED = 'CANCELLED', COMPLETED = 'COMPLETED' }
export enum PaymentStatus { PENDING = 'PENDING', SUCCEEDED = 'SUCCEEDED', FAILED = 'FAILED', REFUNDED = 'REFUNDED' }
export enum InviteStatus { PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', DECLINED = 'DECLINED', EXPIRED = 'EXPIRED' }
export enum ReferralRewardStatus { PENDING = 'PENDING', EARNED = 'EARNED', REVOKED = 'REVOKED' }

export const UserRoleValues = Object.values(UserRole);
export const FacilityStatusValues = Object.values(FacilityStatus);
export const BookingStatusValues = Object.values(BookingStatus);
export const InviteStatusValues = Object.values(InviteStatus);
export const ReferralRewardStatusValues = Object.values(ReferralRewardStatus);

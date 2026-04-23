"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralRewardStatusValues = exports.InviteStatusValues = exports.BookingStatusValues = exports.FacilityStatusValues = exports.UserRoleValues = exports.ReferralRewardStatus = exports.InviteStatus = exports.PaymentStatus = exports.BookingStatus = exports.FacilityStatus = exports.UserStatus = exports.UserRole = void 0;
// Local enum mirrors for Prisma enums
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["OWNER"] = "OWNER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["BANNED"] = "BANNED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var FacilityStatus;
(function (FacilityStatus) {
    FacilityStatus["PENDING"] = "PENDING";
    FacilityStatus["APPROVED"] = "APPROVED";
    FacilityStatus["REJECTED"] = "REJECTED";
})(FacilityStatus || (exports.FacilityStatus = FacilityStatus = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCEEDED"] = "SUCCEEDED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var InviteStatus;
(function (InviteStatus) {
    InviteStatus["PENDING"] = "PENDING";
    InviteStatus["ACCEPTED"] = "ACCEPTED";
    InviteStatus["DECLINED"] = "DECLINED";
    InviteStatus["EXPIRED"] = "EXPIRED";
})(InviteStatus || (exports.InviteStatus = InviteStatus = {}));
var ReferralRewardStatus;
(function (ReferralRewardStatus) {
    ReferralRewardStatus["PENDING"] = "PENDING";
    ReferralRewardStatus["EARNED"] = "EARNED";
    ReferralRewardStatus["REVOKED"] = "REVOKED";
})(ReferralRewardStatus || (exports.ReferralRewardStatus = ReferralRewardStatus = {}));
exports.UserRoleValues = Object.values(UserRole);
exports.FacilityStatusValues = Object.values(FacilityStatus);
exports.BookingStatusValues = Object.values(BookingStatus);
exports.InviteStatusValues = Object.values(InviteStatus);
exports.ReferralRewardStatusValues = Object.values(ReferralRewardStatus);

import type { UserModel } from "@schema/index";
import { convertJsonToSearchParams } from "./helper-pure";

// Stub types - replace with actual schema types when available
type BillingModel = {
  plan: string;
};

type TeamMemberModel = {
  status: string;
  billingPlan: string;
  role: string;
};

// Stub constants - replace with actual values when available
const stripeMonthlyPaymentLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK || "";
const stripeYearlyPaymentLink = import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK || "";

/**
 * Quick helper function to check if a vento user is on a free plan
 * @param user
 */
export function isUserFreePlan(user?: UserModel | null) {
  if (!user) return true;
  return isFreePlan(user);
}

export function isFreePlan(user?: UserModel | null): boolean {
  const hasFreeBilling = !(user as any)?.billing || (user as any).billing.plan === "FREE";
  const membership = (user as any)?.teamMemberships?.[0];
  const isTeamFree = !membership ||
    membership.status !== "ACTIVE" ||
    membership.billingPlan !== "PREMIUM";
  return hasFreeBilling && isTeamFree;
}

export function isUserTeamAdmin(user?: UserModel | null) {
  const membership = (user as any)?.teamMemberships?.[0];
  return membership && membership.role === "ADMIN";
}

export function isUserActiveTeamMember(user?: UserModel | null) {
  const membership = (user as any)?.teamMemberships?.[0];
  return membership && membership.status === "ACTIVE";
}

/**
 * Quick helper function to check if a vento user is on a free plan
 * @param user
 */
export function isLtd(user?: UserModel) {
  return (user as any)?.billing && (user as any).billing.plan === "PREMIUM_LTD";
}

export const getMonthlyPaymentLink = (
  ventoUser?: UserModel,
  params?: Record<string, string>
) => {
  const stripeLink = `https://buy.stripe.com/${stripeMonthlyPaymentLink}`;
  if (!ventoUser) {
    return `/login?redirect_to=${encodeURIComponent(stripeLink)}`;
  }
  const converted = convertJsonToSearchParams({
    client_reference_id: ventoUser.id,
    prefilled_email: (ventoUser as any).email,
    ...params,
  });
  return stripeLink + "?" + converted;
};

export const getUpsellPaymentLink = (
  ventoUser?: UserModel,
  type?: "FreeTrial" | "Discount"
) => {
  return getMonthlyPaymentLink(ventoUser, {
    prefilled_promo_code: type === "FreeTrial" ? "FREETRIAL3" : "HALFOFFVENTO",
  });
};

export const getYearlyPaymentLink = (ventoUser?: UserModel) => {
  const stripeLink = `https://buy.stripe.com/${stripeYearlyPaymentLink}`;
  if (!ventoUser) {
    return `/login?redirect_to=${encodeURIComponent(stripeLink)}`;
  }
  const params = convertJsonToSearchParams({
    client_reference_id: ventoUser.id,
    prefilled_email: (ventoUser as any).email,
  });
  return stripeLink + "?" + params;
};

export const getLtdPaymentLink = (
  ventoUser?: UserModel,
  type?: "ltd" | "ltdhunt" | "lifetimo" | "appsumo"
) => {
  let stripeLink = "";
  switch (type) {
    case "ltd":
      stripeLink = "https://buy.stripe.com/4gw9Bd1NI1yfb2U3cf";
      break;
    case "ltdhunt":
    case "lifetimo":
      stripeLink = "https://buy.stripe.com/cN2eVx8c63Gn4Ew148";
      break;
    case "appsumo":
      stripeLink = "https://buy.stripe.com/5kA4gT9gaa4L3AsbIU";
      break;
    default:
      stripeLink = "https://buy.stripe.com/4gw9Bd1NI1yfb2U3cf";
  }
  if (!ventoUser) {
    return `/login?redirect_to=${encodeURIComponent(stripeLink)}`;
  }
  const params = convertJsonToSearchParams({
    client_reference_id: ventoUser.id,
    prefilled_email: (ventoUser as any).email,
  });
  return stripeLink + "?" + params;
};

export function firePaymentEvent(type: "monthly" | "yearly") {
  (window as any).uetq = (window as any).uetq || [];
  (window as any).uetq.push("event", "subscribe", {
    revenue_value: type === "monthly" ? 8 : 70,
    currency: "USD",
  });
}

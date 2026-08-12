import { task, logger } from "@trigger.dev/sdk";
import { onboardResidentialClient, type CleanUpFrequency, type LastCleaned } from "../lib/sweepandgo.js";
import { upsertContact, sendSms } from "../lib/ghl.js";

export interface SubmitSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  homeAddress: string;
  city: string;
  state: string;
  zip: string;
  dogs: number;
  frequency: CleanUpFrequency;
  lastCleaned: LastCleaned;
  termsAccepted: boolean;
  marketingAllowed: boolean;
  couponCode?: string;
  gateLocation?: string;
  dogSafety?: string;
  notificationPreference?: string;
  howHeard?: string;
  planLabel: string;
  pricePerVisit: string;
  // Stripe card token + non-sensitive summary fields from stripe.createToken() —
  // never the raw card number (Stripe/PCI never exposes that to us).
  stripeToken?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const REQUIRED_FIELDS: (keyof SubmitSignupPayload)[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "homeAddress",
  "city",
  "state",
  "zip",
];

async function notifyOwner(message: string) {
  const ownerPhone = requireEnv("GHL_OWNER_PHONE");
  const owner = await upsertContact({ phone: ownerPhone, tags: ["dirty-dawgs-owner"] });
  await sendSms(owner.id, message);
}

export const submitSignupTask = task({
  id: "submit-signup",
  run: async (payload: SubmitSignupPayload) => {
    for (const field of REQUIRED_FIELDS) {
      if (!payload[field]) throw new Error(`Missing required field: ${field}`);
    }
    if (!payload.termsAccepted) throw new Error("Terms were not accepted");

    const additionalCommentParts = [
      payload.dogSafety ? `Dog safety: ${payload.dogSafety}` : null,
      payload.gateLocation ? `Gate: ${payload.gateLocation}` : null,
      payload.notificationPreference ? `Notify via: ${payload.notificationPreference}` : null,
      payload.howHeard ? `Heard about us via: ${payload.howHeard}` : null,
    ].filter((part): part is string => Boolean(part));

    try {
      await onboardResidentialClient({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        cell_phone_number: payload.phone,
        home_address: payload.homeAddress,
        city: payload.city,
        state: payload.state,
        zip_code: payload.zip,
        number_of_dogs: payload.dogs,
        clean_up_frequency: payload.frequency,
        last_time_yard_was_thoroughly_cleaned: payload.lastCleaned,
        // Every new signup gets the free first cleanup advertised on the site.
        initial_cleanup_required: 1,
        marketing_allowed: payload.marketingAllowed ? 1 : 0,
        terms_open_api: 1,
        coupon_code: payload.couponCode || undefined,
        additional_comment: additionalCommentParts.join(" | ") || undefined,
        credit_card_token: payload.stripeToken,
        name_on_card: payload.stripeToken ? `${payload.firstName} ${payload.lastName}` : undefined,
      });
    } catch (error) {
      logger.error("Sweep&Go onboarding failed", { error });
      const reason = error instanceof Error ? error.message : String(error);
      await notifyOwner(
        `⚠️ Sweep&Go signup FAILED for ${payload.firstName} ${payload.lastName} (${payload.phone}) — needs manual setup.\n\nPlan: ${payload.planLabel} (${payload.pricePerVisit})\nAddress: ${payload.homeAddress}, ${payload.city} ${payload.state} ${payload.zip}\n\nError: ${reason}`
      );
      return { status: "sweepandgo_failed" as const, reason };
    }

    const cardLine =
      payload.cardBrand && payload.cardLast4
        ? `Card on file: ${payload.cardBrand} ••${payload.cardLast4} (exp ${payload.cardExpMonth}/${payload.cardExpYear})`
        : "No card on file — will need to be collected.";

    await notifyOwner(
      `✅ New Dirty Dawgs signup: ${payload.firstName} ${payload.lastName}, ${payload.phone}\nPlan: ${payload.planLabel} (${payload.pricePerVisit})\n${cardLine}\nAddress: ${payload.homeAddress}, ${payload.city} ${payload.state} ${payload.zip}`
    );

    return { status: "onboarded" as const };
  },
});

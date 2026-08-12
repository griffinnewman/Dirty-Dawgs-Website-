/**
 * Thin wrapper around the Sweep&Go Open API (https://openapi.sweepandgo.com/docs/).
 *
 * Requires env var SWEEPANDGO_API_TOKEN (Sweep&Go dashboard > Settings > Open API).
 */

const SWEEPANDGO_API_BASE = "https://openapi.sweepandgo.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export type CleanUpFrequency =
  | "seven_times_a_week"
  | "six_times_a_week"
  | "five_times_a_week"
  | "four_times_a_week"
  | "three_times_a_week"
  | "two_times_a_week"
  | "once_a_week"
  | "bi_weekly"
  | "twice_per_month"
  | "every_three_weeks"
  | "every_four_weeks"
  | "once_a_month"
  | "one_time";

export type LastCleaned =
  | "one_week"
  | "two_weeks"
  | "three_weeks"
  | "one_month"
  | "two_months"
  | "3-4_months"
  | "5-6_months"
  | "7-9_months"
  | "10+_months";

export interface ResidentialOnboardingInput {
  first_name: string;
  last_name: string;
  email: string;
  cell_phone_number: string;
  home_address: string;
  city: string;
  state: string;
  zip_code: string;
  number_of_dogs: number;
  clean_up_frequency: CleanUpFrequency;
  last_time_yard_was_thoroughly_cleaned: LastCleaned;
  initial_cleanup_required: 0 | 1;
  marketing_allowed: 0 | 1;
  terms_open_api: 0 | 1;
  home_phone_number?: string;
  additional_comment?: string;
  coupon_code?: string;
  tracking_field?: string;
  areas_to_clean?: string;
  gate_code?: string;
  gated_community?: string;
  // Card token from Stripe (created client-side via Stripe Elements).
  credit_card_token?: string;
  name_on_card?: string;
  postal?: string;
  expiry?: string; // MMYY
}

/**
 * Creates a residential client in Sweep&Go, with a card on file if a
 * credit_card_token is included. Success response is just {"success":"success"} —
 * Sweep&Go's API does not echo back a client ID or card details.
 */
export async function onboardResidentialClient(input: ResidentialOnboardingInput): Promise<void> {
  const res = await fetch(`${SWEEPANDGO_API_BASE}/api/v1/residential/onboarding`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${requireEnv("SWEEPANDGO_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sweep&Go onboarding failed: ${res.status} ${body}`);
  }
}

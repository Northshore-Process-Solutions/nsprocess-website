export const DEMO_SESSION_COOKIE = "nsps_demo_session";
export const DEMO_SESSION_HOURS = 3;

export type DemoIntake = {
  businessName: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  contactName: string;
};

export type DemoLead = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  stage:
    | "new_inquiry"
    | "follow_up"
    | "review_booked"
    | "review_completed"
    | "proposal_sent"
    | "deposit_received"
    | "won"
    | "lost";
  source: string;
  nextFollowUpAt: string | null;
  message: string;
};

export type DemoDoc = {
  id: string;
  number: string;
  title: string;
  status: string;
  total: number;
  businessName: string;
  issuedAt: string;
};

export type DemoProject = {
  id: string;
  name: string;
  status: "planning" | "active" | "on_hold" | "completed";
  nextAction: string;
  businessName: string;
  scope?: string;
  startDate?: string | null;
  targetDate?: string | null;
};

export type DemoEvent = {
  id: string;
  title: string;
  startsAt: string;
  eventType: string;
  businessName: string;
};

export type DemoPurchase = {
  id: string;
  description: string;
  amount: number;
  purchasedAt: string;
  vendor: string;
  businessName: string;
  purchaseType: string;
};

export type DemoTool = {
  id: string;
  name: string;
  category: string;
  status: "active" | "evaluating" | "retired";
  notes: string;
  monthlyCost: number;
};

export type DemoBusiness = {
  id: string;
  name: string;
  category: string;
  location: string;
  email: string;
  phone: string;
  contactName: string;
  notes: string;
  openBalance: number;
};

export type DemoSeed = {
  business: DemoBusiness;
  leads: DemoLead[];
  proposals: DemoDoc[];
  agreements: DemoDoc[];
  invoices: DemoDoc[];
  projects: DemoProject[];
  events: DemoEvent[];
  purchases: DemoPurchase[];
  tools: DemoTool[];
  activities: Array<{
    id: string;
    summary: string;
    occurredAt: string;
    kind: string;
  }>;
};

/** Raw seed as stored/returned before normalize (older sessions may omit fields). */
export type DemoSeedInput = Omit<DemoSeed, "purchases" | "tools"> & {
  purchases?: DemoPurchase[];
  tools?: DemoTool[];
};

export type DemoSessionRow = {
  id: string;
  created_at: string;
  expires_at: string;
  status: "building" | "ready" | "error";
  intake: DemoIntake;
  seed: DemoSeed | null;
  error: string | null;
};

export function isDemoExpired(expiresAt: string, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime();
}

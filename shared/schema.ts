// Database schema for Charge Wealth member portal
// Referenced from Replit Auth blueprint

import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  date,
  integer,
  text,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// Session storage table (Required by Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Required by Replit Auth, extended for Charge Wealth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  dateOfBirth: date("date_of_birth"),
  profileImageUrl: varchar("profile_image_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referralCount: integer("referral_count").default(0),
  referralEarnings: decimal("referral_earnings", { precision: 10, scale: 2 }).default('0'),
  referredBy: varchar("referred_by", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// SHARED FINANCIAL PROFILE
// ============================================

// Financial Profile - shared context across all products
export const financialProfiles = pgTable("financial_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Income & Employment
  annualIncome: decimal("annual_income", { precision: 15, scale: 2 }),
  incomeType: varchar("income_type", { length: 50 }), // W2, self-employed, mixed
  employerName: varchar("employer_name", { length: 200 }),
  filingStatus: varchar("filing_status", { length: 50 }), // single, married_joint, married_separate, head_of_household
  
  // Family
  dependents: integer("dependents").default(0),
  stateOfResidence: varchar("state_of_residence", { length: 2 }),
  
  // Financial Goals
  primaryGoal: varchar("primary_goal", { length: 100 }),
  riskTolerance: varchar("risk_tolerance", { length: 20 }), // conservative, moderate, aggressive
  investmentHorizon: varchar("investment_horizon", { length: 50 }), // short, medium, long
  
  // Aggregated Metrics (computed from documents)
  totalAssets: decimal("total_assets", { precision: 15, scale: 2 }),
  totalLiabilities: decimal("total_liabilities", { precision: 15, scale: 2 }),
  netWorth: decimal("net_worth", { precision: 15, scale: 2 }),
  liquidAssets: decimal("liquid_assets", { precision: 15, scale: 2 }),
  monthlyExpenses: decimal("monthly_expenses", { precision: 15, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Documents - uploaded files
export const financialDocuments = pgTable("financial_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  documentType: varchar("document_type", { length: 50 }).notNull(), // tax_return, brokerage_statement, bank_statement, pay_stub
  documentYear: integer("document_year"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Extracted data stored as JSON
  extractedData: jsonb("extracted_data"),
  extractionStatus: varchar("extraction_status", { length: 20 }).default('pending'), // pending, processing, completed, failed
  
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("idx_documents_user").on(table.userId),
  index("idx_documents_type").on(table.documentType),
]);

// ============================================
// CHARGE TAX INTEL
// ============================================

// Tax Returns - extracted 1040 data
export const taxReturns = pgTable("tax_returns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentId: integer("document_id").references(() => financialDocuments.id, { onDelete: 'set null' }),
  taxYear: integer("tax_year").notNull(),
  
  // Income breakdown
  wagesIncome: decimal("wages_income", { precision: 15, scale: 2 }),
  interestIncome: decimal("interest_income", { precision: 15, scale: 2 }),
  dividendIncome: decimal("dividend_income", { precision: 15, scale: 2 }),
  qualifiedDividends: decimal("qualified_dividends", { precision: 15, scale: 2 }),
  capitalGainsShortTerm: decimal("capital_gains_short_term", { precision: 15, scale: 2 }),
  capitalGainsLongTerm: decimal("capital_gains_long_term", { precision: 15, scale: 2 }),
  businessIncome: decimal("business_income", { precision: 15, scale: 2 }),
  rentalIncome: decimal("rental_income", { precision: 15, scale: 2 }),
  otherIncome: decimal("other_income", { precision: 15, scale: 2 }),
  totalIncome: decimal("total_income", { precision: 15, scale: 2 }),
  
  // Adjustments & Deductions
  adjustmentsToIncome: decimal("adjustments_to_income", { precision: 15, scale: 2 }),
  agi: decimal("agi", { precision: 15, scale: 2 }),
  standardDeduction: decimal("standard_deduction", { precision: 15, scale: 2 }),
  itemizedDeductions: decimal("itemized_deductions", { precision: 15, scale: 2 }),
  deductionUsed: varchar("deduction_used", { length: 20 }), // standard, itemized
  taxableIncome: decimal("taxable_income", { precision: 15, scale: 2 }),
  
  // Tax Calculations
  federalTaxBeforeCredits: decimal("federal_tax_before_credits", { precision: 15, scale: 2 }),
  taxCredits: decimal("tax_credits", { precision: 15, scale: 2 }),
  selfEmploymentTax: decimal("self_employment_tax", { precision: 15, scale: 2 }),
  alternativeMinimumTax: decimal("alternative_minimum_tax", { precision: 15, scale: 2 }),
  totalFederalTax: decimal("total_federal_tax", { precision: 15, scale: 2 }),
  effectiveTaxRate: decimal("effective_tax_rate", { precision: 5, scale: 2 }),
  marginalTaxBracket: decimal("marginal_tax_bracket", { precision: 5, scale: 2 }),
  
  // State Tax
  stateTaxPaid: decimal("state_tax_paid", { precision: 15, scale: 2 }),
  
  // Carryforwards & Special Items
  capitalLossCarryforward: decimal("capital_loss_carryforward", { precision: 15, scale: 2 }),
  charitableCarryforward: decimal("charitable_carryforward", { precision: 15, scale: 2 }),
  
  // Metadata
  filingStatus: varchar("filing_status", { length: 50 }),
  isAmended: boolean("is_amended").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tax_returns_user_year").on(table.userId, table.taxYear),
]);

// Tax Scenarios - what-if analysis
export const taxScenarios = pgTable("tax_scenarios", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  baseTaxReturnId: integer("base_tax_return_id").references(() => taxReturns.id, { onDelete: 'cascade' }),
  
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  scenarioType: varchar("scenario_type", { length: 50 }).notNull(), // gain_realization, charitable_giving, retirement_contribution, income_change, custom
  
  // Scenario inputs as JSON
  inputs: jsonb("inputs").notNull(), // e.g., { gainAmount: 50000, holdingPeriod: 'long' }
  
  // Computed results as JSON
  results: jsonb("results"), // e.g., { newTax: 45000, taxDelta: 5000, effectiveRate: 22.5 }
  
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tax_scenarios_user").on(table.userId),
]);

// Tax Insights - AI-generated observations
export const taxInsights = pgTable("tax_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  taxReturnId: integer("tax_return_id").references(() => taxReturns.id, { onDelete: 'cascade' }),
  
  insightType: varchar("insight_type", { length: 50 }).notNull(), // concentration_risk, amt_warning, bracket_opportunity, deduction_gap
  severity: varchar("severity", { length: 20 }).notNull(), // info, warning, opportunity
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  potentialImpact: decimal("potential_impact", { precision: 15, scale: 2 }),
  
  isAddressed: boolean("is_addressed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tax_insights_user").on(table.userId),
]);

// ============================================
// CHARGE ALLOCATION
// ============================================

// Portfolio Positions - current holdings
export const portfolioPositions = pgTable("portfolio_positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  symbol: varchar("symbol", { length: 20 }).notNull(),
  companyName: varchar("company_name", { length: 200 }),
  shares: decimal("shares", { precision: 15, scale: 6 }),
  costBasis: decimal("cost_basis", { precision: 15, scale: 2 }),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  unrealizedGain: decimal("unrealized_gain", { precision: 15, scale: 2 }),
  unrealizedGainPercent: decimal("unrealized_gain_percent", { precision: 8, scale: 2 }),
  
  // Tax lot info
  acquisitionDate: date("acquisition_date"),
  holdingPeriod: varchar("holding_period", { length: 20 }), // short_term, long_term
  accountType: varchar("account_type", { length: 50 }), // taxable, ira, roth_ira, 401k
  
  // Classification
  assetClass: varchar("asset_class", { length: 50 }), // equity, fixed_income, cash, alternative
  sector: varchar("sector", { length: 50 }),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_positions_user").on(table.userId),
  index("idx_positions_symbol").on(table.symbol),
]);

// Allocation Snapshots - point-in-time portfolio analysis
export const allocationSnapshots = pgTable("allocation_snapshots", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  snapshotDate: timestamp("snapshot_date").defaultNow(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  
  // Asset allocation percentages
  equityPercent: decimal("equity_percent", { precision: 5, scale: 2 }),
  fixedIncomePercent: decimal("fixed_income_percent", { precision: 5, scale: 2 }),
  cashPercent: decimal("cash_percent", { precision: 5, scale: 2 }),
  alternativePercent: decimal("alternative_percent", { precision: 5, scale: 2 }),
  
  // Risk metrics as JSON
  riskMetrics: jsonb("risk_metrics"), // { concentration: [...], volatility: {...}, beta: 1.2 }
  
  // Top holdings breakdown
  topHoldings: jsonb("top_holdings"), // [{ symbol, weight, value }]
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_allocation_snapshots_user").on(table.userId),
]);

// Investment Theses - AI-generated position analysis
export const investmentTheses = pgTable("investment_theses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  positionId: integer("position_id").references(() => portfolioPositions.id, { onDelete: 'cascade' }),
  
  symbol: varchar("symbol", { length: 20 }).notNull(),
  
  // Thesis content
  thesis: text("thesis").notNull(),
  riskFactors: jsonb("risk_factors"), // [{ factor, severity, description }]
  taxConsiderations: jsonb("tax_considerations"), // { holdingPeriod, unrealizedGain, taxImpact }
  concentrationAnalysis: text("concentration_analysis"),
  
  // Fit with financial profile
  profileFitScore: integer("profile_fit_score"), // 1-100
  profileFitNotes: text("profile_fit_notes"),
  
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_theses_user").on(table.userId),
]);

// ============================================
// CHARGE AI (Planning Engine)
// ============================================

// AI Sessions with context
export const aiSessions = pgTable("ai_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  sessionType: varchar("session_type", { length: 50 }).default('general'), // general, tax_planning, allocation_review, scenario_analysis
  
  // Context bundle - snapshot of relevant data at session start
  contextBundle: jsonb("context_bundle"), // { profile: {...}, taxSummary: {...}, allocationSummary: {...} }
  
  // Messages
  messages: jsonb("messages").notNull(), // [{ role, content, timestamp, citations? }]
  
  // Session metadata
  title: varchar("title", { length: 200 }),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_sessions_user").on(table.userId),
]);

// Planning Memos - saved AI-generated analyses
export const planningMemos = pgTable("planning_memos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: integer("session_id").references(() => aiSessions.id, { onDelete: 'set null' }),
  
  title: varchar("title", { length: 200 }).notNull(),
  memoType: varchar("memo_type", { length: 50 }).notNull(), // decision_analysis, tax_impact, allocation_review, scenario_comparison
  
  // Memo content
  summary: text("summary").notNull(),
  keyFindings: jsonb("key_findings"), // [{ finding, impact, recommendation }]
  assumptions: jsonb("assumptions"), // [{ assumption, source }]
  tradeoffs: jsonb("tradeoffs"), // [{ option, pros, cons }]
  
  // Related entities
  relatedTaxScenarioId: integer("related_tax_scenario_id").references(() => taxScenarios.id),
  relatedPositions: jsonb("related_positions"), // [symbol1, symbol2]
  
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_planning_memos_user").on(table.userId),
]);

// ============================================
// CFO RECOMMENDATIONS (CFP-Vetted Strategies)
// ============================================

// CFO Recommendations - actionable items users can complete
export const cfoRecommendations = pgTable("cfo_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Recommendation details
  category: varchar("category", { length: 50 }).notNull(), // tax, investment, savings, insurance, estate, debt
  strategy: varchar("strategy", { length: 100 }).notNull(), // e.g., "401k_max", "backdoor_roth", "tax_loss_harvest"
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  
  // CFP-vetted context
  cfpRationale: text("cfp_rationale"), // Why a CFP would recommend this
  applicableIncome: varchar("applicable_income", { length: 50 }), // "100k-200k", "200k+", "all"
  complexity: varchar("complexity", { length: 20 }), // simple, moderate, complex
  
  // Impact estimates
  estimatedSavings: decimal("estimated_savings", { precision: 15, scale: 2 }),
  timeHorizon: varchar("time_horizon", { length: 50 }), // immediate, this_year, multi_year
  priority: varchar("priority", { length: 20 }).notNull(), // urgent, high, medium, low
  
  // Action tracking
  status: varchar("status", { length: 20 }).default('pending'), // pending, in_progress, completed, dismissed
  completedAt: timestamp("completed_at"),
  dismissedReason: text("dismissed_reason"),
  
  // Gamification points
  pointValue: integer("point_value").default(10),
  
  // Source tracking
  generatedFrom: varchar("generated_from", { length: 50 }), // proactive_analysis, tax_return, portfolio_analysis
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_cfo_recommendations_user").on(table.userId),
  index("idx_cfo_recommendations_status").on(table.status),
]);

// User Achievement Tracking
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  achievementType: varchar("achievement_type", { length: 50 }).notNull(), // first_recommendation, tax_saver, portfolio_builder, etc.
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  pointsEarned: integer("points_earned").default(0),
  
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  index("idx_user_achievements_user").on(table.userId),
]);

// ============================================
// CROSS-PRODUCT ORCHESTRATION
// ============================================

// Insight Events - cross-product notifications
export const insightEvents = pgTable("insight_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  sourceProduct: varchar("source_product", { length: 50 }).notNull(), // charge_ai, tax_intel, allocation
  eventType: varchar("event_type", { length: 50 }).notNull(), // tax_change, position_change, scenario_created, insight_generated
  
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  payload: jsonb("payload"), // Event-specific data
  
  // Propagation tracking
  affectedProducts: jsonb("affected_products"), // ['tax_intel', 'charge_ai']
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_insight_events_user").on(table.userId),
  index("idx_insight_events_source").on(table.sourceProduct),
]);

// ============================================
// SOCIAL PROOF & TESTIMONIALS
// ============================================

// Testimonials - social proof for landing page
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userName: varchar("user_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  company: varchar("company", { length: 100 }),
  photoUrl: varchar("photo_url", { length: 500 }),
  quote: text("quote").notNull(),
  savingsAmount: integer("savings_amount").notNull(),
  rating: integer("rating").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// LEGACY TABLES (keeping for compatibility)
// ============================================

// Net Worth Snapshots
export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  asOfDate: timestamp("as_of_date").notNull().defaultNow(),
  
  // Assets
  cash: decimal("cash", { precision: 15, scale: 2 }).default('0'),
  brokerage: decimal("brokerage", { precision: 15, scale: 2 }).default('0'),
  retirement: decimal("retirement", { precision: 15, scale: 2 }).default('0'),
  realEstate: decimal("real_estate", { precision: 15, scale: 2 }).default('0'),
  businessEquity: decimal("business_equity", { precision: 15, scale: 2 }).default('0'),
  otherAssets: decimal("other_assets", { precision: 15, scale: 2 }).default('0'),
  
  // Liabilities
  mortgage: decimal("mortgage", { precision: 15, scale: 2 }).default('0'),
  studentLoans: decimal("student_loans", { precision: 15, scale: 2 }).default('0'),
  creditLines: decimal("credit_lines", { precision: 15, scale: 2 }).default('0'),
  otherLiabilities: decimal("other_liabilities", { precision: 15, scale: 2 }).default('0'),
  
  // Computed fields
  totalAssets: decimal("total_assets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: decimal("total_liabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: decimal("net_worth", { precision: 15, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_snapshots_user_date").on(table.userId, table.asOfDate),
]);

// Liquidity Profiles
export const liquidityProfiles = pgTable("liquidity_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  monthlyEssentialExpenses: decimal("monthly_essential_expenses", { precision: 15, scale: 2 }),
  targetReserveMonths: integer("target_reserve_months").default(6),
  currentCash: decimal("current_cash", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio Allocations (legacy)
export const portfolioAllocations = pgTable("portfolio_allocations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileName: varchar("profile_name", { length: 100 }).notNull(),
  equityPercent: integer("equity_percent").notNull(),
  fixedIncomePercent: integer("fixed_income_percent").notNull(),
  alternativesPercent: integer("alternatives_percent").notNull(),
  riskScore: integer("risk_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_allocations_user").on(table.userId),
]);

// Tax Strategies (predefined content)
export const taxStrategies = pgTable("tax_strategies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  tags: jsonb("tags").notNull(),
  whenItHelps: jsonb("when_it_helps").notNull(),
  considerations: text("considerations").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Saved Tax Strategies
export const savedTaxStrategies = pgTable("saved_tax_strategies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  strategyId: integer("strategy_id").notNull().references(() => taxStrategies.id, { onDelete: 'cascade' }),
  notes: text("notes"),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  index("idx_saved_strategies_user").on(table.userId),
]);

// AI Advisor Unlock Status (legacy)
export const advisorUnlockStatus = pgTable("advisor_unlock_status", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isUnlocked: boolean("is_unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Sessions (legacy)
export const chatSessions = pgTable("chat_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chat_sessions_user").on(table.userId),
]);

// Session Notes (legacy)
export const sessionNotes = pgTable("session_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: integer("session_id").references(() => chatSessions.id, { onDelete: 'cascade' }),
  summary: text("summary").notNull(),
  savedToPlaybook: boolean("saved_to_playbook").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_session_notes_user").on(table.userId),
]);

// Chat Feedback (legacy)
export const chatFeedback = pgTable("chat_feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: integer("session_id").references(() => chatSessions.id, { onDelete: 'cascade' }),
  messageIndex: integer("message_index").notNull(),
  feedback: varchar("feedback", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// CUSTOM PLAYBOOKS
// ============================================

export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // tax_optimization, investment, debt_payoff, retirement, emergency_fund, custom
  
  // Playbook structure
  steps: jsonb("steps").notNull(), // [{ id, title, description, actionType, isCompleted, completedAt, notes }]
  
  // Status tracking
  status: varchar("status", { length: 20 }).default('active'), // active, completed, archived
  progress: integer("progress").default(0), // 0-100
  
  // Metadata
  estimatedImpact: decimal("estimated_impact", { precision: 15, scale: 2 }),
  targetDate: date("target_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_playbooks_user").on(table.userId),
  index("idx_playbooks_status").on(table.status),
]);

// Playbook Templates - pre-built playbooks
export const playbookTemplates = pgTable("playbook_templates", {
  id: serial("id").primaryKey(),
  
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  
  // Template structure
  steps: jsonb("steps").notNull(),
  
  // Metadata
  estimatedTimeWeeks: integer("estimated_time_weeks"),
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
  tags: jsonb("tags"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// REFERRAL PROGRAM
// ============================================

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: varchar("referred_user_id").references(() => users.id, { onDelete: 'set null' }),
  referredEmail: varchar("referred_email", { length: 255 }),
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default('pending'),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }),
  rewardType: varchar("reward_type", { length: 50 }),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
  paidAt: timestamp("paid_at"),
}, (table) => [
  index("idx_referrals_referrer").on(table.referrerId),
  index("idx_referrals_code").on(table.referralCode),
  index("idx_referrals_status").on(table.status),
]);

// ============================================
// PRICE ALERTS
// ============================================

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  symbol: varchar("symbol", { length: 20 }).notNull(),
  alertType: varchar("alert_type", { length: 20 }).notNull(), // price_above, price_below, percent_change
  targetPrice: decimal("target_price", { precision: 15, scale: 2 }),
  percentThreshold: decimal("percent_threshold", { precision: 5, scale: 2 }),
  
  isActive: boolean("is_active").default(true),
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  triggeredPrice: decimal("triggered_price", { precision: 15, scale: 2 }),
  
  notificationMethod: varchar("notification_method", { length: 20 }).default('email'), // email, push
  lastChecked: timestamp("last_checked"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_price_alerts_user").on(table.userId),
  index("idx_price_alerts_symbol").on(table.symbol),
  index("idx_price_alerts_active").on(table.isActive),
]);

// ============================================
// BLOG POSTS (SEO)
// ============================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  metaDescription: varchar("meta_description", { length: 500 }),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 50 }),
  tags: jsonb("tags"),
  author: varchar("author", { length: 100 }).default('Charge Wealth Team'),
  featuredImage: varchar("featured_image", { length: 500 }),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  readTimeMinutes: integer("read_time_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_blog_posts_slug").on(table.slug),
  index("idx_blog_posts_published").on(table.isPublished),
]);

// ============================================
// WAITLIST
// ============================================

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 50 }).default('website'),
  status: varchar("status", { length: 20 }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_waitlist_email").on(table.email),
]);

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// New types
export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type InsertFinancialProfile = typeof financialProfiles.$inferInsert;

export type FinancialDocument = typeof financialDocuments.$inferSelect;
export type InsertFinancialDocument = typeof financialDocuments.$inferInsert;

export type TaxReturn = typeof taxReturns.$inferSelect;
export type InsertTaxReturn = typeof taxReturns.$inferInsert;

export type TaxScenario = typeof taxScenarios.$inferSelect;
export type InsertTaxScenario = typeof taxScenarios.$inferInsert;

export type TaxInsight = typeof taxInsights.$inferSelect;
export type InsertTaxInsight = typeof taxInsights.$inferInsert;

export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type InsertPortfolioPosition = typeof portfolioPositions.$inferInsert;

export type AllocationSnapshot = typeof allocationSnapshots.$inferSelect;
export type InsertAllocationSnapshot = typeof allocationSnapshots.$inferInsert;

export type InvestmentThesis = typeof investmentTheses.$inferSelect;
export type InsertInvestmentThesis = typeof investmentTheses.$inferInsert;

export type AISession = typeof aiSessions.$inferSelect;
export type InsertAISession = typeof aiSessions.$inferInsert;

export type PlanningMemo = typeof planningMemos.$inferSelect;
export type InsertPlanningMemo = typeof planningMemos.$inferInsert;

export type InsightEvent = typeof insightEvents.$inferSelect;
export type InsertInsightEvent = typeof insightEvents.$inferInsert;

// Playbook types
export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = typeof playbooks.$inferInsert;

export type PlaybookTemplate = typeof playbookTemplates.$inferSelect;
export type InsertPlaybookTemplate = typeof playbookTemplates.$inferInsert;

// Waitlist types
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;

// Legacy types
export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
export type InsertNetWorthSnapshot = typeof netWorthSnapshots.$inferInsert;

export type LiquidityProfile = typeof liquidityProfiles.$inferSelect;
export type InsertLiquidityProfile = typeof liquidityProfiles.$inferInsert;

export type PortfolioAllocation = typeof portfolioAllocations.$inferSelect;
export type InsertPortfolioAllocation = typeof portfolioAllocations.$inferInsert;

export type TaxStrategy = typeof taxStrategies.$inferSelect;
export type SavedTaxStrategy = typeof savedTaxStrategies.$inferSelect;
export type InsertSavedTaxStrategy = typeof savedTaxStrategies.$inferInsert;

export type AdvisorUnlockStatus = typeof advisorUnlockStatus.$inferSelect;
export type InsertAdvisorUnlockStatus = typeof advisorUnlockStatus.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = typeof sessionNotes.$inferInsert;

export type ChatFeedback = typeof chatFeedback.$inferSelect;
export type InsertChatFeedback = typeof chatFeedback.$inferInsert;

// Referral types
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// Price Alert types
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

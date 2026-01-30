// Storage layer for database operations
// Referenced from Replit Auth blueprint

import {
  users,
  netWorthSnapshots,
  liquidityProfiles,
  portfolioAllocations,
  savedTaxStrategies,
  advisorUnlockStatus,
  chatSessions,
  sessionNotes,
  chatFeedback,
  waitlist,
  financialProfiles,
  financialDocuments,
  taxReturns,
  portfolioPositions,
  playbooks,
  playbookTemplates,
  cfoRecommendations,
  userAchievements,
  testimonials,
  referrals,
  priceAlerts,
  marketWatchlist,
  type User,
  type UpsertUser,
  type NetWorthSnapshot,
  type InsertNetWorthSnapshot,
  type LiquidityProfile,
  type InsertLiquidityProfile,
  type PortfolioAllocation,
  type InsertPortfolioAllocation,
  type AdvisorUnlockStatus,
  type InsertAdvisorUnlockStatus,
  type ChatSession,
  type InsertChatSession,
  type SessionNote,
  type InsertSessionNote,
  type ChatFeedback,
  type InsertChatFeedback,
  type Waitlist,
  type FinancialProfile,
  type FinancialDocument,
  type TaxReturn,
  type PortfolioPosition,
  type Playbook,
  type InsertPlaybook,
  type PlaybookTemplate,
  type PriceAlert,
  type InsertPriceAlert,
  type MarketWatchlistItem,
  type InsertMarketWatchlistItem,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (Required by Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Net Worth operations
  getNetWorthSnapshots(userId: string, limit?: number): Promise<NetWorthSnapshot[]>;
  createNetWorthSnapshot(snapshot: InsertNetWorthSnapshot): Promise<NetWorthSnapshot>;
  getLatestSnapshot(userId: string): Promise<NetWorthSnapshot | undefined>;
  
  // Liquidity operations
  getLiquidityProfile(userId: string): Promise<LiquidityProfile | undefined>;
  upsertLiquidityProfile(profile: InsertLiquidityProfile): Promise<LiquidityProfile>;
  
  // Allocation operations
  getPortfolioAllocations(userId: string): Promise<PortfolioAllocation[]>;
  createPortfolioAllocation(allocation: InsertPortfolioAllocation): Promise<PortfolioAllocation>;
  
  // AI Advisor operations
  calculateProfileCompletion(userId: string): Promise<{ percentage: number; checklist: any[] }>;
  getAdvisorUnlockStatus(userId: string): Promise<AdvisorUnlockStatus | undefined>;
  upsertAdvisorUnlockStatus(status: InsertAdvisorUnlockStatus): Promise<AdvisorUnlockStatus>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, messages: any[]): Promise<ChatSession>;
  getChatSession(userId: string): Promise<ChatSession | undefined>;
  createSessionNote(note: InsertSessionNote): Promise<SessionNote>;
  createChatFeedback(feedback: InsertChatFeedback): Promise<ChatFeedback>;
  getSavedTaxStrategiesCount(userId: string): Promise<number>;
  
  // Waitlist operations
  getWaitlistEntry(email: string): Promise<Waitlist | undefined>;
  addToWaitlist(email: string): Promise<Waitlist>;
  
  // New Intelligence Platform operations
  getFinancialProfile(userId: string): Promise<FinancialProfile | undefined>;
  upsertFinancialProfile(profile: any): Promise<FinancialProfile>;
  getTaxReturns(userId: string): Promise<TaxReturn[]>;
  createTaxReturn(taxReturn: any): Promise<TaxReturn>;
  getFinancialDocuments(userId: string): Promise<FinancialDocument[]>;
  createFinancialDocument(document: any): Promise<FinancialDocument>;
  updateFinancialDocument(id: number, updates: any): Promise<FinancialDocument | undefined>;
  deleteFinancialDocument(id: number, userId: string): Promise<boolean>;
  getPortfolioPositions(userId: string): Promise<PortfolioPosition[]>;
  createPortfolioPosition(position: any): Promise<PortfolioPosition>;
  
  // Playbook operations
  getPlaybooks(userId: string): Promise<Playbook[]>;
  getPlaybook(id: number, userId: string): Promise<Playbook | undefined>;
  createPlaybook(playbook: InsertPlaybook): Promise<Playbook>;
  updatePlaybook(id: number, userId: string, updates: Partial<InsertPlaybook>): Promise<Playbook | undefined>;
  deletePlaybook(id: number, userId: string): Promise<boolean>;
  getPlaybookTemplates(): Promise<PlaybookTemplate[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required by Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    subscriptionStatus: string;
    subscriptionType: string;
    stripeCustomerId?: string | null;
    subscriptionStartDate?: Date | null;
    subscriptionEndDate?: Date | null;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: subscriptionData.subscriptionStatus,
        subscriptionType: subscriptionData.subscriptionType,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        subscriptionStartDate: subscriptionData.subscriptionStartDate,
        subscriptionEndDate: subscriptionData.subscriptionEndDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateBlogSubscription(userId: string, subscriptionData: {
    blogSubscriptionStatus?: string;
    blogSubscriptionType?: string | null;
    blogSubscriptionStartDate?: Date | null;
    blogSubscriptionEndDate?: Date | null;
    stripeBlogSubscriptionId?: string | null;
  }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    
    if (subscriptionData.blogSubscriptionStatus !== undefined) {
      updateData.blogSubscriptionStatus = subscriptionData.blogSubscriptionStatus;
    }
    if (subscriptionData.blogSubscriptionType !== undefined) {
      updateData.blogSubscriptionType = subscriptionData.blogSubscriptionType;
    }
    if (subscriptionData.blogSubscriptionStartDate !== undefined) {
      updateData.blogSubscriptionStartDate = subscriptionData.blogSubscriptionStartDate;
    }
    if (subscriptionData.blogSubscriptionEndDate !== undefined) {
      updateData.blogSubscriptionEndDate = subscriptionData.blogSubscriptionEndDate;
    }
    if (subscriptionData.stripeBlogSubscriptionId !== undefined) {
      updateData.stripeBlogSubscriptionId = subscriptionData.stripeBlogSubscriptionId;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // Net Worth operations
  async getNetWorthSnapshots(userId: string, limit: number = 10): Promise<NetWorthSnapshot[]> {
    return await db
      .select()
      .from(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, userId))
      .orderBy(desc(netWorthSnapshots.asOfDate))
      .limit(limit);
  }
  
  async createNetWorthSnapshot(snapshotData: InsertNetWorthSnapshot): Promise<NetWorthSnapshot> {
    const [snapshot] = await db
      .insert(netWorthSnapshots)
      .values(snapshotData)
      .returning();
    return snapshot;
  }
  
  async getLatestSnapshot(userId: string): Promise<NetWorthSnapshot | undefined> {
    const [snapshot] = await db
      .select()
      .from(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, userId))
      .orderBy(desc(netWorthSnapshots.asOfDate))
      .limit(1);
    return snapshot;
  }
  
  // Liquidity operations
  async getLiquidityProfile(userId: string): Promise<LiquidityProfile | undefined> {
    const [profile] = await db
      .select()
      .from(liquidityProfiles)
      .where(eq(liquidityProfiles.userId, userId));
    return profile;
  }
  
  async upsertLiquidityProfile(profileData: InsertLiquidityProfile): Promise<LiquidityProfile> {
    const [profile] = await db
      .insert(liquidityProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: liquidityProfiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }
  
  // Allocation operations
  async getPortfolioAllocations(userId: string): Promise<PortfolioAllocation[]> {
    return await db
      .select()
      .from(portfolioAllocations)
      .where(eq(portfolioAllocations.userId, userId))
      .orderBy(desc(portfolioAllocations.createdAt));
  }
  
  async createPortfolioAllocation(allocationData: InsertPortfolioAllocation): Promise<PortfolioAllocation> {
    const [allocation] = await db
      .insert(portfolioAllocations)
      .values(allocationData)
      .returning();
    return allocation;
  }
  
  // AI Advisor operations
  async calculateProfileCompletion(userId: string): Promise<{ percentage: number; checklist: any[] }> {
    // Check each completion criteria (25% each)
    const [hasNetWorth] = await db
      .select({ count: count() })
      .from(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, userId));
    
    const hasLiquidity = await this.getLiquidityProfile(userId);
    
    const [allocations] = await db
      .select({ count: count() })
      .from(portfolioAllocations)
      .where(eq(portfolioAllocations.userId, userId));
    
    const [savedStrategies] = await db
      .select({ count: count() })
      .from(savedTaxStrategies)
      .where(eq(savedTaxStrategies.userId, userId));
    
    const netWorthComplete = hasNetWorth.count > 0;
    const liquidityComplete = !!hasLiquidity;
    const allocationComplete = allocations.count > 0;
    const taxComplete = savedStrategies.count >= 3;
    
    const checklist = [
      { id: 'networth', label: 'Save a Net Worth snapshot', complete: netWorthComplete, link: '/dashboard/net-worth' },
      { id: 'liquidity', label: 'Set your Liquidity Guardrail', complete: liquidityComplete, link: '/dashboard/liquidity' },
      { id: 'allocation', label: 'Choose an Allocation target', complete: allocationComplete, link: '/dashboard/allocation' },
      { id: 'tax', label: 'Save 3+ Tax Strategies', complete: taxComplete, link: '/dashboard/tax-lab' },
    ];
    
    const completedCount = checklist.filter(item => item.complete).length;
    const percentage = Math.round((completedCount / 4) * 100);
    
    return { percentage, checklist };
  }
  
  async getAdvisorUnlockStatus(userId: string): Promise<AdvisorUnlockStatus | undefined> {
    const [status] = await db
      .select()
      .from(advisorUnlockStatus)
      .where(eq(advisorUnlockStatus.userId, userId));
    return status;
  }
  
  async upsertAdvisorUnlockStatus(statusData: InsertAdvisorUnlockStatus): Promise<AdvisorUnlockStatus> {
    const [status] = await db
      .insert(advisorUnlockStatus)
      .values(statusData)
      .onConflictDoUpdate({
        target: advisorUnlockStatus.userId,
        set: {
          ...statusData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return status;
  }
  
  async createChatSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(sessionData)
      .returning();
    return session;
  }
  
  async updateChatSession(id: number, messages: any[]): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({ messages, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return session;
  }
  
  async getChatSession(userId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(1);
    return session;
  }
  
  async createSessionNote(noteData: InsertSessionNote): Promise<SessionNote> {
    const [note] = await db
      .insert(sessionNotes)
      .values(noteData)
      .returning();
    return note;
  }
  
  async createChatFeedback(feedbackData: InsertChatFeedback): Promise<ChatFeedback> {
    const [feedback] = await db
      .insert(chatFeedback)
      .values(feedbackData)
      .returning();
    return feedback;
  }
  
  async getSavedTaxStrategiesCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(savedTaxStrategies)
      .where(eq(savedTaxStrategies.userId, userId));
    return result.count;
  }
  
  // Waitlist operations
  async getWaitlistEntry(email: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()));
    return entry;
  }
  
  async addToWaitlist(email: string): Promise<Waitlist> {
    const [entry] = await db
      .insert(waitlist)
      .values({ email: email.toLowerCase() })
      .returning();
    return entry;
  }
  
  // New Intelligence Platform operations
  async getFinancialProfile(userId: string): Promise<FinancialProfile | undefined> {
    const [profile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId));
    return profile;
  }
  
  async upsertFinancialProfile(profileData: any): Promise<FinancialProfile> {
    const [profile] = await db
      .insert(financialProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: financialProfiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }
  
  async getTaxReturns(userId: string): Promise<TaxReturn[]> {
    return await db
      .select()
      .from(taxReturns)
      .where(eq(taxReturns.userId, userId))
      .orderBy(desc(taxReturns.taxYear));
  }
  
  async createTaxReturn(taxReturnData: any): Promise<TaxReturn> {
    const [taxReturn] = await db
      .insert(taxReturns)
      .values(taxReturnData)
      .returning();
    return taxReturn;
  }
  
  async getFinancialDocuments(userId: string): Promise<FinancialDocument[]> {
    return await db
      .select()
      .from(financialDocuments)
      .where(eq(financialDocuments.userId, userId))
      .orderBy(desc(financialDocuments.uploadedAt));
  }
  
  async createFinancialDocument(documentData: any): Promise<FinancialDocument> {
    const [document] = await db
      .insert(financialDocuments)
      .values(documentData)
      .returning();
    return document;
  }
  
  async updateFinancialDocument(id: number, updates: any): Promise<FinancialDocument | undefined> {
    const [document] = await db
      .update(financialDocuments)
      .set({ ...updates, processedAt: new Date() })
      .where(eq(financialDocuments.id, id))
      .returning();
    return document;
  }
  
  async deleteFinancialDocument(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(financialDocuments)
      .where(and(eq(financialDocuments.id, id), eq(financialDocuments.userId, userId)))
      .returning({ id: financialDocuments.id });
    return result.length > 0;
  }
  
  async getPortfolioPositions(userId: string): Promise<PortfolioPosition[]> {
    return await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.userId, userId))
      .orderBy(desc(portfolioPositions.createdAt));
  }
  
  async createPortfolioPosition(positionData: any): Promise<PortfolioPosition> {
    const [position] = await db
      .insert(portfolioPositions)
      .values(positionData)
      .returning();
    return position;
  }
  
  // Playbook operations
  async getPlaybooks(userId: string): Promise<Playbook[]> {
    return await db
      .select()
      .from(playbooks)
      .where(eq(playbooks.userId, userId))
      .orderBy(desc(playbooks.createdAt));
  }
  
  async getPlaybook(id: number, userId: string): Promise<Playbook | undefined> {
    const [playbook] = await db
      .select()
      .from(playbooks)
      .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)));
    return playbook;
  }
  
  async createPlaybook(playbookData: InsertPlaybook): Promise<Playbook> {
    const [playbook] = await db
      .insert(playbooks)
      .values(playbookData)
      .returning();
    return playbook;
  }
  
  async updatePlaybook(id: number, userId: string, updates: Partial<InsertPlaybook>): Promise<Playbook | undefined> {
    const [playbook] = await db
      .update(playbooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)))
      .returning();
    return playbook;
  }
  
  async deletePlaybook(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(playbooks)
      .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)))
      .returning();
    return result.length > 0;
  }
  
  async getPlaybookTemplates(): Promise<PlaybookTemplate[]> {
    return await db
      .select()
      .from(playbookTemplates)
      .where(eq(playbookTemplates.isActive, true))
      .orderBy(playbookTemplates.category);
  }
  
  // CFO Recommendations
  async getCfoRecommendations(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(cfoRecommendations)
      .where(eq(cfoRecommendations.userId, userId))
      .orderBy(desc(cfoRecommendations.createdAt));
  }
  
  async getPendingRecommendations(userId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(cfoRecommendations)
      .where(eq(cfoRecommendations.userId, userId))
      .orderBy(desc(cfoRecommendations.createdAt));
    return results.filter(r => r.status === 'pending' || r.status === 'in_progress');
  }
  
  async createCfoRecommendation(recommendation: any): Promise<any> {
    const [rec] = await db
      .insert(cfoRecommendations)
      .values(recommendation)
      .returning();
    return rec;
  }
  
  async updateCfoRecommendation(id: number, userId: string, updates: any): Promise<any> {
    const [rec] = await db
      .update(cfoRecommendations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cfoRecommendations.id, id))
      .returning();
    if (rec && rec.userId === userId) {
      return rec;
    }
    return undefined;
  }
  
  async getCompletedRecommendationsCount(userId: string): Promise<number> {
    const results = await db
      .select()
      .from(cfoRecommendations)
      .where(eq(cfoRecommendations.userId, userId));
    return results.filter(r => r.status === 'completed').length;
  }
  
  async getTotalPointsEarned(userId: string): Promise<number> {
    const completed = await db
      .select()
      .from(cfoRecommendations)
      .where(eq(cfoRecommendations.userId, userId));
    return completed
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.pointValue || 0), 0);
  }
  
  // User Achievements
  async getUserAchievements(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }
  
  async createAchievement(achievement: any): Promise<any> {
    const [ach] = await db
      .insert(userAchievements)
      .values(achievement)
      .returning();
    return ach;
  }
  
  // Testimonials
  async getRandomTestimonials(limit: number = 6): Promise<any[]> {
    const results = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
    return results;
  }
  
  async seedTestimonials(): Promise<void> {
    const existingCount = await db.select({ count: count() }).from(testimonials);
    if (existingCount[0].count > 0) return;
    
    const sampleTestimonials = [
      { userName: 'Sarah Chen', role: 'Software Engineer', company: 'Tech Startup', quote: 'Charge helped me maximize my 401k and discover the backdoor Roth strategy. The tax savings were immediate and substantial.', savingsAmount: 4200 },
      { userName: 'Michael Rodriguez', role: 'Physician', company: 'Private Practice', quote: 'Finally, a financial tool that doesn\'t try to sell me products. The cost segregation analysis alone saved me a fortune on my rental properties.', savingsAmount: 12500 },
      { userName: 'Jennifer Park', role: 'Marketing Director', company: 'Fortune 500', quote: 'I was leaving money on the table with my RSUs. Charge\'s tax-loss harvesting recommendations changed everything.', savingsAmount: 8700 },
      { userName: 'David Thompson', role: 'Small Business Owner', company: 'E-commerce', quote: 'As a business owner, taxes are complicated. Charge broke down my options clearly and helped me structure my entity for maximum savings.', savingsAmount: 15300 },
      { userName: 'Lisa Nakamura', role: 'Investment Banker', company: 'Wall Street Firm', quote: 'I thought I knew about money. Charge showed me blind spots in my portfolio concentration I never noticed.', savingsAmount: 6800 },
      { userName: 'Robert Williams', role: 'Real Estate Developer', company: 'Development Group', quote: 'The IDC investment strategies Charge recommended fit perfectly with my tax situation. Game changer.', savingsAmount: 22000 },
      { userName: 'Amanda Foster', role: 'Tech Executive', company: 'SaaS Company', quote: 'Between ISO optimization and charitable giving strategies, Charge paid for itself 50 times over.', savingsAmount: 18400 },
      { userName: 'James Mitchell', role: 'Attorney', company: 'Law Firm Partner', quote: 'Clear, actionable advice without the typical financial industry BS. My kind of tool.', savingsAmount: 9200 },
      { userName: 'Emily Zhang', role: 'Product Manager', company: 'FAANG', quote: 'The AI advisor helped me think through my ESPP strategy in a way my accountant never could.', savingsAmount: 5600 },
      { userName: 'Christopher Lee', role: 'Consultant', company: 'Big 4 Firm', quote: 'Worth every penny. The tax scenario planning feature alone saved me from a costly mistake.', savingsAmount: 7300 },
    ];
    
    await db.insert(testimonials).values(sampleTestimonials);
  }
  
  // Member Stats
  async getMemberStats(): Promise<{ memberCount: number; totalSavings: number }> {
    const userCount = await db.select({ count: count() }).from(users);
    const actualCount = userCount[0].count || 0;
    const displayCount = Math.max(actualCount, 10);
    const avgSavingsPerMember = 3250;
    const totalSavings = displayCount * avgSavingsPerMember;
    
    return {
      memberCount: displayCount,
      totalSavings
    };
  }
  
  // Founding Member Stats
  async getFoundingMemberCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.subscriptionType, 'lifetime'),
        eq(users.subscriptionStatus, 'active')
      ));
    return result?.count || 0;
  }
  
  // ============================================
  // REFERRAL PROGRAM
  // ============================================
  
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    if (user.referralCode) {
      return user.referralCode;
    }
    
    const baseName = (user.firstName || 'USER').toUpperCase().slice(0, 6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    let code = `${baseName}${randomDigits}`;
    
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
      if (existing.length === 0) break;
      code = `${baseName}${Math.floor(1000 + Math.random() * 9000)}`;
      attempts++;
    }
    
    await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    return code;
  }
  
  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code.toUpperCase()));
    return user;
  }
  
  async getReferralStats(userId: string): Promise<{
    referralCode: string;
    referralCount: number;
    referralEarnings: string;
    pendingReferrals: number;
    completedReferrals: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = await this.generateReferralCode(userId);
    }
    
    const [pending] = await db.select({ count: count() }).from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, 'pending')));
    
    const [completed] = await db.select({ count: count() }).from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, 'completed')));
    
    return {
      referralCode,
      referralCount: Number(user.referralCount) || 0,
      referralEarnings: user.referralEarnings || '0',
      pendingReferrals: pending?.count || 0,
      completedReferrals: completed?.count || 0,
    };
  }
  
  async trackReferralClick(referralCode: string, referredEmail?: string): Promise<any> {
    const referrer = await this.getUserByReferralCode(referralCode);
    if (!referrer) return null;
    
    const [existing] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referralCode, referralCode.toUpperCase()),
        referredEmail ? eq(referrals.referredEmail, referredEmail) : sql`1=0`
      ))
      .limit(1);
    
    if (existing) return existing;
    
    const [referral] = await db.insert(referrals).values({
      referrerId: referrer.id,
      referralCode: referralCode.toUpperCase(),
      referredEmail: referredEmail || null,
      status: 'pending',
    }).returning();
    
    return referral;
  }
  
  async completeReferral(referralCode: string, referredUserId: string, discountApplied: number): Promise<any> {
    const referrer = await this.getUserByReferralCode(referralCode);
    if (!referrer) return null;
    
    const [referral] = await db.insert(referrals).values({
      referrerId: referrer.id,
      referredUserId,
      referralCode: referralCode.toUpperCase(),
      status: 'completed',
      discountApplied: discountApplied.toString(),
      rewardType: 'credit',
      rewardAmount: '50',
      convertedAt: new Date(),
    }).returning();
    
    const newCount = (Number(referrer.referralCount) || 0) + 1;
    const newEarnings = (parseFloat(referrer.referralEarnings || '0') + 50).toString();
    
    await db.update(users).set({
      referralCount: newCount,
      referralEarnings: newEarnings,
      updatedAt: new Date(),
    }).where(eq(users.id, referrer.id));
    
    const referred = await this.getUser(referredUserId);
    if (referred) {
      await db.update(users).set({
        referredBy: referralCode.toUpperCase(),
        updatedAt: new Date(),
      }).where(eq(users.id, referredUserId));
    }
    
    return referral;
  }
  
  async getTopReferrers(limit: number = 10): Promise<{
    userId: string;
    firstName: string | null;
    referralCount: number;
    referralEarnings: string;
  }[]> {
    const results = await db.select({
      userId: users.id,
      firstName: users.firstName,
      referralCount: users.referralCount,
      referralEarnings: users.referralEarnings,
    })
    .from(users)
    .where(gte(users.referralCount, 1))
    .orderBy(desc(users.referralCount))
    .limit(limit);
    
    return results.map(r => ({
      userId: r.userId,
      firstName: r.firstName,
      referralCount: Number(r.referralCount) || 0,
      referralEarnings: r.referralEarnings || '0',
    }));
  }
  
  async getReferralHistory(userId: string): Promise<any[]> {
    const results = await db.select({
      id: referrals.id,
      referredEmail: referrals.referredEmail,
      status: referrals.status,
      rewardAmount: referrals.rewardAmount,
      createdAt: referrals.createdAt,
      convertedAt: referrals.convertedAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));
    
    return results;
  }

  async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    const results = await db.select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, userId))
      .orderBy(desc(priceAlerts.createdAt));
    return results;
  }

  async getActivePriceAlerts(): Promise<PriceAlert[]> {
    const results = await db.select()
      .from(priceAlerts)
      .where(and(
        eq(priceAlerts.isActive, true),
        eq(priceAlerts.isTriggered, false)
      ));
    return results;
  }

  async createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert> {
    const [result] = await db.insert(priceAlerts).values(alert).returning();
    return result;
  }

  async updatePriceAlert(id: number, userId: string, updates: Partial<InsertPriceAlert>): Promise<PriceAlert | undefined> {
    const [result] = await db.update(priceAlerts)
      .set(updates)
      .where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, userId)))
      .returning();
    return result;
  }

  async deletePriceAlert(id: number, userId: string): Promise<boolean> {
    await db.delete(priceAlerts)
      .where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, userId)));
    return true;
  }

  async triggerPriceAlert(id: number, triggeredPrice: number): Promise<PriceAlert | undefined> {
    const [result] = await db.update(priceAlerts)
      .set({
        isTriggered: true,
        triggeredAt: new Date(),
        triggeredPrice: triggeredPrice.toString(),
        isActive: false,
      })
      .where(eq(priceAlerts.id, id))
      .returning();
    return result;
  }

  async updatePortfolioPositionPrice(id: number, userId: string, currentPrice: number, currentValue: number, unrealizedGain: number, unrealizedGainPercent: number): Promise<PortfolioPosition | undefined> {
    const [result] = await db.update(portfolioPositions)
      .set({
        currentPrice: currentPrice.toString(),
        currentValue: currentValue.toString(),
        unrealizedGain: unrealizedGain.toString(),
        unrealizedGainPercent: unrealizedGainPercent.toString(),
        lastUpdated: new Date(),
      })
      .where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)))
      .returning();
    return result;
  }

  // Market Watchlist
  async getMarketWatchlist(): Promise<MarketWatchlistItem[]> {
    return await db.select()
      .from(marketWatchlist)
      .where(eq(marketWatchlist.isActive, true))
      .orderBy(marketWatchlist.category, marketWatchlist.sortOrder);
  }

  async addWatchlistItem(item: InsertMarketWatchlistItem): Promise<MarketWatchlistItem> {
    const [result] = await db.insert(marketWatchlist)
      .values(item)
      .returning();
    return result;
  }

  async updateWatchlistItem(id: number, updates: Partial<InsertMarketWatchlistItem>): Promise<MarketWatchlistItem | undefined> {
    const [result] = await db.update(marketWatchlist)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketWatchlist.id, id))
      .returning();
    return result;
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    await db.delete(marketWatchlist)
      .where(eq(marketWatchlist.id, id));
  }

  async seedDefaultWatchlist(): Promise<void> {
    const existing = await db.select().from(marketWatchlist).limit(1);
    if (existing.length > 0) return; // Already seeded
    
    const defaults = [
      // Stocks
      { category: 'stocks', label: 'NVDA', sortOrder: 1 },
      { category: 'stocks', label: 'MSFT', sortOrder: 2 },
      { category: 'stocks', label: 'GOOGL', sortOrder: 3 },
      { category: 'stocks', label: 'AMZN', sortOrder: 4 },
      { category: 'stocks', label: 'META', sortOrder: 5 },
      // Sectors
      { category: 'sectors', label: 'Technology', sortOrder: 1 },
      { category: 'sectors', label: 'Healthcare', sortOrder: 2 },
      { category: 'sectors', label: 'Energy', sortOrder: 3 },
      // Themes
      { category: 'themes', label: 'AI/ML', sortOrder: 1 },
      { category: 'themes', label: 'Clean Energy', sortOrder: 2 },
      { category: 'themes', label: 'Dividend Growth', sortOrder: 3 },
      // What we're watching
      { category: 'watching', label: 'Fed Rate Decision', description: 'Next FOMC meeting could signal rate cuts in 2026. Watch for language changes.', sortOrder: 1 },
      { category: 'watching', label: 'Earnings Season', description: 'Big tech reports this week. NVDA and MSFT guidance will set the tone.', sortOrder: 2 },
      { category: 'watching', label: 'Tax-Loss Harvesting', description: 'Q1 volatility creates opportunities. Review losers before wash sale window.', sortOrder: 3 },
    ];
    
    for (const item of defaults) {
      await db.insert(marketWatchlist).values(item);
    }
  }
}

export const storage = new DatabaseStorage();

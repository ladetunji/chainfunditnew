import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns, campaignScreenings, users } from '@/lib/schema';
import { DEFAULT_SCREENING_SUMMARY } from './constants';
import { runSynchronousScreeningChecks } from './sync-checks';
import {
  moderateCampaignText,
  inspectMediaAssets,
  evaluateWatchlistMatches,
  calculateFraudScore,
} from './analyzers';
import { evaluateScreening } from './rules-engine';
import {
  AsynchronousCheckResult,
  ScreeningOutcome,
  SynchronousCheckResult,
} from './types';

const MAX_CLAIM_BATCH = 5;

interface CampaignContext {
  id: string;
  title: string;
  description: string;
  reason?: string | null;
  fundraisingFor?: string | null;
  galleryImages?: string | null;
  documents?: string | null;
  goalAmount: string;
  currency: string;
  duration?: string | null;
  creatorId: string;
  createdAt: Date;
}

interface CreatorContext {
  id: string;
  email: string;
  createdAt: Date;
}

const parseNumber = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseJsonArray = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const riskToDbString = (risk: number) => risk.toFixed(2);

export async function enqueueCampaignScreeningJob(campaignId: string, syncResult: SynchronousCheckResult) {
  await db.insert(campaignScreenings).values({
    campaignId,
    jobType: 'initial',
    status: 'pending',
    syncFindings: syncResult,
    riskScore: riskToDbString(syncResult.riskScore),
  });
}

export async function runSyncScreeningForCampaign(input: {
  title: string;
  description: string;
  reason?: string | null;
  fundraisingFor?: string | null;
  goalAmount: number;
  currency: string;
  creatorEmail?: string;
}) {
  return runSynchronousScreeningChecks(input);
}

async function fetchCampaignContext(campaignId: string) {
  const record = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!record) return undefined;

  const creator = record.creatorId
    ? await db.query.users.findFirst({
        where: eq(users.id, record.creatorId),
      })
    : undefined;

  return {
    campaign: record as CampaignContext,
    creator: creator as CreatorContext | undefined,
  };
}

async function runAsyncChecks(context: CampaignContext, syncResult: SynchronousCheckResult, creator?: CreatorContext) {
  const mediaAssets = [
    ...parseJsonArray(context.galleryImages),
    ...parseJsonArray(context.documents),
  ];

  const haystack = [
    context.title,
    context.description,
    context.reason,
    context.fundraisingFor,
    creator?.email,
  ].filter(Boolean) as string[];

  const [textModeration, mediaAnalysis, watchlist] = await Promise.all([
    moderateCampaignText(context.description),
    Promise.resolve(inspectMediaAssets(mediaAssets)),
    Promise.resolve(evaluateWatchlistMatches(haystack)),
  ]);

  const creatorAgeInDays = creator
    ? Math.max(
        0,
        Math.round(
          (Date.now() - new Date(creator.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const fraud = calculateFraudScore({
    goalAmount: parseNumber(context.goalAmount),
    accountAgeInDays: creatorAgeInDays,
    missingDetails: !context.reason || !context.fundraisingFor,
    syncRiskScore: syncResult.riskScore,
    donationWindowDays: context.duration ? Number.parseInt(context.duration, 10) || undefined : undefined,
  });

  const result: AsynchronousCheckResult = {
    fraud,
  };

  if (textModeration) result.textModeration = textModeration;
  if (mediaAnalysis) result.mediaAnalysis = mediaAnalysis;
  if (watchlist) result.watchlist = watchlist;

  return result;
}

async function updateCampaignCompliance(
  campaignId: string,
  outcome: ScreeningOutcome
) {
  await db
    .update(campaigns)
    .set({
      complianceStatus: outcome.complianceStatus,
      complianceSummary: outcome.summary,
      complianceFlags: outcome.flags,
      riskScore: riskToDbString(outcome.riskScore),
      reviewRequired: outcome.complianceStatus === 'in_review',
      lastScreenedAt: new Date(),
      blockedAt: outcome.complianceStatus === 'blocked' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));
}

async function completeScreeningJob(
  jobId: string,
  outcome: ScreeningOutcome,
  asyncResult: AsynchronousCheckResult
) {
  await db
    .update(campaignScreenings)
    .set({
      status: 'completed',
      asyncFindings: asyncResult,
      decision: outcome.decision,
      riskScore: riskToDbString(outcome.riskScore),
      failureReason: null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(campaignScreenings.id, jobId));
}

async function failScreeningJob(jobId: string, error: unknown) {
  await db
    .update(campaignScreenings)
    .set({
      status: 'failed',
      failureReason:
        error instanceof Error ? error.message : 'Failed to process screening job',
      updatedAt: new Date(),
    })
    .where(eq(campaignScreenings.id, jobId));
}

async function claimPendingJobs(limit: number) {
  const pending = await db
    .select()
    .from(campaignScreenings)
    .where(eq(campaignScreenings.status, 'pending'))
    .orderBy(desc(campaignScreenings.createdAt))
    .limit(Math.min(limit, MAX_CLAIM_BATCH));

  const claimed = [];
  for (const job of pending) {
    const [updated] = await db
      .update(campaignScreenings)
      .set({
        status: 'processing',
        lockedAt: new Date(),
        lockedBy: 'compliance-worker',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaignScreenings.id, job.id),
          eq(campaignScreenings.status, job.status)
        )
      )
      .returning();

    if (updated) {
      claimed.push(updated);
    }
  }

  return claimed;
}

async function processScreeningJob(jobId: string) {
  const job = await db.query.campaignScreenings.findFirst({
    where: eq(campaignScreenings.id, jobId),
  });

  if (!job) {
    throw new Error(`Screening job ${jobId} not found`);
  }

  const context = await fetchCampaignContext(job.campaignId);
  if (!context) {
    throw new Error(`Campaign ${job.campaignId} not found`);
  }

  const syncResult = job.syncFindings as SynchronousCheckResult | null;
  const baseSync =
    syncResult ??
    runSynchronousScreeningChecks({
      title: context.campaign.title,
      description: context.campaign.description,
      reason: context.campaign.reason,
      fundraisingFor: context.campaign.fundraisingFor,
      goalAmount: parseNumber(context.campaign.goalAmount),
      currency: context.campaign.currency,
      creatorEmail: context.creator?.email,
    });

  const asyncResult = await runAsyncChecks(context.campaign, baseSync, context.creator);
  const outcome = evaluateScreening({
    campaignId: context.campaign.id,
    sync: baseSync,
    async: asyncResult,
  });

  await updateCampaignCompliance(context.campaign.id, outcome);
  await completeScreeningJob(job.id, outcome, asyncResult);

  return outcome;
}

export async function processPendingScreenings(limit = 5) {
  const jobs = await claimPendingJobs(limit);
  const results: Array<{ jobId: string; outcome?: ScreeningOutcome; error?: string }> = [];

  for (const job of jobs) {
    try {
      const outcome = await processScreeningJob(job.id);
      results.push({ jobId: job.id, outcome });
    } catch (error) {
      console.error('[compliance] screening job failed', error);
      await failScreeningJob(job.id, error);
      results.push({
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    claimed: jobs.length,
    completed: results.filter((item) => item.outcome).length,
    failed: results.filter((item) => item.error).length,
    results,
  };
}

export async function initializeScreeningForCampaign(campaignId: string, syncResult: SynchronousCheckResult) {
  await enqueueCampaignScreeningJob(campaignId, syncResult);

  // If sync checks allow immediate approval, reflect it in campaign summary
  if (syncResult.decision === 'allow') {
    await db
      .update(campaigns)
      .set({
        complianceSummary: syncResult.summary || DEFAULT_SCREENING_SUMMARY,
        complianceFlags: syncResult.flags,
        riskScore: riskToDbString(syncResult.riskScore),
      })
      .where(eq(campaigns.id, campaignId));
  }
}


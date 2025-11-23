import OpenAI from 'openai';
import path from 'path';
import { RESTRICTED_MEDIA_EXTENSIONS, WATCHLIST_NAMES } from './constants';
import { FraudScoreResult, MediaAnalysisResult, TextModerationResult, WatchlistResult } from './types';

const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiClient = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

export async function moderateCampaignText(text: string): Promise<TextModerationResult | undefined> {
  if (!text?.trim()) return undefined;
  if (!openAiClient) {
    return {
      flagged: false,
      categories: {},
    };
  }

  try {
    const response = await openAiClient.moderations.create({
      model: 'omni-moderation-latest',
      input: text.slice(0, 4000),
    });

    const results = response.results?.[0];
    if (!results) {
      return { flagged: false, categories: {} };
    }

    const categoriesEntries = Object.entries(results.category_scores ?? {}).map(
      ([category, score]) => [category, Number(score)] as const
    );

    const categories = Object.fromEntries(categoriesEntries);
    const flagged = Boolean(results.flagged);

    return {
      flagged,
      categories,
      raw: response,
    };
  } catch (error) {
    console.warn('[compliance] OpenAI moderation failed', error);
    return {
      flagged: false,
      categories: {},
    };
  }
}

export function inspectMediaAssets(urls: string[]): MediaAnalysisResult | undefined {
  if (!urls?.length) return undefined;

  const flaggedAssets = urls.filter((url) => {
    const ext = path.extname(url).toLowerCase();
    return RESTRICTED_MEDIA_EXTENSIONS.includes(ext);
  });

  if (!flaggedAssets.length) {
    return {
      flaggedAssets: [],
      totalAssets: urls.length,
    };
  }

  return {
    flaggedAssets,
    totalAssets: urls.length,
  };
}

export function evaluateWatchlistMatches(haystack: string[]): WatchlistResult | undefined {
  const normalized = haystack
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const matches = WATCHLIST_NAMES.filter((target) =>
    normalized.some((value) => value.includes(target))
  );

  if (!matches.length) return undefined;

  return {
    matches,
  };
}

export function calculateFraudScore(opts: {
  goalAmount: number;
  accountAgeInDays: number;
  missingDetails: boolean;
  syncRiskScore: number;
  donationWindowDays?: number;
}): FraudScoreResult {
  const reasons: string[] = [];
  let score = opts.syncRiskScore * 0.4;

  if (opts.goalAmount > 250_000) {
    score += 0.25;
    reasons.push('High goal amount for new campaign');
  }

  if (opts.accountAgeInDays < 14) {
    score += 0.2;
    reasons.push('New account (under two weeks old)');
  }

  if (opts.missingDetails) {
    score += 0.15;
    reasons.push('Missing beneficiary context');
  }

  if ((opts.donationWindowDays ?? 0) > 90) {
    score += 0.1;
    reasons.push('Unusually long fundraising window');
  }

  const normalized = Math.min(1, Number(score.toFixed(2)));

  return {
    score: normalized,
    reasons,
  };
}


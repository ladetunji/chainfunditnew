export type ComplianceStatus = 'pending_screening' | 'in_review' | 'approved' | 'blocked';

export type ScreeningDecision = 'approved' | 'review' | 'blocked';

export interface ScreeningIssue {
  code: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SynchronousCheckResult {
  decision: 'allow' | 'review' | 'block';
  riskScore: number;
  flags: string[];
  issues: ScreeningIssue[];
  summary: string;
}

export interface TextModerationResult {
  flagged: boolean;
  categories: Record<string, number>;
  raw?: unknown;
}

export interface MediaAnalysisResult {
  flaggedAssets: string[];
  totalAssets: number;
}

export interface WatchlistResult {
  matches: string[];
}

export interface FraudScoreResult {
  score: number;
  reasons: string[];
}

export interface AsynchronousCheckResult {
  textModeration?: TextModerationResult;
  mediaAnalysis?: MediaAnalysisResult;
  watchlist?: WatchlistResult;
  fraud?: FraudScoreResult;
}

export interface ScreeningSignals {
  campaignId: string;
  sync: SynchronousCheckResult;
  async?: AsynchronousCheckResult;
}

export interface ScreeningOutcome {
  decision: ScreeningDecision;
  complianceStatus: ComplianceStatus;
  riskScore: number;
  summary: string;
  flags: string[];
}


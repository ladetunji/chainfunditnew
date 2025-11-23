import { HIGH_RISK_KEYWORDS, MEDIUM_RISK_KEYWORDS } from './constants';
import { SynchronousCheckResult } from './types';

interface SyncCheckInput {
  title: string;
  description: string;
  reason?: string | null;
  fundraisingFor?: string | null;
  goalAmount: number;
  currency: string;
  creatorEmail?: string;
}

const MAX_SUMMARY_CHARS = 280;

const normalize = (value?: string | null) =>
  (value || '').toLowerCase();

const findKeywordHits = (text: string, keywords: string[]) =>
  keywords.filter((keyword) => text.includes(keyword));

export function runSynchronousScreeningChecks(input: SyncCheckInput): SynchronousCheckResult {
  const haystack = [
    normalize(input.title),
    normalize(input.description),
    normalize(input.reason),
    normalize(input.fundraisingFor),
  ].join(' ');

  const highRiskHits = findKeywordHits(haystack, HIGH_RISK_KEYWORDS);
  const mediumRiskHits = findKeywordHits(haystack, MEDIUM_RISK_KEYWORDS);

  const issues: SynchronousCheckResult['issues'] = [];
  let riskScore = 0;
  const flags: string[] = [];

  if (highRiskHits.length) {
    riskScore += 0.65 + highRiskHits.length * 0.05;
    flags.push('high_risk_language');
    issues.push({
      code: 'keyword_high',
      detail: `Detected prohibited language (${highRiskHits.join(', ')})`,
      severity: 'high',
    });
  }

  if (mediumRiskHits.length) {
    riskScore += 0.25 + mediumRiskHits.length * 0.03;
    flags.push('medium_risk_language');
    issues.push({
      code: 'keyword_medium',
      detail: `Detected suspicious phrasing (${mediumRiskHits.join(', ')})`,
      severity: 'medium',
    });
  }

  if (input.goalAmount > 1_000_000) {
    riskScore += 0.1;
    flags.push('high_goal_amount');
    issues.push({
      code: 'high_goal',
      detail: `Large goal (${input.currency} ${input.goalAmount}) flagged for manual review`,
      severity: 'medium',
    });
  }

  if (!input.reason || !input.fundraisingFor) {
    riskScore += 0.1;
    flags.push('missing_context');
    issues.push({
      code: 'missing_context',
      detail: 'Campaign lacks reason or beneficiary details',
      severity: 'low',
    });
  }

  const cappedRisk = Math.min(1, Number(riskScore.toFixed(2)));
  let decision: SynchronousCheckResult['decision'] = 'allow';

  if (cappedRisk >= 0.75) {
    decision = 'block';
  } else if (cappedRisk >= 0.4) {
    decision = 'review';
  }

  const summaryParts = [
    `Sync screening ${decision === 'allow' ? 'passed' : 'flagged'} (${cappedRisk})`,
    issues.length ? `${issues.length} signal(s)` : 'no strong signals',
  ];

  const summary = summaryParts.join(' ').slice(0, MAX_SUMMARY_CHARS);

  return {
    decision,
    riskScore: cappedRisk,
    flags,
    issues,
    summary,
  };
}


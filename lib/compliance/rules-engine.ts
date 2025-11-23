import { FRAUD_SCORE_THRESHOLDS } from './constants';
import { ScreeningOutcome, ScreeningSignals } from './types';

export function evaluateScreening(signals: ScreeningSignals): ScreeningOutcome {
  const flags = new Set<string>(signals.sync.flags);
  let aggregatedRisk = signals.sync.riskScore;

  const textModeration = signals.async?.textModeration;
  if (textModeration?.flagged) {
    flags.add('text_moderation_flag');
    aggregatedRisk = Math.max(aggregatedRisk, 0.85);
  }

  const media = signals.async?.mediaAnalysis;
  if (media?.flaggedAssets?.length) {
    flags.add('media_flagged');
    aggregatedRisk = Math.max(aggregatedRisk, 0.65);
  }

  const watchlist = signals.async?.watchlist;
  if (watchlist?.matches?.length) {
    flags.add('watchlist_match');
    aggregatedRisk = Math.max(aggregatedRisk, 0.75);
  }

  const fraud = signals.async?.fraud;
  if (fraud) {
    aggregatedRisk = Math.max(aggregatedRisk, fraud.score);
    if (fraud.score >= FRAUD_SCORE_THRESHOLDS.block) {
      flags.add('fraud_block');
    } else if (fraud.score >= FRAUD_SCORE_THRESHOLDS.review) {
      flags.add('fraud_review');
    }
  }

  let decision: ScreeningOutcome['decision'] = 'approved';
  let complianceStatus: ScreeningOutcome['complianceStatus'] = 'approved';

  if (
    aggregatedRisk >= 0.85 ||
    flags.has('text_moderation_flag') ||
    flags.has('watchlist_match')
  ) {
    decision = 'blocked';
    complianceStatus = 'blocked';
  } else if (
    aggregatedRisk >= 0.55 ||
    flags.has('media_flagged') ||
    flags.has('fraud_review')
  ) {
    decision = 'review';
    complianceStatus = 'in_review';
  }

  const summaryChunks = [
    `Decision: ${decision}`,
    `Risk: ${aggregatedRisk.toFixed(2)}`,
  ];

  if (flags.size) {
    summaryChunks.push(`Signals: ${Array.from(flags).join(', ')}`);
  }

  return {
    decision,
    complianceStatus,
    riskScore: Number(aggregatedRisk.toFixed(2)),
    summary: summaryChunks.join(' | '),
    flags: Array.from(flags),
  };
}


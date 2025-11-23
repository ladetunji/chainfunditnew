export type KycStatus = 'not_started' | 'pending' | 'processing' | 'in_review' | 'approved' | 'rejected' | 'failed';

export interface PersonaInquiry {
  inquiryId: string | null;
  sessionToken: string | null;
  raw?: unknown;
}

export interface KycGateResult {
  status: 'cleared' | 'pending' | 'unavailable';
  verificationId?: string;
  provider?: string;
  inquiryId?: string | null;
  sessionToken?: string | null;
  message?: string;
}


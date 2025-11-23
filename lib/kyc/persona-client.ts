import { PersonaInquiry } from './types';

const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_ENVIRONMENT = process.env.PERSONA_ENVIRONMENT_ID;
const PERSONA_TEMPLATE_ID = process.env.PERSONA_TEMPLATE_ID;

interface PersonaInquiryParams {
  referenceId: string;
  fullName: string;
  email: string;
  metadata?: Record<string, unknown>;
}

export async function createPersonaInquiry(params: PersonaInquiryParams): Promise<PersonaInquiry> {
  if (!PERSONA_API_KEY || !PERSONA_ENVIRONMENT || !PERSONA_TEMPLATE_ID) {
    return {
      inquiryId: null,
      sessionToken: null,
      raw: { stubbed: true },
    };
  }

  const [firstName, ...rest] = params.fullName.split(' ');
  const lastName = rest.join(' ') || firstName;

  const payload = {
    data: {
      type: 'inquiry',
      attributes: {
        template_id: PERSONA_TEMPLATE_ID,
        reference_id: params.referenceId,
        note: params.metadata?.note ?? 'Payout verification',
        environment_id: PERSONA_ENVIRONMENT,
        fields: {
          name_first: firstName,
          name_last: lastName,
          email_address: params.email,
        },
      },
    },
  };

  const response = await fetch('https://withpersona.com/api/v1/inquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERSONA_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Persona inquiry failed (${response.status}): ${errorBody}`);
  }

  const json = await response.json();
  return {
    inquiryId: json?.data?.id ?? null,
    sessionToken: json?.data?.attributes?.session_token ?? null,
    raw: json,
  };
}


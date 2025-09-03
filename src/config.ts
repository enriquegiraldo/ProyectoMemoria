// src/config/index.ts
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  compliance: {
    gdpr: {
      consentRequired: process.env.GDPR_CONSENT_REQUIRED === 'true',
    },
  },
};
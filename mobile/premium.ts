export const PREMIUM_CONTROL_URL =
  'https://raw.githubusercontent.com/Manas0606/imagehost/astrosathi-control/premium-control.json';

export const PREMIUM_DURATION_MS = 6 * 60 * 60 * 1000;
export const PREMIUM_POLL_MS = 30 * 1000;
export const PREMIUM_STALE_MS = 90 * 1000;

export type RemoteEntry = {
  status?: 'approved' | 'stopped' | 'pending';
  approvedAt?: string;
  message?: string;
};

export type PremiumControl = {
  version?: number;
  global?: {
    premiumEnabled?: boolean;
    message?: string;
    googleWebClientId?: string;
  };
  devices?: Record<string, RemoteEntry>;
  users?: Record<string, RemoteEntry>;
};

export type PremiumStateKind =
  | 'checking'
  | 'active'
  | 'pending'
  | 'stopped'
  | 'expired'
  | 'offline';

export type PremiumState = {
  kind: PremiumStateKind;
  message: string;
  approvedAt?: number;
  expiresAt?: number;
  serverNow: number;
  syncedAt: number;
  googleWebClientId?: string;
};

function normEmail(v?: string) {
  return (v || '').trim().toLowerCase();
}

function pickEntry(
  cfg: PremiumControl,
  deviceId: string,
  email?: string,
): RemoteEntry | undefined {
  if (cfg.devices?.[deviceId]) return cfg.devices[deviceId];
  const e = normEmail(email);
  if (e && cfg.users?.[e]) return cfg.users[e];
  return undefined;
}

export function resolvePremium(
  cfg: PremiumControl,
  deviceId: string,
  email: string | undefined,
  serverNow: number,
  syncedAt: number,
): PremiumState {
  const globalMessage = cfg.global?.message || '';

  if (cfg.global?.premiumEnabled === false) {
    return {
      kind: 'stopped',
      message:
        globalMessage ||
        'Premium access is temporarily stopped by the AstroSathi admin.',
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  const entry = pickEntry(cfg, deviceId, email);
  if (!entry) {
    return {
      kind: 'pending',
      message:
        globalMessage ||
        'Payment is not approved yet. Send your UTR and Device ID to @OdiaEduJobs.',
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  if (entry.status === 'stopped') {
    return {
      kind: 'stopped',
      message:
        entry.message ||
        globalMessage ||
        'Your premium access has been stopped by the admin.',
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  if (entry.status !== 'approved') {
    return {
      kind: 'pending',
      message:
        entry.message ||
        globalMessage ||
        'Your payment is waiting for admin approval.',
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  const approvedAt = Date.parse(entry.approvedAt || '');
  if (!Number.isFinite(approvedAt)) {
    return {
      kind: 'pending',
      message:
        'Approval exists, but the approval time is invalid. Please contact @OdiaEduJobs.',
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  const expiresAt = approvedAt + PREMIUM_DURATION_MS;
  if (serverNow < approvedAt) {
    return {
      kind: 'pending',
      message:
        entry.message ||
        'Premium is approved and will start at the configured approval time.',
      approvedAt,
      expiresAt,
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  if (serverNow >= expiresAt) {
    return {
      kind: 'expired',
      message:
        entry.message ||
        'Your 6-hour premium access has expired. You can request a new approval after payment.',
      approvedAt,
      expiresAt,
      serverNow,
      syncedAt,
      googleWebClientId: cfg.global?.googleWebClientId,
    };
  }

  return {
    kind: 'active',
    message:
      entry.message ||
      globalMessage ||
      'Payment approved. Premium is active for exactly 6 hours from approval.',
    approvedAt,
    expiresAt,
    serverNow,
    syncedAt,
    googleWebClientId: cfg.global?.googleWebClientId,
  };
}

export async function fetchPremium(
  deviceId: string,
  email?: string,
): Promise<PremiumState> {
  const startedLocal = Date.now();
  const res = await fetch(
    `${PREMIUM_CONTROL_URL}?t=${startedLocal}`,
    {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    },
  );
  if (!res.ok) throw new Error(`Premium server returned ${res.status}.`);
  const cfg = (await res.json()) as PremiumControl;

  const dateHeader = res.headers.get('date');
  const serverHeader = dateHeader ? Date.parse(dateHeader) : NaN;
  const serverNow = Number.isFinite(serverHeader) ? serverHeader : Date.now();

  return resolvePremium(cfg, deviceId, email, serverNow, Date.now());
}

export function trustedNow(state?: PremiumState) {
  if (!state) return Date.now();
  const elapsed = Date.now() - state.syncedAt;
  return state.serverNow + Math.max(0, elapsed);
}

export function remainingMs(state?: PremiumState) {
  if (!state?.expiresAt) return 0;
  return Math.max(0, state.expiresAt - trustedNow(state));
}

export function isPremiumUsable(state?: PremiumState) {
  if (!state || state.kind !== 'active') return false;
  if (Date.now() - state.syncedAt > PREMIUM_STALE_MS) return false;
  return remainingMs(state) > 0;
}

export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

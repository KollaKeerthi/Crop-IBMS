import { ApiError } from "@/lib/api/errors";

export type CalendarProvider = "google" | "outlook";

export function isCalendarProvider(v: string): v is CalendarProvider {
  return v === "google" || v === "outlook";
}

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  extraAuthParams?: Record<string, string>;
};

const PROVIDERS: Record<CalendarProvider, ProviderConfig> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/calendar.events",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "offline_access Calendars.ReadWrite",
  },
};

type Credentials = { clientId: string; clientSecret: string };

function getCredentials(provider: CalendarProvider): Credentials {
  if (provider === "google") {
    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;
    if (!clientId || !clientSecret) {
      throw new ApiError(
        503,
        "oauth_not_configured",
        "Google OAuth is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET."
      );
    }
    return { clientId, clientSecret };
  }
  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(
      503,
      "oauth_not_configured",
      "Microsoft OAuth is not configured. Set MICROSOFT_OAUTH_CLIENT_ID and MICROSOFT_OAUTH_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new ApiError(500, "config_error", "NEXT_PUBLIC_APP_URL is not set.");
  return url.replace(/\/$/, "");
}

export function buildRedirectUri(provider: CalendarProvider): string {
  return `${getAppUrl()}/api/v1/integrations/calendar/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: CalendarProvider, state: string): string {
  const cfg = PROVIDERS[provider];
  const { clientId } = getCredentials(provider);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: buildRedirectUri(provider),
    scope: cfg.scope,
    state,
    ...cfg.extraAuthParams,
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

export type TokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

export async function exchangeCodeForToken(
  provider: CalendarProvider,
  code: string
): Promise<TokenResponse> {
  const cfg = PROVIDERS[provider];
  const { clientId, clientSecret } = getCredentials(provider);
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: buildRedirectUri(provider),
    grant_type: "authorization_code",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      502,
      "oauth_exchange_failed",
      `Token exchange failed: ${text.slice(0, 200)}`
    );
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt,
  };
}

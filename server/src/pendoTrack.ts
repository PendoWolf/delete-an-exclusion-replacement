import type { Request } from "express";

// Server-side Pendo Track Events. Sends events to Pendo's Track API over HTTP.
// The integration key is read from the environment and never committed. When
// it isn't set (local dev, tests), tracking is skipped and the app is unaffected.
const PENDO_DATA_HOST = process.env.PENDO_DATA_HOST ?? "data.pendo-dev.pendo-dev.com";
const PENDO_TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;

let warnedMissingSecret = false;

type TrackProperties = Record<string, string | number | boolean>;

// The web app sends the Pendo visitor and account IDs it initialized the agent
// with, so server events are attributed to the same visitor and account.
// Falls back to "system" only when the caller didn't send them (e.g. curl).
function identity(req: Request) {
  const visitorId = req.get("x-pendo-visitor-id")?.trim() || "system";
  const accountId = req.get("x-pendo-account-id")?.trim() || "system";
  return { visitorId, accountId };
}

export function pendoTrack(event: string, req: Request, properties: TrackProperties = {}): void {
  if (!PENDO_TRACK_EVENT_SECRET) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn("PENDO_TRACK_EVENT_SECRET is not set; server-side Pendo Track Events are skipped.");
    }
    return;
  }

  const { visitorId, accountId } = identity(req);
  const body = {
    type: "track",
    event,
    visitorId,
    accountId,
    timestamp: Date.now(),
    properties,
    context: {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      url: req.get("referer"),
    },
  };

  // Fire-and-forget: tracking failures must never break the API response.
  fetch(`https://${PENDO_DATA_HOST}/data/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": PENDO_TRACK_EVENT_SECRET,
    },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) console.error(`Pendo track "${event}" failed: ${res.status}`);
    })
    .catch((e: unknown) => {
      console.error(`Pendo track "${event}" failed:`, e);
    });
}

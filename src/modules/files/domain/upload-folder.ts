export const STATIC_UPLOAD_FOLDERS = [
  "partners",
  "assets",
  "assets-qr",
  "inventory-qr",
  "tasks",
  "tasks-comments",
] as const;

export type StaticUploadFolder = (typeof STATIC_UPLOAD_FOLDERS)[number];
export type UploadFolder =
  | StaticUploadFolder
  | `orgs/${string}`
  | `events/${string}`;

const ORG_RESOURCE_FOLDERS = new Set([
  "brands",
  "tasks",
  "tasks-comments",
  "assets",
  "assets-qr",
  "inventory-qr",
]);

const EVENT_RESOURCE_FOLDERS = new Set([
  "sponsors",
  "tasks",
  "tasks-comments",
  "assets",
  "assets-qr",
  "inventory-qr",
]);

function validSegment(segment: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(segment);
}

export function isAllowedUploadFolder(folder: string): boolean {
  const normalized = folder.replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/").filter(Boolean);

  if (
    segments.length === 1 &&
    STATIC_UPLOAD_FOLDERS.includes(segments[0] as StaticUploadFolder)
  ) {
    return true;
  }

  if (segments.length < 3) {
    return false;
  }

  if (!segments.every(validSegment)) {
    return false;
  }

  if (segments[0] === "orgs") {
    const third = segments[2];

    if (third === "events") {
      return segments.length >= 5 && EVENT_RESOURCE_FOLDERS.has(segments[4]);
    }

    return ORG_RESOURCE_FOLDERS.has(third);
  }

  if (segments[0] === "events") {
    return segments.length >= 3 && EVENT_RESOURCE_FOLDERS.has(segments[2]);
  }

  return false;
}

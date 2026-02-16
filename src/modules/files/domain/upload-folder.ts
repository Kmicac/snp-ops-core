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

// Se mantienen rutas dinamicas existentes para no romper uploads actuales (ej: orgs/.../events/...).
export function isAllowedUploadFolder(folder: string): boolean {
  if (STATIC_UPLOAD_FOLDERS.includes(folder as StaticUploadFolder)) {
    return true;
  }

  return (
    folder.startsWith("orgs/") ||
    folder.startsWith("events/")
  );
}

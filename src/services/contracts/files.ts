// FileService — uploads + signed URLs.
//
// Implementation rules from ARCHITECTURE.md §8:
//   • Files NEVER go in public/. Object storage only.
//   • Bucket-level public access disabled. Reads via signed URLs.
//   • Every upload writes a FileRecord row (metadata + access control).
//   • Customer can sign URLs for their own files; admins can sign any.

import type {
  FileCategory,
  FileId,
  FileRecord,
  FileVisibility,
  UserId,
} from "./types";

export type UploadInput = Readonly<{
  ownerUserId: UserId;
  category: FileCategory;
  relatedResourceType: FileRecord["relatedResourceType"];
  relatedResourceId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Direct upload payload OR a pre-signed-URL handshake — the impl
   *  decides; the contract is "give me a binary, get a FileRecord". */
  body: Blob | ArrayBuffer | ReadableStream;
  visibility?: FileVisibility;
}>;

export type SignedUrl = Readonly<{
  url: string;
  expiresAt: string;
}>;

export interface FileService {
  // Upload ──────────────────────────────────────────────────────────────
  /** Streams the file body to object storage, writes a FileRecord,
   *  emits an AuditEvent, returns the record. */
  upload(input: UploadInput): Promise<FileRecord>;

  // Access ──────────────────────────────────────────────────────────────
  /** Returns a short-lived signed URL. Default TTL = 1 hour.
   *  Throws ForbiddenError if the caller can't access the resource. */
  getSignedUrl(fileId: FileId, ttlSeconds?: number): Promise<SignedUrl>;

  /** Returns metadata only — no signed URL. Useful for listing UIs. */
  get(fileId: FileId): Promise<FileRecord | null>;

  /** List files attached to a related resource (e.g. all uploads on a
   *  given financing request). Filtered by caller permission. */
  listForResource(
    resourceType: FileRecord["relatedResourceType"],
    resourceId: string,
  ): Promise<FileRecord[]>;

  // Delete ──────────────────────────────────────────────────────────────
  /** Soft delete — sets deletedAt on the FileRecord; storage binary is
   *  removed by a background job after a configurable grace period.
   *  Preserves audit trail. */
  softDelete(fileId: FileId): Promise<void>;
}

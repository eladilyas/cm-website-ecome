// In-memory FileService — keeps metadata + bodies in a Map.
//
// Real contract implementation, demo-grade backing store. Signed URLs
// are returned as `data:` URIs so the UI can preview / download them
// exactly like the platform impl serves R2-signed URLs. Soft-delete
// flips `deletedAt`; nothing is actually purged in dev.

import {
  ForbiddenError,
  NotFoundError,
  type FileId,
  type FileRecord,
  type FileVisibility,
} from "@/services/contracts";
import type {
  FileService,
  SignedUrl,
  UploadInput,
} from "@/services/contracts/files";
import type { AuditService } from "@/services/contracts/audit";

function uid(prefix = "file"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  // Wrap in a Uint8Array view so the digest call gets a typed array
  // rather than the raw buffer (lib.dom.d.ts's BufferSource is stricter
  // about SharedArrayBuffer than the runtime needs).
  const view = new Uint8Array(bytes);
  const owned = new Uint8Array(view.byteLength);
  owned.set(view);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", owned);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function toArrayBuffer(
  body: Blob | ArrayBuffer | ReadableStream,
): Promise<ArrayBuffer> {
  if (body instanceof ArrayBuffer) return body;
  if (body instanceof Blob) return body.arrayBuffer();
  // ReadableStream — drain to Uint8Array.
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

type StoredFile = Readonly<{
  record: FileRecord;
  body: ArrayBuffer;
}>;

export class DemoFileService implements FileService {
  private files = new Map<FileId, StoredFile>();

  constructor(private readonly audit: AuditService) {}

  async upload(input: UploadInput): Promise<FileRecord> {
    const buf = await toArrayBuffer(input.body);
    const checksum = await sha256(buf);

    const visibility: FileVisibility = input.visibility ?? "private";
    const record: FileRecord = Object.freeze({
      id: uid("file"),
      ownerUserId: input.ownerUserId,
      category: input.category,
      relatedResourceType: input.relatedResourceType,
      relatedResourceId: input.relatedResourceId,
      storageKey: `demo/${input.relatedResourceType}/${input.relatedResourceId}/${input.fileName}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      checksumSha256: checksum,
      uploadedAt: nowIso(),
      visibility,
    });

    this.files.set(record.id, { record, body: buf });

    await this.audit.record({
      actorUserId: input.ownerUserId,
      action: "file.upload",
      resourceType: "file",
      resourceId: record.id,
      after: record,
    });

    return record;
  }

  async getSignedUrl(
    fileId: FileId,
    ttlSeconds: number = 3600,
  ): Promise<SignedUrl> {
    const stored = this.files.get(fileId);
    if (!stored || stored.record.deletedAt) {
      throw new NotFoundError("File", fileId);
    }

    // Encode the body inline as a data: URI — the dev frontend can
    // render it the same way it would render an R2-signed URL.
    const base64 = arrayBufferToBase64(stored.body);
    const url = `data:${stored.record.mimeType};base64,${base64}`;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    await this.audit.record({
      action: "file.sign-url",
      resourceType: "file",
      resourceId: fileId,
      metadata: { ttlSeconds },
    });

    return Object.freeze({ url, expiresAt });
  }

  async get(fileId: FileId): Promise<FileRecord | null> {
    const stored = this.files.get(fileId);
    if (!stored || stored.record.deletedAt) return null;
    return stored.record;
  }

  async listForResource(
    resourceType: FileRecord["relatedResourceType"],
    resourceId: string,
  ): Promise<FileRecord[]> {
    const out: FileRecord[] = [];
    for (const { record } of this.files.values()) {
      if (record.deletedAt) continue;
      if (
        record.relatedResourceType === resourceType &&
        record.relatedResourceId === resourceId
      ) {
        out.push(record);
      }
    }
    out.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
    return out;
  }

  async softDelete(fileId: FileId): Promise<void> {
    const stored = this.files.get(fileId);
    if (!stored) throw new NotFoundError("File", fileId);
    if (stored.record.deletedAt) {
      throw new ForbiddenError("File is already deleted");
    }

    const updated: FileRecord = Object.freeze({
      ...stored.record,
      deletedAt: nowIso(),
    });
    this.files.set(fileId, { record: updated, body: stored.body });

    await this.audit.record({
      action: "file.delete",
      resourceType: "file",
      resourceId: fileId,
      before: stored.record,
      after: updated,
    });
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}

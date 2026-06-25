// Cloudflare R2 FileService — S3-compatible storage backed by R2.
//
// R2 is S3-compatible, so we use the AWS SDK with R2's account-scoped
// endpoint. Bucket-level public access stays disabled; reads go through
// short-lived signed URLs.
//
// FileRecord metadata is mirrored to the database (table `FileRecord`
// in prisma/schema.prisma) — Phase 2 wires Prisma in. Until then, this
// service falls back to an in-memory metadata Map so it remains usable
// the moment the R2 credentials land.
//
// Auth + permission checks (admin can sign any, customer can sign own)
// happen in the calling layer — this service trusts the caller has
// already authorized the request.

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
import { env } from "@/server/env";

type R2Config = Readonly<{
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Optional CDN/custom-domain hostname for public-signed reads. */
  publicHostname?: string;
}>;

function uid(prefix = "file"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function sha256(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh, non-shared ArrayBuffer view — subtle.digest's typing
  // (BufferSource) excludes SharedArrayBuffer-backed views in strict mode.
  const owned = new Uint8Array(bytes.byteLength);
  owned.set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", owned);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function toUint8Array(
  body: Blob | ArrayBuffer | ReadableStream,
): Promise<Uint8Array> {
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
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
  return out;
}

/** Build a storage key with a stable per-resource prefix. */
function buildStorageKey(input: UploadInput): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${input.relatedResourceType}/${input.relatedResourceId}/${Date.now()}-${safeName}`;
}

export function r2ConfigFromEnv(): R2Config | null {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET
  ) {
    return null;
  }
  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
    publicHostname: env.R2_PUBLIC_HOSTNAME,
  };
}

export class R2FileService implements FileService {
  private readonly client: S3Client;
  private readonly bucket: string;
  // Metadata mirror — replaced by Prisma in Phase 2 (TODO: swap to db).
  private readonly records = new Map<FileId, FileRecord>();

  constructor(
    config: R2Config,
    private readonly audit: AuditService,
  ) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(input: UploadInput): Promise<FileRecord> {
    const bytes = await toUint8Array(input.body);
    const checksum = await sha256(bytes);
    const storageKey = buildStorageKey(input);
    const visibility: FileVisibility = input.visibility ?? "private";

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: bytes,
        ContentType: input.mimeType,
        ContentLength: input.sizeBytes,
        ChecksumSHA256: checksumToBase64(checksum),
        Metadata: {
          owner: input.ownerUserId,
          category: input.category,
          resourceType: input.relatedResourceType,
          resourceId: input.relatedResourceId,
        },
      }),
    );

    const record: FileRecord = Object.freeze({
      id: uid("file"),
      ownerUserId: input.ownerUserId,
      category: input.category,
      relatedResourceType: input.relatedResourceType,
      relatedResourceId: input.relatedResourceId,
      storageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      checksumSha256: checksum,
      uploadedAt: nowIso(),
      visibility,
    });

    this.records.set(record.id, record);

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
    const record = this.records.get(fileId);
    if (!record || record.deletedAt) {
      throw new NotFoundError("File", fileId);
    }

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: record.storageKey,
      }),
      { expiresIn: ttlSeconds },
    );

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
    const r = this.records.get(fileId);
    if (!r || r.deletedAt) return null;
    return r;
  }

  async listForResource(
    resourceType: FileRecord["relatedResourceType"],
    resourceId: string,
  ): Promise<FileRecord[]> {
    const out: FileRecord[] = [];
    for (const r of this.records.values()) {
      if (r.deletedAt) continue;
      if (
        r.relatedResourceType === resourceType &&
        r.relatedResourceId === resourceId
      ) {
        out.push(r);
      }
    }
    out.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
    return out;
  }

  async softDelete(fileId: FileId): Promise<void> {
    const record = this.records.get(fileId);
    if (!record) throw new NotFoundError("File", fileId);
    if (record.deletedAt) {
      throw new ForbiddenError("File is already deleted");
    }

    // Soft-delete metadata first. A background job purges the R2 binary
    // after a grace period; here we just send the Delete eagerly because
    // there's no job runner yet.
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: record.storageKey,
      }),
    );

    const updated: FileRecord = Object.freeze({
      ...record,
      deletedAt: nowIso(),
    });
    this.records.set(fileId, updated);

    await this.audit.record({
      action: "file.delete",
      resourceType: "file",
      resourceId: fileId,
      before: record,
      after: updated,
    });
  }
}

function checksumToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}

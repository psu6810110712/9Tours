import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3000';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getUploadsRoot() {
  const configuredRoot = process.env.UPLOADS_ROOT?.trim();
  return configuredRoot
    ? resolve(configuredRoot)
    : resolve(process.cwd(), 'uploads');
}

export function getSlipUploadDirectory() {
  return join(getUploadsRoot(), 'slips');
}

export function getTourUploadDirectory() {
  return getUploadsRoot();
}

export function ensureDirectoryExistsSync(directory: string) {
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function buildStoredUploadPath(...segments: string[]) {
  return ['uploads', ...segments].join('/').replace(/\\/g, '/');
}

export function resolveStoredUploadPath(storedPath: string) {
  const normalizedPath = storedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalizedPath.startsWith('uploads/')) {
    return resolve(normalizedPath);
  }

  const relativePath = normalizedPath.slice('uploads/'.length);
  return resolve(getUploadsRoot(), relativePath);
}

export function getBackendPublicUrl() {
  const configuredUrl = process.env.BACKEND_PUBLIC_URL?.trim();
  return trimTrailingSlash(configuredUrl || DEFAULT_LOCAL_BACKEND_URL);
}

export function buildPublicUploadUrl(storedPath: string) {
  const normalizedPath = storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
  return `${getBackendPublicUrl()}${normalizedPath}`;
}

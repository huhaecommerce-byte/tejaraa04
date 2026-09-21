import latestExport from '@/assets/latesttejaraaExport.zip.asset.json';

export interface ProjectExportEntry {
  /** Stable key used for download tracking. */
  key: string;
  fileName: string;
  url: string;
  sizeBytes: number;
  createdAt: string;
  label: string;
  notes: string;
  latest: boolean;
}

/**
 * History of full project export archives. Newest first.
 * Add a new entry (and keep the old ones) each time a fresh archive is generated.
 */
export const PROJECT_EXPORTS: ProjectExportEntry[] = [
  {
    key: latestExport.asset_id,
    fileName: latestExport.original_filename,
    url: latestExport.url,
    sizeBytes: latestExport.size,
    createdAt: latestExport.created_at,
    label: 'Full project export',
    notes:
      'Complete source code, assets, database migrations and configuration. Installed dependencies, build caches and git metadata are excluded — run the install command after unzipping.',
    latest: true,
  },
];

export function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

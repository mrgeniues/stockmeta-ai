import { FileItem, StockPlatformPreset, PlatformSettings } from '../types';

/**
 * Escape CSV fields:
 * - Wrap in double quotes
 * - Escape internal double quotes by doubling them ("" -> """")
 */
function escapeCsvValue(val: string): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generate CSV string and trigger download in the browser with platform-aware schemas
 */
export function exportFilesToCsv(
  files: FileItem[],
  activePreset: StockPlatformPreset,
  platformSettings?: PlatformSettings
): boolean {
  const completed = files.filter((f) => f.status === 'Done' && f.metadata);
  if (completed.length === 0) {
    return false;
  }

  let header = 'Filename,Title,Keywords,Description';
  let rows: string[] = [];

  switch (activePreset) {
    case 'Adobe Stock': {
      header = 'Filename,Title,Keywords,Category';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        const category = escapeCsvValue(
          f.metadata?.category !== undefined && f.metadata?.category !== null
            ? String(f.metadata.category)
            : ''
        );
        return `${filename},${title},${keywords},${category}`;
      });
      break;
    }

    case '123RF': {
      header = 'Filename,Description,Keywords,Country';
      const countryVal = platformSettings?.rf123.countries?.trim() || 'US, UK, PK';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const description = escapeCsvValue(f.metadata?.description || f.metadata?.title || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        const country = escapeCsvValue(countryVal);
        return `${filename},${description},${keywords},${country}`;
      });
      break;
    }

    case 'Freepik': {
      header = 'Filename,Title,Tags';
      const isAi = Boolean(platformSettings?.freepik.aiGenerated);
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        let kwList = [...(f.metadata?.keywords || [])];
        if (isAi) {
          const lowerKws = new Set(kwList.map((k) => k.toLowerCase()));
          for (const aiTag of ['ai generated', 'generative ai']) {
            if (!lowerKws.has(aiTag)) {
              kwList.push(aiTag);
            }
          }
        }
        const tags = escapeCsvValue(kwList.join(', '));
        return `${filename},${title},${tags}`;
      });
      break;
    }

    case 'Canva': {
      header = 'Filename,Title,Keywords';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        return `${filename},${title},${keywords}`;
      });
      break;
    }

    case 'Vecteezy': {
      header = 'Filename,Title,Description,Keywords,License';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const description = escapeCsvValue(f.metadata?.description || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        const license = escapeCsvValue('Standard');
        return `${filename},${title},${description},${keywords},${license}`;
      });
      break;
    }

    case 'Pond5': {
      header = 'Filename,Title,Description,Keywords,City,State,Country';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const description = escapeCsvValue(f.metadata?.description || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        const city = escapeCsvValue('');
        const state = escapeCsvValue('');
        const country = escapeCsvValue('');
        return `${filename},${title},${description},${keywords},${city},${state},${country}`;
      });
      break;
    }

    case 'Depositphotos': {
      header = 'Filename,Description,Keywords';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const description = escapeCsvValue(f.metadata?.description || f.metadata?.title || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        return `${filename},${description},${keywords}`;
      });
      break;
    }

    case 'iStock': {
      header = 'Filename,Title,Description,Keywords';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const description = escapeCsvValue(f.metadata?.description || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        return `${filename},${title},${description},${keywords}`;
      });
      break;
    }

    case 'General':
    default: {
      header = 'Filename,Title,Description,Keywords,Category,ContentType';
      rows = completed.map((f) => {
        const filename = escapeCsvValue(f.name);
        const title = escapeCsvValue(f.metadata?.title || '');
        const description = escapeCsvValue(f.metadata?.description || '');
        const keywords = escapeCsvValue((f.metadata?.keywords || []).join(', '));
        const category = escapeCsvValue('');
        const contentType = escapeCsvValue(f.type || f.file?.type || '');
        return `${filename},${title},${description},${keywords},${category},${contentType}`;
      });
      break;
    }
  }

  const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const presetSlug = activePreset.toLowerCase().replace(/\s+/g, '-');
  const filename = `stockmeta-${presetSlug}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

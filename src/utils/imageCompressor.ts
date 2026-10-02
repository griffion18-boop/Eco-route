/**
 * Utility to compress uploaded images client-side before storing into localStorage.
 * Resizes images to max 600x600 and compresses as JPEG (~25-45 KB each)
 * to avoid exceeding the browser's 5MB localStorage quota during hackathons.
 */
export async function compressImageFile(file: File, maxWidth = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file size (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File size exceeds 10MB limit.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image file.'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * High-quality SVG-based sample garbage photo data URLs for instant 1-click hackathon demonstration
 */
export const SAMPLE_GARBAGE_PHOTOS = [
  {
    name: 'Overflowing Bins - Market',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23475569"/><rect x="0" y="280" width="600" height="120" fill="%23334155"/><rect x="180" y="160" width="110" height="140" rx="8" fill="%2315803d"/><rect x="310" y="150" width="110" height="150" rx="8" fill="%230284c7"/><circle cx="210" cy="140" r="28" fill="%23f59e0b"/><circle cx="260" cy="130" r="32" fill="%23f97316"/><rect x="190" y="295" width="230" height="40" rx="4" fill="%23b45309" opacity="0.6"/><path d="M 230 140 L 320 220 L 290 290 Z" fill="%23ef4444" opacity="0.7"/><text x="300" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">MUNICIPAL EVIDENCE: DADAR MARKET OVERFLOW</text><text x="300" y="80" font-family="sans-serif" font-size="13" fill="%23cbd5e1" text-anchor="middle">Location: Senapati Bapat Marg • Photo ID: MUM-EVD-01</text></svg>`,
  },
  {
    name: 'Plastic Netting & Bottles',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="0" y="260" width="600" height="140" fill="%231e293b"/><path d="M 50 300 Q 150 200 250 320 T 450 280 T 580 340" stroke="%2338bdf8" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="180" cy="270" r="22" fill="%2338bdf8" opacity="0.8"/><circle cx="220" cy="290" r="18" fill="%230284c7" opacity="0.9"/><circle cx="340" cy="260" r="25" fill="%230ea5e9" opacity="0.8"/><rect x="270" y="270" width="45" height="70" rx="6" fill="%23f1f5f9" opacity="0.7"/><text x="300" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">MUNICIPAL EVIDENCE: PLASTIC SHORELINE WASTE</text><text x="300" y="80" font-family="sans-serif" font-size="13" fill="%23cbd5e1" text-anchor="middle">Location: Bandra Bandstand Promenade • Photo ID: MUM-EVD-02</text></svg>`,
  },
  {
    name: 'Vegetable & Organic Waste',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%233f2e18"/><rect x="0" y="240" width="600" height="160" fill="%232c1e0e"/><ellipse cx="300" cy="300" rx="200" ry="70" fill="%23166534" opacity="0.8"/><ellipse cx="270" cy="280" rx="140" ry="50" fill="%2365a30d" opacity="0.8"/><circle cx="240" cy="260" r="28" fill="%23eab308"/><circle cx="330" cy="270" r="25" fill="%23f97316"/><circle cx="370" cy="290" r="22" fill="%23dc2626"/><text x="300" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23fef08a" text-anchor="middle">MUNICIPAL EVIDENCE: WHOLESALE PRODUCE SPOILAGE</text><text x="300" y="80" font-family="sans-serif" font-size="13" fill="%23fef9c3" text-anchor="middle">Location: Kurla West APMC Mandi • Photo ID: MUM-EVD-03</text></svg>`,
  },
  {
    name: 'Construction & Demolition Debris',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23334155"/><polygon points="120,340 260,180 400,340" fill="%2394a3b8"/><polygon points="280,340 380,210 490,340" fill="%2364748b"/><rect x="180" y="320" width="90" height="35" rx="3" fill="%23b91c1c" opacity="0.9"/><rect x="330" y="315" width="80" height="40" rx="3" fill="%23b91c1c" opacity="0.9"/><text x="300" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">MUNICIPAL EVIDENCE: ROADSIDE C&amp;D RUBBLE</text><text x="300" y="80" font-family="sans-serif" font-size="13" fill="%23cbd5e1" text-anchor="middle">Location: Goregaon West Link Road • Photo ID: MUM-EVD-04</text></svg>`,
  },
];

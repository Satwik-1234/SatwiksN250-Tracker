/**
 * Utility helper to handle PDF viewing across devices.
 * On Mobile (Android / iOS):
 *  - Uses Web Share API (Files) to invoke Android's native "Drive PDF Viewer" (Google Drive offline PDF viewer) or iOS Quick Look / Files.
 *  - Uses Android Intent URI fallback for direct system default PDF handler invocation.
 *  - Uses download-and-open trigger as high-reliability fallback.
 *  - Provides Google Drive Cloud Viewer URL for online web preview.
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
  );
};

export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Converts a base64 data URI to a standard Blob
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Clean filename utility
 */
export const cleanPdfFilename = (title?: string): string => {
  if (!title) return 'document.pdf';
  const sanitized = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
};

/**
 * Generates the Google Drive Web Viewer URL for public URLs
 */
export const getGoogleDriveViewerUrl = (url: string): string | null => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null;
  return `https://drive.google.com/viewerng/viewer?url=${encodeURIComponent(url)}`;
};

/**
 * Generates Google Docs Embedded Viewer URL for iframes
 */
export const getGoogleDocsEmbeddedUrl = (url: string): string | null => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null;
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};

/**
 * Launch the PDF into Google Drive Offline PDF Viewer or System Default Viewer
 */
export const openPdfWithSystemViewer = async (
  url: string,
  title: string
): Promise<{ success: boolean; method: string; message?: string }> => {
  if (typeof window === 'undefined' || !url) {
    return { success: false, method: 'none', message: 'Window or URL missing' };
  }

  const filename = cleanPdfFilename(title);

  // 1. Resolve Blob from data URI, blob URI, or remote URL
  let blob: Blob | null = null;
  if (url.startsWith('data:')) {
    try {
      blob = dataUrlToBlob(url);
    } catch (e) {
      console.error('Failed to convert data URI to blob:', e);
    }
  } else if (url.startsWith('blob:')) {
    try {
      const resp = await fetch(url);
      blob = await resp.blob();
    } catch (e) {
      console.warn('Could not re-fetch blob URI:', e);
    }
  } else if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (resp.ok) {
        blob = await resp.blob();
      }
    } catch {
      // CORS or network restriction may block direct fetch; we continue to intent/download fallback
    }
  }

  // 2. PRIMARY MOBILE MECHANISM: Web Share API with File
  // On Android, passing an application/pdf File opens Android's system sheet with "Drive PDF Viewer" (Google Drive offline viewer) as the top choice!
  if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'Bike Document',
        });
        return { success: true, method: 'web_share_api' };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        // User dismissed the app picker
        return { success: true, method: 'user_dismissed' };
      }
      console.warn('Web Share failed, proceeding to next method:', shareErr);
    }
  }

  // 3. ANDROID INTENT URI (for public HTTPS URLs)
  // Direct Android Chrome intent to launch registered PDF viewer
  if (isAndroidDevice() && (url.startsWith('http://') || url.startsWith('https://'))) {
    try {
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;type=application/pdf;action=android.intent.action.VIEW;end;`;
      window.location.href = intentUrl;
      return { success: true, method: 'android_intent' };
    } catch (intentErr) {
      console.warn('Android intent dispatch failed:', intentErr);
    }
  }

  // 4. DOWNLOAD & SYSTEM OPEN NOTIFICATION (Universal Android & iOS fallback)
  // When downloaded on Android, the system notification drawer prompts: "Download complete • Tap to open with Drive PDF Viewer"
  try {
    const downloadUrl = blob ? URL.createObjectURL(blob) : url;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up temporary object URL after slight delay
    if (blob) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 45000);
    }

    return { success: true, method: 'download_trigger' };
  } catch (dlErr) {
    console.error('Download trigger failed:', dlErr);
  }

  // 5. Final fallback: open standard new window
  window.open(url, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'window_open' };
};

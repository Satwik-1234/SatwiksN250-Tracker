export interface ShareStats {
  days: number;
  km: number;
  fills: number;
  mileage: number;
  perKm: number;
}

/** Draws a poster of the ride so far and shares it (or downloads it where sharing files is not supported). */
export async function shareRideCard(s: ShareStats): Promise<void> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  if (!x) return;

  x.fillStyle = '#15171c';
  x.fillRect(0, 0, W, H);
  // Red speed stripes down the left edge
  x.fillStyle = '#e2231a';
  for (let i = 0; i < 6; i++) {
    x.beginPath();
    x.moveTo(60 + i * 34, 0);
    x.lineTo(90 + i * 34, 0);
    x.lineTo(30 + i * 34, 220);
    x.lineTo(0 + i * 34, 220);
    x.closePath();
    x.fill();
  }

  const disp = '"Barlow Condensed", "Arial Narrow", sans-serif';
  x.fillStyle = '#e2231a';
  x.font = `italic 700 38px ${disp}`;
  x.fillText('BAJAJ PULSAR N250', 80, 330);
  x.fillStyle = '#ffffff';
  x.font = `italic 700 150px ${disp}`;
  x.fillText('RIDE IT LIKE', 80, 470);
  x.fillText('YOU STOLE IT.', 80, 610);

  const rows: [string, string][] = [
    [s.km.toLocaleString('en-IN'), 'KM RIDDEN'],
    [String(s.days), 'DAYS TOGETHER'],
    [s.mileage > 0 ? s.mileage.toFixed(1) : '-', 'KM PER LITRE'],
    [s.perKm > 0 ? `Rs ${s.perKm.toFixed(2)}` : '-', 'FUEL COST PER KM'],
  ];
  rows.forEach(([v, l], i) => {
    const cx = 80 + (i % 2) * 480;
    const cy = 780 + Math.floor(i / 2) * 230;
    x.fillStyle = '#ffffff';
    x.font = `italic 700 120px ${disp}`;
    x.fillText(v, cx, cy);
    x.fillStyle = '#e2231a';
    x.font = `600 30px ${disp}`;
    x.fillText(l, cx, cy + 48);
  });

  x.fillStyle = 'rgba(255,255,255,0.45)';
  x.font = `600 30px ${disp}`;
  x.fillText(`${s.fills} FILL-UPS TRACKED  ·  N250 TRACKER`, 80, H - 70);

  const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'my-n250.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My N250' });
      return;
    } catch {
      return; // the person closed the share sheet
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'my-n250.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

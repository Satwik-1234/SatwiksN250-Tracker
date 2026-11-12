/**
 * Plain-URL links into Google apps — no API keys, no SDKs. They open in a new
 * tab and work on phone and desktop alike.
 */

/** Google Maps driving directions between two place names. */
export function mapsDirections(from?: string, to?: string): string | null {
  if (!from && !to) return null;
  const params = new URLSearchParams({ api: '1', travelmode: 'driving' });
  if (from) params.set('origin', from);
  if (to) params.set('destination', to);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Google Maps search for a place (e.g. a petrol pump or workshop). */
export function mapsSearch(query?: string): string | null {
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * A Google Calendar "create event" link for an all-day reminder on a date.
 * date is 'yyyy-mm-dd'.
 */
export function calendarEvent(title: string, date: string, details?: string): string | null {
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const start = date.replace(/-/g, '');
  const endD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  const end = `${endD.getFullYear()}${String(endD.getMonth() + 1).padStart(2, '0')}${String(endD.getDate()).padStart(2, '0')}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
  });
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

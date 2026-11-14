// Bekræftede bookinger. Tilføj kun ophold, brugeren har bekræftet.
// Fra/til er ankomst og afrejse. Ingen bookingnumre eller personoplysninger her.
window.tripBookings = {
  'c-a1-kaikoura': {
    base: 20, from: '2026-11-15', until: '2026-11-16',
    task: 'book-a1-20261115', adults: 1, total: 45
  },
  'camp-godley': {
    base: 19, from: '2026-11-16', until: '2026-11-17',
    task: 'book-godley-20261116', adults: 1, total: 18
  },
  'camp-day-1': {
    base: 1, from: '2026-11-17', until: '2026-11-18',
    task: 't0r-20261113', adults: 2, total: 40
  },
  'camp-day-3': {
    base: 3, from: '2026-11-19', until: '2026-11-20',
    task: 'book-pearson-20261113', adults: 2, total: 30
  },
  'c-hans-bay': {
    base: 4, from: '2026-11-20', until: '2026-11-21',
    task: 'book-pass-20261113'
  },
  'c-franz': {
    base: 5, from: '2026-11-21', until: '2026-11-23',
    task: 'book-otto-franz-20261113'
  }
};

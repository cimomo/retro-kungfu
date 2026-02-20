const STORAGE_KEY = 'retro-kungfu-leaderboard';
const MAX_ENTRIES = 10;

const ADJECTIVES = [
  'IRON', 'STEEL', 'SHADOW', 'CRIMSON', 'JADE', 'GOLDEN', 'SWIFT',
  'WILD', 'STORM', 'SILENT', 'FIERCE', 'BLAZING', 'FROZEN', 'DARK',
];
const NOUNS = [
  'DRAGON', 'TIGER', 'COBRA', 'PHOENIX', 'HAWK', 'WOLF', 'MANTIS',
  'VIPER', 'CRANE', 'PANTHER', 'FURY', 'FIST', 'NINJA', 'RONIN',
];

export function generateDefaultName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export function getLeaderboard() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) return data.slice(0, MAX_ENTRIES);
  } catch (e) { /* ignore */ }
  return [];
}

export function addLeaderboardEntry(name, score) {
  const board = getLeaderboard();
  board.push({ name: name.toUpperCase().slice(0, 14), score });
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getHighScore() {
  const board = getLeaderboard();
  return board.length > 0 ? board[0].score : 0;
}

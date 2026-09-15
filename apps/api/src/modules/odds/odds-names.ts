const STOPWORDS = new Set([
  'fc',
  'cf',
  'afc',
  'sc',
  'the',
  'de',
  'club',
  'football',
  'soccer',
  'basketball',
  'baseball',
]);

const ALIASES: Record<string, string> = {
  chiefs: 'kansas city chiefs',
  bills: 'buffalo bills',
  patriots: 'new england patriots',
  jets: 'new york jets',
  giants: 'new york giants',
  niners: 'san francisco 49ers',
  '49ers': 'san francisco 49ers',
  'san francisco niners': 'san francisco 49ers',
  commanders: 'washington commanders',
  washington: 'washington commanders',
  rams: 'los angeles rams',
  chargers: 'los angeles chargers',
  raiders: 'las vegas raiders',
  bengals: 'cincinnati bengals',
  browns: 'cleveland browns',
  steelers: 'pittsburgh steelers',
  ravens: 'baltimore ravens',
  dolphins: 'miami dolphins',
  packers: 'green bay packers',
  vikings: 'minnesota vikings',
  bears: 'chicago bears',
  lions: 'detroit lions',
  cowboys: 'dallas cowboys',
  eagles: 'philadelphia eagles',
  commandersfootball: 'washington commanders',
  broncos: 'denver broncos',
  seahawks: 'seattle seahawks',
  cardinals: 'arizona cardinals',
  saints: 'new orleans saints',
  falcons: 'atlanta falcons',
  panthers: 'carolina panthers',
  buccaneers: 'tampa bay buccaneers',
  bucs: 'tampa bay buccaneers',
  texans: 'houston texans',
  colts: 'indianapolis colts',
  jaguars: 'jacksonville jaguars',
  titans: 'tennessee titans',
  lakers: 'los angeles lakers',
  clippers: 'los angeles clippers',
  warriors: 'golden state warriors',
  knicks: 'new york knicks',
  nets: 'brooklyn nets',
  celtics: 'boston celtics',
  sixers: 'philadelphia 76ers',
  '76ers': 'philadelphia 76ers',
  bucks: 'milwaukee bucks',
  heat: 'miami heat',
  nuggets: 'denver nuggets',
  suns: 'phoenix suns',
  mavs: 'dallas mavericks',
  mavericks: 'dallas mavericks',
  thunder: 'oklahoma city thunder',
  okc: 'oklahoma city thunder',
  spurs: 'san antonio spurs',
  rockets: 'houston rockets',
  pelicans: 'new orleans pelicans',
  grizzlies: 'memphis grizzlies',
  kings: 'sacramento kings',
  blazers: 'portland trail blazers',
  'trail blazers': 'portland trail blazers',
  jazz: 'utah jazz',
  timberwolves: 'minnesota timberwolves',
  wolves: 'minnesota timberwolves',
  hawks: 'atlanta hawks',
  hornets: 'charlotte hornets',
  wizards: 'washington wizards',
  pistons: 'detroit pistons',
  pacers: 'indiana pacers',
  cavs: 'cleveland cavaliers',
  cavaliers: 'cleveland cavaliers',
  raptors: 'toronto raptors',
  magic: 'orlando magic',
  yankees: 'new york yankees',
  mets: 'new york mets',
  'red sox': 'boston red sox',
  sox: 'boston red sox',
  dodgers: 'los angeles dodgers',
  giantsmlb: 'san francisco giants',
  cubs: 'chicago cubs',
  'white sox': 'chicago white sox',
  astros: 'houston astros',
  braves: 'atlanta braves',
  phillies: 'philadelphia phillies',
  padres: 'san diego padres',
  mariners: 'seattle mariners',
  rangers: 'texas rangers',
  twins: 'minnesota twins',
  guardians: 'cleveland guardians',
  orioles: 'baltimore orioles',
  rays: 'tampa bay rays',
  royals: 'kansas city royals',
  tigers: 'detroit tigers',
  angels: 'los angeles angels',
  athletics: 'athletics',
  as: 'athletics',
  'oakland athletics': 'athletics',
  'oakland as': 'athletics',
  nationals: 'washington nationals',
  rockies: 'colorado rockies',
  diamondbacks: 'arizona diamondbacks',
  dbacks: 'arizona diamondbacks',
  brewers: 'milwaukee brewers',
  pirates: 'pittsburgh pirates',
  reds: 'cincinnati reds',
  marlins: 'miami marlins',
  'blue jays': 'toronto blue jays',
  jays: 'toronto blue jays',
  'real madrid': 'real madrid',
  rma: 'real madrid',
  dortmund: 'borussia dortmund',
  bvb: 'borussia dortmund',
  'bayern munich': 'bayern munchen',
  bayern: 'bayern munchen',
  'manchester city': 'manchester city',
  'man city': 'manchester city',
  'manchester united': 'manchester united',
  'man united': 'manchester united',
  'man utd': 'manchester united',
  barca: 'barcelona',
  psg: 'paris saint germain',
  'paris sg': 'paris saint germain',
  inter: 'inter milan',
  'ac milan': 'ac milan',
  milan: 'ac milan',
};

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

export function normalizeTeamName(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalTeamName(value: string): string {
  const normalized = normalizeTeamName(value);
  return ALIASES[normalized] ?? normalized;
}

function tokensOf(value: string): string[] {
  return canonicalTeamName(value)
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token));
}

export function namesMatch(left: string, right: string): boolean {
  const a = canonicalTeamName(left);
  const b = canonicalTeamName(right);
  if (!a || !b) return false;
  if (a === b) return true;

  const tokensA = tokensOf(left);
  const tokensB = tokensOf(right);
  if (!tokensA.length || !tokensB.length) return false;

  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];

  if (shorter.every((token) => longer.includes(token))) {
    return true;
  }

  const lastA = tokensA.at(-1);
  const lastB = tokensB.at(-1);
  return Boolean(lastA && lastA === lastB && lastA.length >= 4);
}

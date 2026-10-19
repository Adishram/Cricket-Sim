"""Import official ICC Next Flight tables from a cached public HTML response.
Usage: python3 scripts/import-icc-rankings.py /path/to/icc-rankings.html
No network or fuzzy matching. Keep current points, never career-best ratings.
"""
import csv, hashlib, json, re, sys, unicodedata
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
html = Path(sys.argv[1]).read_text()
tables = []
def walk(value):
    if isinstance(value, dict):
        if 'rank-type' in value and 'rank' in value: tables.append(value)
        for child in value.values(): walk(child)
    elif isinstance(value, list):
        for child in value: walk(child)
for match in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)</script>', html):
    for chunk in json.loads(match[1]):
        if not isinstance(chunk, str): continue
        for line in chunk.splitlines():
            if 'Player-name' in line:
                walk(json.loads(line.split(':', 1)[1]))
assert len(tables) == 9 and len({t['rank-type'] for t in tables}) == 9
read = lambda name: json.loads((ROOT / name).read_text())
players = read('src/snapshot.json')['players'] + read('src/auction-register.json')['extra']
def norm(name):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower())
aliases = {}
for row in csv.DictReader((ROOT / 'raw/names.csv').open()):
    aliases.setdefault(row['identifier'], set()).add(norm(row['name']))
identities = {x['player']: x['cricsheet'] for x in read('sources/recent-evidence-manifest.json')['identityMapping']}
index = {}
for p in players:
    audited_alias = {'Jimmy Neesham':'James Neesham', "William O'Rourke":"Will O'Rourke", 'Ottneil Baartman':'Ottniel Baartman'}.get(p['name'], p['name'])
    for name in {norm(p['name']), norm(audited_alias)} | aliases.get(identities.get(p['id']), set()):
        index.setdefault((name, norm(p['country'])), set()).add(p['id'])
matched, unmatched, normalized = {}, [], []
source = 'https://www.icc-cricket.com/rankings/mens-player-rankings'
for table in tables:
    fmt, kind = table['rank-type'].split('-')
    date = table['rank_date']
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', date)
    leader = max(int(r['Points']) for r in table['rank'])
    seen = set()
    previous_rank = 0
    for row in table['rank']:
        assert row['Player_id'] not in seen
        seen.add(row['Player_id'])
        rank, points = (previous_rank if row['no'] == '=' else int(row['no'])), int(row['Points'])
        previous_rank = rank
        assert 1 <= rank <= 100 and 0 <= points <= leader <= 1000
        entry = dict(format=fmt, discipline=kind, rank=rank, points=points, leaderPoints=leader, date=date, iccId=row['Player_id'], source=source)
        candidates = index.get((norm(row['Player-name']), norm(row['Country_name'])), set())
        normalized.append(dict(**entry, name=row['Player-name'], country=row['Country_name']))
        if len(candidates) == 1:
            pid = next(iter(candidates))
            matched.setdefault(pid, []).append(entry)
        else:
            unmatched.append(dict(name=row['Player-name'], country=row['Country_name'], table=table['rank-type'], candidates=sorted(candidates)))
output = dict(source=source, retrievedAt='2026-10-19', htmlSha256=hashlib.sha256(html.encode()).hexdigest(), players=matched)
(ROOT / 'src/icc-rankings.json').write_text(json.dumps(output, indent=2)+'\n')
(ROOT / 'sources/icc-rankings-manifest.json').write_text(json.dumps(dict(source=source, retrievedAt=output['retrievedAt'], htmlSha256=output['htmlSha256'], matching='Unique exact normalized name/Cricsheet alias AND country; no fuzzy matching', matchedPlayers=len(matched), tables=normalized, unmatched=unmatched), indent=2)+'\n')
print(f'{len(matched)} matched players; {sum(map(len,matched.values()))} ranking entries; {len(unmatched)} unmatched table entries')

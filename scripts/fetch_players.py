"""Download player portraits from Wikipedia/Wikimedia Commons (user-authorised), verify the page is the right cricketer,
and record the licence/credit for each file. Writes public/players/<player_id>.jpg and src/data/photo_credits.json."""
import json, re, time, urllib.parse, urllib.request, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
UA = {"User-Agent": "PressureAtlas/1.0 (independent cricket analytics project, one-off portrait download)"}
PLAYERS = {  # player_id -> Wikipedia title
 6281: "Abhishek Sharma (cricketer, born 2000)", 1699: "Suryakumar Yadav", 6819: "Yashasvi Jaiswal", 6396: "Tim David", 838: "Glenn Maxwell",
 4260: "Heinrich Klaasen", 8101: "Ashutosh Sharma (cricketer)", 4722: "Rashid Khan (cricketer)", 3323: "Jimmy Neesham", 4986: "Rovman Powell",
 2933: "Jasprit Bumrah", 7364: "Haris Rauf", 305: "Ravichandran Ashwin", 2633: "Jason Holder", 39657: "Eshan Malinga", 278: "Tim Southee",
 7920: "Nathan Ellis", 781: "Sunil Narine", 479: "Adil Rashid", 4265: "T. Natarajan",
}
def get(url, binary=False):
    for i in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: d = r.read(); return d if binary else json.loads(d)
        except Exception as e:
            if i == 5: raise
            time.sleep(10 * (i + 1) if '429' in str(e) else 2 + 3 * i)
API = "https://en.wikipedia.org/w/api.php?format=json&"
CRED = ROOT / 'src' / 'data' / 'photo_credits.json'
credits = json.loads(CRED.read_text()) if CRED.exists() else {}
for pid, t in PLAYERS.items():
    if str(pid) in credits and (ROOT / 'public' / 'players' / f'{pid}.jpg').exists(): continue
    q = get(API + urllib.parse.urlencode({"action": "query", "prop": "pageimages|extracts", "piprop": "thumbnail|name", "pithumbsize": 640, "exintro": 1, "explaintext": 1, "exsentences": 1, "titles": t, "redirects": 1}))
    page = next(iter(q["query"]["pages"].values()))
    extract = (page.get("extract") or "")[:160]
    if "cricket" not in extract.lower(): print("!! not a cricketer page:", pid, t, extract); continue
    if "thumbnail" not in page: print("-- no image:", pid, t); continue
    fname = "File:" + page["pageimage"]
    ii = get("https://commons.wikimedia.org/w/api.php?format=json&" + urllib.parse.urlencode({"action": "query", "prop": "imageinfo", "iiprop": "extmetadata|url", "titles": fname}))
    info = next(iter(ii["query"]["pages"].values())).get("imageinfo", [{}])[0]
    md = info.get("extmetadata", {})
    strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
    data = get(page["thumbnail"]["source"], binary=True)
    (ROOT / "public" / "players" / f"{pid}.jpg").write_bytes(data)
    credits[str(pid)] = dict(title=page["title"], description=extract, file=fname, file_url="https://commons.wikimedia.org/wiki/" + urllib.parse.quote(fname.replace(" ", "_")),
        artist=strip(md.get("Artist", {}).get("value")), license=strip(md.get("LicenseShortName", {}).get("value")), license_url=md.get("LicenseUrl", {}).get("value", ""), bytes=len(data))
    print("ok", pid, page["title"], "|", credits[str(pid)]["license"], "|", credits[str(pid)]["artist"][:40], "|", len(data) // 1024, "KB")
    CRED.write_text(json.dumps(credits, indent=1, ensure_ascii=False)); time.sleep(5)
(ROOT / "src" / "data" / "photo_credits.json").write_text(json.dumps(credits, indent=1, ensure_ascii=False))
print(len(credits), "photos")

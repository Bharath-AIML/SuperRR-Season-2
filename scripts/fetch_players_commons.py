"""Second pass for players whose Wikipedia page has no lead image: search Wikimedia Commons for files named after the player,
keep only freely licensed JPEG/PNG portraits whose title contains the full name. Records licence/credit."""
import json, re, time, urllib.parse, urllib.request, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
UA = {"User-Agent": "PressureAtlas/1.0 (independent cricket analytics project, one-off portrait download)"}
CRED = ROOT / "src" / "data" / "photo_credits.json"; credits = json.loads(CRED.read_text())
NAMES = {6281: "Abhishek Sharma", 6396: "Tim David", 4260: "Heinrich Klaasen", 8101: "Ashutosh Sharma", 3323: "Jimmy Neesham", 4986: "Rovman Powell", 39657: "Eshan Malinga", 7920: "Nathan Ellis"}
def get(url, binary=False):
    for i in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: d = r.read(); return d if binary else json.loads(d)
        except Exception as e:
            if i == 5: raise
            time.sleep(10 * (i + 1) if '429' in str(e) else 3)
strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
for pid, name in NAMES.items():
    if str(pid) in credits: continue
    q = get("https://commons.wikimedia.org/w/api.php?format=json&" + urllib.parse.urlencode({"action": "query", "generator": "search", "gsrnamespace": 6, "gsrsearch": f'"{name}" cricket', "gsrlimit": 12, "prop": "imageinfo", "iiprop": "extmetadata|url|size|mime", "iiurlwidth": 640}))
    cands = []
    for pg in (q.get("query", {}).get("pages", {}) or {}).values():
        ii = pg.get("imageinfo", [{}])[0]; md = ii.get("extmetadata", {}); title = pg["title"]
        lic = strip(md.get("LicenseShortName", {}).get("value"))
        ok = name.lower().replace(" ", "") in re.sub(r"[^a-z]", "", title.lower()) and ii.get("mime") in ("image/jpeg", "image/png") and re.search(r"CC|public domain|GODL|CC0", lic, re.I) and ii.get("height", 0) >= ii.get("width", 1) * 0.8
        if ok: cands.append((ii.get("height", 0) * ii.get("width", 0), title, ii, md, lic))
    if not cands: print("-- none:", pid, name); time.sleep(3); continue
    cands.sort(key=lambda c: -c[0]); _, title, ii, md, lic = cands[0]
    data = get(ii["thumburl"], binary=True)
    (ROOT / "public" / "players" / f"{pid}.jpg").write_bytes(data)
    credits[str(pid)] = dict(title=name, description="Wikimedia Commons file named for the player", file=title, file_url=ii["descriptionurl"], artist=strip(md.get("Artist", {}).get("value")), license=lic, license_url=md.get("LicenseUrl", {}).get("value", ""), bytes=len(data))
    CRED.write_text(json.dumps(credits, indent=1, ensure_ascii=False)); print("ok", pid, title, "|", lic, "|", strip(md.get("Artist", {}).get("value"))[:40]); time.sleep(5)

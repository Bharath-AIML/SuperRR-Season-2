"""Build web/src/data/*.json from the FINAL competition outputs (read-only). No values are invented or recomputed
except where a field is documented below.  Run from web/:  python3 scripts/build_data.py"""
import json, math, pandas as pd, pathlib, hashlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
O = ROOT / "outputs"; T = O / "tables"; OUT = pathlib.Path(__file__).resolve().parents[1] / "src" / "data"; OUT.mkdir(parents=True, exist_ok=True)

def clean(v):
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)): return None
    return v
def rec(df): return [{k: clean(v) for k, v in r.items()} for r in df.to_dict("records")]
def _san(o):
    if isinstance(o, dict): return {k: _san(v) for k, v in o.items()}
    if isinstance(o, list): return [_san(v) for v in o]
    return clean(o)
def j(name, obj): (OUT / name).write_text(json.dumps(_san(obj), indent=1, ensure_ascii=False, allow_nan=False))

sub = pd.read_csv(O / "SUBMISSION_rankings.csv")
players = {}
for side, f in (("bat", "FINAL_top10_bat.csv"), ("bowl", "FINAL_top10_bowl.csv")):
    t = pd.read_csv(T / f)
    # cross-check against the submission CSV
    s = sub[sub.category == ("BATTER" if side == "bat" else "BOWLER")].sort_values("rank")
    assert list(s.player_id) == list(t.player_id) and list(s["rank"]) == list(t["rank"]), "CSV mismatch"
    players[side] = rec(t)
j("top10.json", players)

# all eligible players (for scatter plots): pressure vs baseline, final rating
allp = {}
for side in ("bat", "bowl"):
    t = pd.read_csv(T / f"{side}_all_players_base.csv")
    t = t[t.eligible == True][["pid", "name", "n_h", "m_h", "S_h_raw", "S_h", "S_l", "final", "rank", "top10_prob"]]
    allp[side] = rec(t)
j("eligible.json", allp)

grid = {s: rec(pd.read_csv(T / f"{s}_sensitivity_grid.csv")) for s in ("bat", "bowl")}
j("sensitivity.json", grid)
j("pressure_validation.json", rec(pd.read_csv(T / "pressure_validation.csv")))
j("pressure_share.json", rec(pd.read_csv(T / "pressure_share_by_innings_phase.csv")))

rr = json.load(open(O / "ranking_results.json"))
wp = json.load(open(O / "wp_diagnostics.json"))
extra = dict(
    hyper={s: rr[s]["aux"] for s in ("bat", "bowl")},
    n_eligible={s: rr[s]["n_eligible"] for s in ("bat", "bowl")},
    split_half={s: rr[s]["split_half_spearman"] for s in ("bat", "bowl")},
    inclusion_freq_grid={s: rr[s]["inclusion_freq_grid"] for s in ("bat", "bowl")},
    wp=wp,
    chronological=json.load(open(O / "chronological_validation.json")),
    fairness=json.load(open(O / "ipl_t20i_fairness.json")),
    season=json.load(open(O / "qa" / "season_sensitivity.json")),
    se=json.load(open(O / "qa" / "se_design_effect.json")),
    penalty=json.load(open(O / "qa" / "penalty_sensitivity.json")),
)
j("model.json", extra)
# bootstrap top20 per side
j("bootstrap.json", {s: rec(pd.read_csv(T / f"{s}_bootstrap_summary.csv").sort_values("top10_prob", ascending=False).head(25)) for s in ("bat", "bowl")})
# provenance
prov = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in [O / "SUBMISSION_rankings.csv", O / "SupeRR_Round1_Methodology_Report.pdf"]}
j("provenance.json", prov)
print("ok", prov)

# sensitivity grid WITH top-10 membership lists (from ranking_results.json) and an id->name map
names = {}
for side in ("bat", "bowl"):
    for r in pd.read_csv(T / f"{side}_all_players_base.csv")[["pid", "name"]].itertuples(): names[int(r.pid)] = r.name
j("sensitivity_lists.json", {"names": names, **{s: [dict(label=g["label"], overlap=g["overlap_with_base"], n_elig=g["n_elig"], top10=g["top10"]) for g in rr[s]["grid"]] for s in ("bat", "bowl")}})
print("sensitivity lists ok")

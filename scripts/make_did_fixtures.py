"""Generate reference fixtures for the TypeScript DiD tests using statsmodels.

Datasets are generated here with numpy (independent of the TS RNG) and stored in full,
so the TS tests compare our estimator against statsmodels on identical rows.

Run (needs numpy, scipy, statsmodels):
    python scripts/make_did_fixtures.py
"""
import json
import pathlib

import numpy as np
import statsmodels.api as sm
from scipy import stats

OUT = pathlib.Path(__file__).parent.parent / "src/stats/__fixtures__/statsmodels.json"


def panel(seed, n, periods, start, effect, noise, base_diff, trend_diff, unit_sd):
    rng = np.random.default_rng(seed)
    rows = []
    for unit in range(2 * n):
        treated = 1 if unit < n else 0
        u = rng.normal(0, unit_sd)
        for t in range(periods):
            post = 1 if t >= start else 0
            y = (10 + 0.5 * t + treated * (base_diff + trend_diff * t)
                 + treated * post * effect + u + rng.normal(0, noise))
            rows.append(dict(unit=unit, period=t, treated=treated, post=post, y=float(y)))
    return rows


def fit(rows, cols, clusters):
    X = sm.add_constant(np.array([[r[c] if isinstance(c, str) else c(r) for c in cols] for r in rows]), has_constant="add")
    y = np.array([r["y"] for r in rows])
    res = sm.OLS(y, X).fit(cov_type="cluster", cov_kwds={"groups": np.array(clusters)},
                           use_t=True)
    ci = res.conf_int()
    return dict(params=res.params.tolist(), se=res.bse.tolist(), p=res.pvalues.tolist(),
                ci=ci.tolist(), df=int(res.df_resid))


scenarios = {
    "clean": dict(seed=1, n=30, periods=8, start=4, effect=2.0, noise=1.0, base_diff=3.0, trend_diff=0.0, unit_sd=0.0),
    "clustered_noise": dict(seed=2, n=25, periods=10, start=6, effect=1.5, noise=1.0, base_diff=-2.0, trend_diff=0.0, unit_sd=2.0),
    "trend_violation": dict(seed=3, n=40, periods=9, start=5, effect=1.0, noise=0.8, base_diff=1.0, trend_diff=0.3, unit_sd=1.0),
}

out = {"scenarios": {}, "t": {}}
for name, s in scenarios.items():
    rows = panel(**s)
    did = fit(rows, ["treated", "post", lambda r: r["treated"] * r["post"]], [r["unit"] for r in rows])
    pre = [r for r in rows if r["post"] == 0]
    pt = fit(pre, ["treated", "period", lambda r: r["treated"] * r["period"]], [r["unit"] for r in pre])
    out["scenarios"][name] = dict(rows=rows, did=did, parallel_trends=pt)

for df in (1, 5, 10, 29, 59, 100):
    out["t"][str(df)] = dict(q975=float(stats.t.ppf(0.975, df)), q90=float(stats.t.ppf(0.90, df)),
                              cdf_1_5=float(stats.t.cdf(1.5, df)), cdf_neg_2=float(stats.t.cdf(-2.0, df)))

OUT.write_text(json.dumps(out))
print("wrote", OUT, OUT.stat().st_size, "bytes")

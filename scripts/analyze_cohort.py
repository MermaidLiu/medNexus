#!/usr/bin/env python3
"""本地分析 91 例 Excel + 影像 ZIP（无需启动前端）.

用法:
  python scripts/analyze_cohort.py \\
    --excel data/cohort/91名.xlsx \\
    --zip data/cohort/影像学报告照片.zip
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.cohort_analysis import analyze_cohort  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="91例卵巢癌队列相关性分析")
    parser.add_argument("--excel", required=True, help="临床 Excel 路径")
    parser.add_argument("--zip", help="影像学报告 ZIP 路径")
    parser.add_argument("--out", default="data/cohort/analysis_result.json", help="输出 JSON")
    args = parser.parse_args()

    excel_path = Path(args.excel)
    if not excel_path.exists():
        print(f"Excel 不存在: {excel_path}", file=sys.stderr)
        sys.exit(1)

    excel_bytes = excel_path.read_bytes()
    zip_bytes = Path(args.zip).read_bytes() if args.zip else None

    result = analyze_cohort(excel_bytes, zip_bytes)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"病例数: {result['n_patients']}")
    print(f"映射字段: {list(result['columns_mapped'].keys())}")
    if zip_bytes:
        print(f"影像匹配率: {result['imaging']['match_rate'] * 100:.0f}%")
    print(f"结果已写入: {out_path}")


if __name__ == "__main__":
    main()

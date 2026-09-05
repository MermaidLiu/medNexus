#!/usr/bin/env bash
# MedNexus 前端 npm 安装 — 多镜像自动切换 + 可见进度
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Node: $(node -v)  npm: $(npm -v)"
echo ""

# 清除可能干扰的代理
npm config delete proxy 2>/dev/null || true
npm config delete https-proxy 2>/dev/null || true

echo "清理旧文件..."
rm -rf node_modules package-lock.json
npm cache clean --force 2>/dev/null || true

MIRRORS=(
  "https://registry.npmmirror.com"
  "https://mirrors.cloud.tencent.com/npm/"
  "https://repo.huaweicloud.com/repository/npm/"
)

INSTALL_ARGS=(
  --legacy-peer-deps
  --no-audit
  --no-fund
  --ignore-scripts
  --loglevel=info
  --fetch-retries=2
  --fetch-timeout=60000
)

for REG in "${MIRRORS[@]}"; do
  echo ""
  echo "=========================================="
  echo "尝试镜像: $REG"
  echo "=========================================="
  if npm install --registry="$REG" "${INSTALL_ARGS[@]}"; then
    echo ""
    echo "✓ 安装成功！镜像: $REG"
    echo "  运行: npm run dev"
    exit 0
  fi
  echo "✗ 镜像失败，切换下一个..."
  rm -rf node_modules package-lock.json
done

echo ""
echo "所有镜像均失败。请检查："
echo "  1. 关闭 VPN 后重试"
echo "  2. 换手机热点网络"
echo "  3. 运行: bash scripts/npm-doctor.sh"
exit 1

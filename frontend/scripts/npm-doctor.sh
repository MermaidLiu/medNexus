#!/usr/bin/env bash
echo "=== npm 网络诊断 ==="
echo "Node: $(node -v)"
echo "npm:  $(npm -v)"
echo ""

echo "--- npm 配置 ---"
npm config get registry
npm config get proxy
npm config get https-proxy
echo ""

echo "--- 测试镜像连通性 ---"
for url in \
  "https://registry.npmmirror.com/next" \
  "https://mirrors.cloud.tencent.com/npm/next" \
  "https://registry.npmjs.org/next"; do
  printf "%-55s " "$url"
  if curl -sf --connect-timeout 8 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q 200; then
    echo "OK"
  else
    echo "FAIL"
  fi
done

echo ""
echo "若全部 FAIL → 网络/VPN/防火墙问题，请换网络或关 VPN 后重试"
echo "若 OK → 运行: bash scripts/install.sh"

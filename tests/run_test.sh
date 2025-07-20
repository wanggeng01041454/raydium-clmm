#!/bin/bash

echo "运行测试前，要在根目录下运行 './build.sh local' 命令来编译合约"
echo "需要先启动 solana-test-validator 才能运行测试"

export ANCHOR_PROVIDER_URL="http://localhost:8899"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"

CUR_DIR=$(cd "$(dirname "$0")" && pwd)

# 安装合约
cd "$CUR_DIR/../target/deploy"

solana program deploy --url localhost byreal_clmm.so

cd "$CUR_DIR/../"
npx vitest --run

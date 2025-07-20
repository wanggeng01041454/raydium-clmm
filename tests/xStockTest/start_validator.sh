#!/bin/bash

CUR_DIR=$(cd "$(dirname "$0")" && pwd)

# if this is linux os, cd to '/tmp' directory
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  cd /tmp
else
  cd "$CUR_DIR"

  # remove 'test-ledger' directory if it exists
  if [ -d "test-ledger" ]; then
    rm -rf test-ledger
  fi
fi

# start the solana test validator
# 从 mainnet-beta 克隆 TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb , 因为 test-validator 不支持 ConfidentialTransferMint 扩展
echo "Starting solana test validator..."
solana-test-validator --reset --ledger test-ledger \
--clone Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh \
--url mainnet-beta \

#!/bin/sh

CUR_DIR=$(cd "$(dirname "$0")" && pwd)


# 管理员地址
# localnet 使用单签地址
LOCALNET_ADMIN_KEYPAIR=${CUR_DIR}/localnet-admin-keypair.json
LOCALNET_ADMIN_ADDRESS=$(solana address -k "$LOCALNET_ADMIN_KEYPAIR")
# devnet 使用多签地址
DEVNET_ADMIN_ADDRESS=9ZG4mYtayKedcDkRbpGAc13uQDT2Ag9twJBbuwia9Lqg
# mainnet的多签地址，最终上主网前，要check这个地址
MAINNET_ADMIN_ADDRESS=AY196f8U5EvM999PVnvLmyvaUnzL4GLiFaGKUgnJXN6o

# 合约部署地址
# localnet 和 devnet 使用同一个地址
LOCALNET_ADDRESS_KEYPAIR=${CUR_DIR}/byreal_clmm-keypair-devnet.json
DEVNET_ADDRESS_KEYPAIR=${CUR_DIR}/byreal_clmm-keypair-devnet.json
MAINNET_ADDRESS_KEYPAIR=${CUR_DIR}/byreal_clmm-keypair-mainnet.json

DEPLOY_KEYPAIR=${CUR_DIR}/target/deploy/byreal_clmm-keypair.json

IDL_FILE="$CUR_DIR/target/idl/byreal_clmm.json"

if [ "$1" = "local" ] || [ "$1" = "localnet" ]; then
  echo "按照【本地自测环境】构建"

  cp "$LOCALNET_ADDRESS_KEYPAIR" "$DEPLOY_KEYPAIR"
  anchor build -- --features localnet

  ADMIN_ADDR=$LOCALNET_ADMIN_ADDRESS
elif [ "$1" = "dev" ] || [ "$1" = "devnet" ]; then
  echo "按照【开发环境】构建"

  cp "$DEVNET_ADDRESS_KEYPAIR" "$DEPLOY_KEYPAIR"
  anchor build -- --features devnet

  ADMIN_ADDR=$DEVNET_ADMIN_ADDRESS
else
  echo "按照=====生产环境======构建"

  cp "$MAINNET_ADDRESS_KEYPAIR" "$DEPLOY_KEYPAIR"
  anchor build

  ADMIN_ADDR=$MAINNET_ADMIN_ADDRESS

  echo "copy IDL 文件到 idl 目录"
  cp -f "$IDL_FILE" "$CUR_DIR/idl"
fi

PROGRAM_ID=$(solana address -k "$DEPLOY_KEYPAIR")
echo "程序ID: $PROGRAM_ID"
echo "admin地址: $ADMIN_ADDR"

if grep -q "${PROGRAM_ID}" "${IDL_FILE}"; then
  echo "IDL 文件包含 program-id: ${PROGRAM_ID}, 正确：✅"
else
  echo "IDL 文件缺少 program-id: ${PROGRAM_ID}, 错误：❌"
  echo "❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ "
  exit 1
fi

if grep -q "${ADMIN_ADDR}" "${IDL_FILE}"; then
  echo "IDL 文件包含 admin地址: ${ADMIN_ADDR}, 正确：✅"
else
  echo "IDL 文件缺少 admin地址: ${ADMIN_ADDR}, 错误：❌"
  echo "❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ ❌ "
  exit 1
fi

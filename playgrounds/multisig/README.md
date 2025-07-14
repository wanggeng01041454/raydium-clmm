# Multisig SDK

## 基础

```bash
# 先 cd 到 libs/test-sdk 目录
cd libs/test-sdk

# 启动本地测试节点
bash src/multisig/scripts/start-solana-test-validator.sh
```

## Examples

执行例子：

```bash
bun run src/multisig/00_createMultisig.ts
```

- 00_createMultisig.ts 创建多重签名钱包
- 01_baseTransfer.ts 基础转账，演示多重签名钱包的 提案、投票、执行等操作。
- 02_initAmmAdminGroup.ts 初始化 AMM 管理员组
- 03_updateAmmAdminGroup.ts 更新 AMM 管理员组
- (UI 暂时不用做) 04_createAmmConfig.ts 创建 AMM 配置
- 05_createPool.ts 创建 AMM 池
- 06_depositOffchainReward.ts 存入 offchain 奖励
- 07_withdrawOffchainReward.ts 提取 offchain 奖励
- 08_updatePoolStatus.ts 更新 AMM 池状态
- (UI 暂时不用做) 09_createSupportMintAssociated.ts 创建支持 mint 关联账户

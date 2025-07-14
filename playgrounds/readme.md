# README

## 测试指令

### 新增指令

#### 管理员组相关

- `init_amm_admin_group` - 初始化管理员组
- `update_amm_admin_group` - 更新管理员组权限

#### 链下奖励相关

- `deposit_offchain_reward` - 存入奖励代币
- `claim_offchain_reward` - 用户领取奖励
- `withdraw_offchain_reward` - 管理员提取奖励

### 已有的存在变更的指令

- admin 目录下的指令
- programs/amm/src/instructions/collect_remaining_rewards.rs ✅
- programs/amm/src/instructions/create_pool.rs ✅
- programs/amm/src/instructions/initialize_reward.rs ✅
- programs/amm/src/instructions/set_reward_params.rs ✅

## 权限角色

- fee_keeper - 费用接收者
- reward_config_manager - 奖励配置管理员
- reward_claim_manager - 奖励领取管理员
- pool_manager - 池子管理员
- emergency_manager - 紧急情况管理员
- normal_manager - 普通管理员

## 测试文件

- `01_init_amm_admin_group.ts` - 初始化管理员组
- `02_update_amm_admin_group.ts` - 更新管理员组
- `03_deposit_offchain_reward.ts` - 存入链下奖励
- `04_claim_offchain_reward.ts` - 领取链下奖励
- `05_withdraw_offchain_reward.ts` - 提取链下奖励
- `06_create_amm_config_v2.ts` - 创建 AMM 配置(新权限模型)

### 测试例子

- 调用 init_amm_admin_group 指令
- 调用 update_amm_admin_group 指令
- 调用一个基础的需要管理员权限的指令
  - 例如：createAmmConfig、createOperationAccount
- Reward 相关的指令，只补充最基础的，不封上层的业务
- 测试 执行一个创建 pool 的指令 ‼️

## 使用说明

1. 先运行 `01_init_amm_admin_group.ts` 初始化管理员组
2. 根据需要修改测试文件中的地址和参数
3. 确保账户有足够权限和代币余额
4. 重新生成 IDL 以解决类型匹配问题

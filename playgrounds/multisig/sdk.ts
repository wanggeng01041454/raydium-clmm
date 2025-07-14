import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Permission, Permissions } = multisig.types;

/**
 * 多重签名配置接口
 */
export interface MultisigConfig {
  /** 连接对象 */
  connection: Connection;
  /** 多重签名 PDA 地址 */
  multisigPda: PublicKey;
  /** 程序配置 PDA（可选，如果不提供会自动获取） */
  programConfigPda?: PublicKey;
}

/**
 * 创建多重签名钱包的参数
 */
export interface CreateMultisigParams {
  /** 创建密钥 */
  createKey: Keypair;
  /** 创建者（也是费用支付者） */
  creator: Keypair;
  /** 签名阈值 */
  threshold: number;
  /** 成员列表 */
  members: {
    key: PublicKey;
    permissions: multisig.types.Permissions;
  }[];
  /** 配置权限（可选） */
  configAuthority?: PublicKey | null;
  /** 时间锁（可选，默认为0） */
  timeLock?: number;
  /** 租金收集者（可选） */
  rentCollector?: PublicKey | null;
}

/**
 * 创建提案的参数
 */
export interface CreateProposalParams {
  /** 费用支付者 */
  feePayer: Keypair;
  /** 创建者 */
  creator: Keypair;
  /** 交易指令列表 */
  instructions: TransactionInstruction[];
  /** 备注信息（可选） */
  memo?: string;
  /** Vault 索引（默认为0） */
  vaultIndex?: number;
  /** 临时签名者数量（默认为0） */
  ephemeralSigners?: number;
}

/**
 * 投票参数
 */
export interface VoteParams {
  /** 费用支付者 */
  feePayer: Keypair;
  /** 投票成员 */
  member: Keypair;
  /** 交易索引 */
  transactionIndex: bigint;
}

/**
 * 执行提案参数
 */
export interface ExecuteProposalParams {
  /** 费用支付者 */
  feePayer: Keypair;
  /** 执行成员的公钥 */
  memberPublicKey: PublicKey;
  /** 签名者列表 */
  signers: Keypair[];
  /** 交易索引 */
  transactionIndex: bigint;
}

/**
 * 提案信息
 */
export interface ProposalInfo {
  transactionIndex: number;
  proposalPda: string;
  proposalExists: boolean;
  status?: multisig.generated.ProposalStatus;
  approved?: PublicKey[];
  rejected?: PublicKey[];
  cancelled?: PublicKey[];
}

/**
 * 多重签名钱包信息
 */
export interface MultisigInfo {
  multisigPda: string;
  createKey: string;
  configAuthority: string | null;
  threshold: number;
  memberCount: number;
  timeLock: number;
  currentTransactionIndex: number;
  staleTransactionIndex: number;
  rentCollector: string | null;
  members: {
    index: number;
    address: string;
    permissions: string;
  }[];
  vault: {
    address: string;
    balance: number;
  };
}

/**
 * 多重签名 SDK 主类
 */
export class MultisigSDK {
  private connection: Connection;
  private multisigPda: PublicKey;
  private programConfigPda: PublicKey;

  constructor(config: MultisigConfig) {
    this.connection = config.connection;
    this.multisigPda = config.multisigPda;
    this.programConfigPda =
      config.programConfigPda || multisig.getProgramConfigPda({})[0];
  }

  /**
   * 创建多重签名钱包
   */
  async createMultisig(params: CreateMultisigParams): Promise<string> {
    // 获取程序配置信息
    const programConfig =
      await multisig.accounts.ProgramConfig.fromAccountAddress(
        this.connection,
        this.programConfigPda
      );

    const signature = await multisig.rpc.multisigCreateV2({
      connection: this.connection,
      createKey: params.createKey,
      creator: params.creator,
      multisigPda: this.multisigPda,
      configAuthority: params.configAuthority || null,
      timeLock: params.timeLock || 0,
      members: params.members,
      threshold: params.threshold,
      rentCollector: params.rentCollector || null,
      treasury: programConfig.treasury,
    });

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * 创建提案
   */
  async createProposal(params: CreateProposalParams): Promise<{
    vaultTransactionSignature: string;
    proposalCreateSignature: string;
    transactionIndex: bigint;
  }> {
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: this.multisigPda,
      index: params.vaultIndex || 0,
    });

    // 获取当前交易索引
    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      this.connection,
      this.multisigPda
    );

    const currentTransactionIndex = Number(multisigInfo.transactionIndex);
    const newTransactionIndex = BigInt(currentTransactionIndex + 1);

    // 创建交易消息
    const transactionMessage = new TransactionMessage({
      payerKey: vaultPda,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions: params.instructions,
    });

    // 创建 vault 交易
    const vaultTransactionSignature = await multisig.rpc.vaultTransactionCreate(
      {
        connection: this.connection,
        feePayer: params.feePayer,
        multisigPda: this.multisigPda,
        transactionIndex: newTransactionIndex,
        creator: params.creator.publicKey,
        vaultIndex: params.vaultIndex || 0,
        ephemeralSigners: params.ephemeralSigners || 0,
        transactionMessage,
        memo: params.memo || "",
      }
    );

    await this.connection.confirmTransaction(vaultTransactionSignature);

    // 创建提案
    const proposalCreateSignature = await multisig.rpc.proposalCreate({
      connection: this.connection,
      feePayer: params.feePayer,
      multisigPda: this.multisigPda,
      transactionIndex: newTransactionIndex,
      creator: params.creator,
    });

    await this.connection.confirmTransaction(proposalCreateSignature);

    return {
      vaultTransactionSignature,
      proposalCreateSignature,
      transactionIndex: newTransactionIndex,
    };
  }

  /**
   * 投票支持提案
   */
  async approveProposal(params: VoteParams): Promise<string> {
    const signature = await multisig.rpc.proposalApprove({
      connection: this.connection,
      feePayer: params.feePayer,
      multisigPda: this.multisigPda,
      transactionIndex: params.transactionIndex,
      member: params.member,
    });

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * 投票拒绝提案
   */
  async rejectProposal(params: VoteParams): Promise<string> {
    const signature = await multisig.rpc.proposalReject({
      connection: this.connection,
      feePayer: params.feePayer,
      multisigPda: this.multisigPda,
      transactionIndex: params.transactionIndex,
      member: params.member,
    });

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * 执行提案
   */
  async executeProposal(params: ExecuteProposalParams): Promise<string> {
    const signature = await multisig.rpc.vaultTransactionExecute({
      connection: this.connection,
      feePayer: params.feePayer,
      multisigPda: this.multisigPda,
      transactionIndex: params.transactionIndex,
      member: params.memberPublicKey,
      signers: params.signers,
    });

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * 获取多重签名钱包信息
   */
  async getMultisigInfo(): Promise<MultisigInfo> {
    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      this.connection,
      this.multisigPda
    );

    // 获取 Vault 信息
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: this.multisigPda,
      index: 0,
    });

    const vaultBalance = await this.connection.getBalance(vaultPda);

    return {
      multisigPda: this.multisigPda.toBase58(),
      createKey: multisigInfo.createKey.toBase58(),
      configAuthority: multisigInfo.configAuthority?.toBase58() || null,
      threshold: multisigInfo.threshold,
      memberCount: multisigInfo.members.length,
      timeLock: multisigInfo.timeLock,
      currentTransactionIndex: Number(multisigInfo.transactionIndex),
      staleTransactionIndex: Number(multisigInfo.staleTransactionIndex),
      rentCollector: multisigInfo.rentCollector?.toBase58() || null,
      members: multisigInfo.members.map((member, index) => ({
        index: index + 1,
        address: member.key.toBase58(),
        permissions: this.getPermissionDescription(member.permissions),
      })),
      vault: {
        address: vaultPda.toBase58(),
        balance: vaultBalance / LAMPORTS_PER_SOL,
      },
    };
  }

  /**
   * 获取所有提案列表
   */
  async getProposals(): Promise<ProposalInfo[]> {
    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      this.connection,
      this.multisigPda
    );

    const currentTransactionIndex = Number(multisigInfo.transactionIndex);
    const proposals: ProposalInfo[] = [];

    // 遍历所有可能的 transactionIndex (从1开始到当前索引)
    for (let i = 1; i <= currentTransactionIndex; i++) {
      try {
        const [proposalPda] = multisig.getProposalPda({
          multisigPda: this.multisigPda,
          transactionIndex: BigInt(i),
        });

        const proposalAccount = await this.connection.getAccountInfo(
          proposalPda
        );

        if (proposalAccount) {
          proposals.push({
            transactionIndex: i,
            proposalPda: proposalPda.toBase58(),
            proposalExists: true,
          });
        }
      } catch (error) {
        // 提案不存在，跳过
      }
    }

    return proposals;
  }

  /**
   * 获取特定提案的详细信息
   */
  async getProposalDetail(
    transactionIndex: number
  ): Promise<ProposalInfo | null> {
    try {
      const [proposalPda] = multisig.getProposalPda({
        multisigPda: this.multisigPda,
        transactionIndex: BigInt(transactionIndex),
      });

      const proposalInfo = await multisig.accounts.Proposal.fromAccountAddress(
        this.connection,
        proposalPda
      );

      return {
        transactionIndex,
        proposalPda: proposalPda.toBase58(),
        proposalExists: true,
        status: proposalInfo.status,
        approved: proposalInfo.approved,
        rejected: proposalInfo.rejected,
        cancelled: proposalInfo.cancelled,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 解析提案中的交易指令
   */
  async parseTransactionInstructions(transactionIndex: number) {
    const [transactionPda] = multisig.getTransactionPda({
      multisigPda: this.multisigPda,
      index: BigInt(transactionIndex),
    });

    const vaultTransaction =
      await multisig.accounts.VaultTransaction.fromAccountAddress(
        this.connection,
        transactionPda
      );

    const message = vaultTransaction.message;

    const handledInstructions = message.instructions.map(
      (ix: multisig.generated.MultisigCompiledInstruction, index: number) => {
        const programId = message.accountKeys[ix.programIdIndex];
        const accounts = Array.from<number>(
          ix.accountIndexes as Uint8Array
        ).map((accIdx) => {
          const pubkey = message.accountKeys[accIdx];
          const isSigner = accIdx < message.numSigners;

          return {
            pubkey: pubkey.toBase58(),
            isSigner,
          };
        });

        console.log("accounts ==> ", accounts);

        return {
          index,
          programId: programId.toBase58(),
          accounts,
          data: ix.data,
          // TODO: 在此调用 tryParseInstruction 进一步解析
        };
      }
    );

    return handledInstructions;
  }

  /**
   * 获取 Vault PDA 地址
   */
  getVaultPda(index = 0): PublicKey {
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: this.multisigPda,
      index,
    });
    return vaultPda;
  }

  /**
   * Tips: 本地或者测试网可用
   *
   * 为 Vault 充值 SOL
   */
  async airdropToVault(amount: number, vaultIndex = 0): Promise<string> {
    const vaultPda = this.getVaultPda(vaultIndex);
    const signature = await this.connection.requestAirdrop(
      vaultPda,
      amount * LAMPORTS_PER_SOL
    );
    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * 解析权限描述
   */
  private getPermissionDescription(
    permissions: multisig.generated.Permissions
  ): string {
    const permissionList: string[] = [];

    if (permissions.mask & Permission.Initiate) {
      permissionList.push("Initiate");
    }
    if (permissions.mask & Permission.Vote) {
      permissionList.push("Vote");
    }
    if (permissions.mask & Permission.Execute) {
      permissionList.push("Execute");
    }

    if (permissions.mask === Permissions.all().mask) {
      return "All";
    }

    return permissionList.length > 0 ? permissionList.join(", ") : "None";
  }
}

/**
 * 多重签名工具类
 */
export class MultisigUtils {
  /**
   * 生成多重签名 PDA
   */
  static getMultisigPda(createKey: PublicKey): [PublicKey, number] {
    return multisig.getMultisigPda({ createKey });
  }

  /**
   * 生成 Vault PDA
   */
  static getVaultPda(
    multisigPda: PublicKey,
    index: number
  ): [PublicKey, number] {
    return multisig.getVaultPda({ multisigPda, index });
  }

  /**
   * 生成提案 PDA
   */
  static getProposalPda(
    multisigPda: PublicKey,
    transactionIndex: bigint
  ): [PublicKey, number] {
    return multisig.getProposalPda({ multisigPda, transactionIndex });
  }

  /**
   * 生成交易 PDA
   */
  static getTransactionPda(
    multisigPda: PublicKey,
    index: bigint
  ): [PublicKey, number] {
    return multisig.getTransactionPda({ multisigPda, index });
  }

  /**
   * 创建权限对象
   */
  static createPermissions(permissions: string[]): multisig.types.Permissions {
    const permissionFlags = permissions.map((p) => {
      switch (p.toLowerCase()) {
        case "initiate":
          return Permission.Initiate;
        case "vote":
          return Permission.Vote;
        case "execute":
          return Permission.Execute;
        default:
          throw new Error(`Unknown permission: ${p}`);
      }
    });
    return Permissions.fromPermissions(permissionFlags);
  }

  /**
   * 创建全部权限
   */
  static allPermissions(): multisig.types.Permissions {
    return Permissions.all();
  }
}

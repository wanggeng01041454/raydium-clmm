use crate::error::ErrorCode;
use anchor_lang::prelude::*;

pub const OFFCHAIN_REWARD_SEED: &str = "offchain_reward";

/// Holds the current owner of the factory
#[account]
#[derive(Default, Debug)]
pub struct OffchainRewardConfig {
    /// the pool state address
    pub pool_id: Pubkey,

    /// the vault to hold the reward
    /// vault address is this config address
    pub reward_vault: Pubkey,

    /// Bump to identify vault PDA
    pub vault_bump: u8,

    /// reward token mint address list
    /// reward token account is ATA(reward_vault, reward_mint)
    pub reward_mint_vec: Vec<Pubkey>,
}

impl OffchainRewardConfig {
    const BASE_LENGTH: usize = 8 + 32 + 32 + 1 + 4;

    /// if store count of reward_mint_vec, the length of this account is BASE_LENGTH + count * 32
    pub fn need_len(count: usize) -> usize {
        Self::BASE_LENGTH + count * 32 // 32 for each Pubkey in reward_mint_vec
    }

    /// real length of this account
    pub fn real_len(&self) -> usize {
        Self::BASE_LENGTH + self.reward_mint_vec.len() * 32 // 32 for each Pubkey in reward_mint_vec
    }

    pub fn initialize(
        &mut self,
        pool_id: Pubkey,
        reward_vault: Pubkey,
        vault_bump: u8,
    ) -> Result<()> {
        self.pool_id = pool_id;
        self.reward_vault = reward_vault;
        self.vault_bump = vault_bump;

        Ok(())
    }
}

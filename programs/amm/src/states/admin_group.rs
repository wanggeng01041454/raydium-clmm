use anchor_lang::prelude::*;

pub const ADMIN_GROUP_SEED: &str = "admin_group";

/// Holds the admin group information.
#[account]
#[derive(Default, Debug, InitSpace)]
pub struct AmmAdminGroup {
    /// the address who can hold the fee,
    /// anyone can trigger the fee collection action,
    pub fee_manager: Pubkey,

    /// the address who can manage the reward
    /// set reward, set the account who can set the reward, claim the remaining reward
    pub reward_manager: Pubkey,

    /// the address who can manage the pool create action,
    /// without this account's permission, no one can create a pool
    pub pool_manager: Pubkey,

    /// the address who can manage the emergency action,
    /// emergency action includes stop/resume the pool, stop/resume withdraw lp
    pub emergency_manager: Pubkey,

    /// normal action manager,
    /// such as create amm config, update amm config
    pub normal_manager: Pubkey,
}

impl AmmAdminGroup {
    pub const LEN: usize = 8 + Self::INIT_SPACE;
}

#[event]
pub struct ModifyAmmAdminGroupEvent {
    pub fee_manager: Pubkey,
    pub reward_manager: Pubkey,
    pub pool_manager: Pubkey,
    pub emergency_manager: Pubkey,
    pub normal_manager: Pubkey,
}

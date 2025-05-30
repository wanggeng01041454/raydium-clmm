use crate::error::ErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;
use std::ops::DerefMut;

#[derive(Accounts)]
#[instruction(index: u16)]
pub struct UpdateAdminGroupAccounts<'info> {
    /// only super admin can create admin group
    #[account(
        mut,
        address = crate::admin::ID @ ErrorCode::NotApproved
    )]
    pub payer: Signer<'info>,

    /// Initialize amm admin group account to store admin permissions.
    #[account(
        mut,
        seeds = [
            ADMIN_GROUP_SEED.as_bytes()
        ],
        bump,
    )]
    pub admin_group: Account<'info, AmmAdminGroup>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Debug)]
pub struct UpdateAdminGroupParams {
    /// the address who can claim the fee
    pub fee_manager: Option<Pubkey>,

    /// the address who can manage the reward
    /// set reward, set the account who can set the reward, claim the remaining reward
    pub reward_manager: Option<Pubkey>,

    /// the address who can manage the pool create action,
    /// without this account's permission, no one can create a pool
    pub pool_manager: Option<Pubkey>,

    /// the address who can manage the emergency action,
    /// emergency action includes stop/resume the pool, stop/resume withdraw lp
    pub emergency_manager: Option<Pubkey>,

    /// normal action manager,
    /// such as create amm config, update amm config
    pub normal_manager: Option<Pubkey>,
}

pub fn update_amm_admin_group(
    ctx: Context<InitAdminGroupAccounts>,
    params: InitAdminGroupParams,
) -> Result<()> {
    let admin_group = ctx.accounts.admin_group.deref_mut();

    if let Some(fee_manager) = params.fee_manager {
        admin_group.fee_manager = fee_manager;
    }
    if let Some(reward_manager) = params.reward_manager {
        admin_group.reward_manager = reward_manager;
    }
    if let Some(pool_manager) = params.pool_manager {
        admin_group.pool_manager = pool_manager;
    }
    if let Some(emergency_manager) = params.emergency_manager {
        admin_group.emergency_manager = emergency_manager;
    }
    if let Some(normal_manager) = params.normal_manager {
        admin_group.normal_manager = normal_manager;
    }

    emit!(ModifyAmmAdminGroupEvent {
        fee_manager: admin_group.fee_manager,
        reward_manager: admin_group.reward_manager,
        pool_manager: admin_group.pool_manager,
        emergency_manager: admin_group.emergency_manager,
        normal_manager: admin_group.normal_manager,
    });

    Ok(())
}

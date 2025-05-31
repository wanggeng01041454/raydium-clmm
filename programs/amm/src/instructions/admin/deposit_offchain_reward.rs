use crate::error::ErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use std::ops::DerefMut;

#[derive(Accounts)]
#[instruction(index: u16)]
pub struct DepositOffchainRewardAccounts<'info> {
    /// the address paying to deposit the offchain reward.
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
      address = admin_group.reward_config_manager @ ErrorCode::NotApproved
    )]
    pub authority: Signer<'info>,

    /// Initialize amm admin group account to store admin permissions.
    #[account(
        seeds = [
            ADMIN_GROUP_SEED.as_bytes()
        ],
        bump,
    )]
    pub admin_group: Account<'info, AmmAdminGroup>,

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,

    ///
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = payer,
        token::token_program = token_program,
    )]
    pub payer_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = payer,
        token::token_program = token_program,
    )]
    pub reward_vault_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Spl token program or token program 2022
    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_offchain_reward(
    ctx: Context<DepositOffchainRewardAccounts>,
    amount: u64,
) -> Result<()> {
    Ok(())
}

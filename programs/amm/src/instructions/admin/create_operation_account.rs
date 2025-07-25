use crate::error::ErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct CreateOperationAccount<'info> {
    /// Address to be set as operation account owner.
    #[account(
        mut,
        address = admin_group.reward_config_manager @ ErrorCode::NotApproved
    )]
    pub owner: Signer<'info>,

    /// amm admin group account to store admin permissions.
    #[account(
        seeds = [
            ADMIN_GROUP_SEED.as_bytes()
        ],
        bump,
    )]
    pub admin_group: Box<Account<'info, AmmAdminGroup>>,

    /// Initialize operation state account to store operation owner address and white list mint.
    #[account(
        init,
        seeds = [
            OPERATION_SEED.as_bytes(),
        ],
        bump,
        payer = owner,
        space = OperationState::LEN
    )]
    pub operation_state: AccountLoader<'info, OperationState>,

    pub system_program: Program<'info, System>,
}

pub fn create_operation_account(ctx: Context<CreateOperationAccount>) -> Result<()> {
    let mut operation_state = ctx.accounts.operation_state.load_init()?;
    operation_state.initialize(ctx.bumps.operation_state);
    Ok(())
}

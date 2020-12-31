---
title: "Programming on Solana - An Introduction"
summary: Learn the fundamentals of Programming on Solana by building an escrow
date: 2020-12-24
tags:
    - solana
    - blockchain
    - coding
---

::: blog-meta
:::

## Intro
This guide is meant to serve as an intro to coding on [Solana](https://www.solana.com),
using an escrow program as an example. We'll go through the code together, building the escrow program step by step.

> On Solana, smart contracts are called _programs_

Most of the info in this blog post can be found somewhere in the docs or in example programs. Having said this, I have not found a guide that both walks through most of the coding theory step by step and applies it in practice. I hope this post achieves this, interweaving the theory and practice of solana programs. It requires no previous knowledge of Solana. While this is not a Rust tutorial, I will link to the [Rust docs](https://doc.rust-lang.org/book) whenever I introduce a new concept.
I will also link to the relevant Solana docs although you don't have to read them to follow along.

At the end of each section, important theory will be summarized like this:

::: theory-recap
- On Solana, smart contracts are called _programs_
:::

I do not claim to explain _all_ topics but hope this will be a solid starting point from which the reader can explore Solana further.


## The Final Product

Before we start coding, let's look at the final product to understand what we are building: an escrow program.

### What is an escrow?
An escrow smart contract is a good example to look at and build because it highlights well what a blockchain makes possible while still being easy to understand, allowing us to focus on the code itself. For those unfamiliar with the concept, here is a brief explainer.

![](../images/2020-12-24/escrow.gif)

Imagine Alice has an asset _A_ and Bob has an asset _B_. They would like to trade their assets but neither wants to send their asset first. After all, what if the other party does not hold up their end of the trade and runs away with both assets? A deadlock will be reached where no party wants to send their asset first.

The traditional way to solve this problem is to introduce a third party _C_ which both _A_ and _B_ trust. _A_ or _B_ can now go first and send their asset to _C_. _C_ then waits for the other party to send their asset and only then does _C_ release both assets.

The blockchain way is to replace the trusted third party _C_ with code on a blockchain, specifically a smart contract that verifiably acts the same way a trusted third party would. A smart contract is superior to a trusted third party because of a number of reasons e.g. can you be sure that the trusted third party isn't colluding with the person on the other side of the trade? You can be with a smart contract, because you can look at the code before running it.

I'll end this background section here. The internet already has a lot of material on escrows on blockchains. Let's now look at how to build such an escrow on Solana.

## Building the escrow program - Alice's Transaction

### Setting up the project
Head over to the [template repo](https://github.com/mvines/solana-bpf-program-template), click `Use this template`, and set up a repo. The Solana ecosystem is still young so this is what we've got for now. Additionally, go [here](https://docs.solana.com/cli/install-solana-cli-tools) to install the Solana dev tools.

If you don't know how to test solana programs yet, remove all the testing code. Testing programs is a topic for another blog post. Remove the testing code in `entrypoint.rs` as well as the `tests` folder next to `src`. Lastly, remove the testing dependencies from `Cargo.toml`. It should now look like this:

```toml
[package]
name = "solana-escrow"
version = "0.1.0"
edition = "2018"
license = "WTFPL"
publish = false

[dependencies]
solana-program = "1.5.0"

[lib]
crate-type = ["cdylib", "lib"]
```

### entrypoint.rs, programs, and accounts
Have a look into `lib.rs`. First, the required crates are brought into scope using [use](https://doc.rust-lang.org/stable/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html). Then we use the `entrypoint!` [macro](https://doc.rust-lang.org/stable/book/ch19-06-macros.html) to declare the `process_instruction` function the [entrypoint](https://docs.solana.com/developing/deployed-programs/developing-rust#program-entrypoint) to the program. Entrypoints are the only way to call a program; all calls go through the function declared as the entrypoint.

> When called, a program is passed to its [BPF Loader]((https://docs.solana.com/developing/builtins/programs#bpf-loader)) which processes the call. Different BPF loaders may require different entrypoints.

The reason for the existence of multiple BPF Loaders is that it itself is a program. If updates are made to the program, a new program version has to be deployed. We can see that the BPF loader we are using requires the entrypoint function to take 3 arguments. `program_id` is simply the program id of the currently executing program. Why you'd want access to it inside the program will become apparent later. `intruction_data` is data passed to he program by the caller, it could be anything. Finally, to understand what `accounts` are, we have to dive deeper into the [solana programming model](https://docs.solana.com/developing/programming-model/overview). The reason we need accounts is because

> Solana programs are stateless

If you want to store state, use accounts. Programs themselves are stored in accounts which are marked `executable`. Each account can hold data and Sol.
Each account also has an `owner` and only the owner may debit the account and adjust its data. Crediting may be done by anyone. Here's an example of an [account](https://explorer.solana.com/address/6TkKqq15wXjqEjNg9zqTKADwuVATR9dW3rkNnsYme1ea). As you can see in the example account, it has its owner field set to the `System Program`. As a matter of fact,

> Accounts can only be owned by programs

Now you might be thinking "does that mean that my own SOL account is actually not owned by myself?". And you'd be right! But fear not, your funds are safu. The way it works is that even basic SOL transactions are handled by a program on Solana: the `system program`.

![](../images/2020-12-24/2020-12-24-always-has-been.jpeg)

[If you look at the system program](https://github.com/solana-labs/solana/blob/master/runtime/src/system_instruction_processor.rs#L179) you'll see that although the program owns all basic SOL accounts, it can only transfer SOL from an account when the transaction has been signed by the private key of the SOL account being debited. (As a matter of fact, even programs are owned by programs. Remember, they are stored in accounts and these `executable` accounts are owned by the BPF Loader. The only programs not owned by the BPF loader are - of course - the BPF loader itself and the System Program. They are owned by the NativeLoader and have special privileges such as allocating memory or marking accounts as executable) 

> In theory, programs have full autonomy over the accounts they own. It is up to the program's creator to limit this autonomy and up to the users of the program to verify the program's creator has really done so

We'll get to how a program can check whether a transaction has been signed and how a program becomes the owner of an account in a bit. Before we conclude the entrypoint section, there is one more thing to know.

> All accounts to be read or written to must be passed into the entrypoint function

This allows the runtime to parallelise transactions (among even more other things? I'm not sure here myself). If the runtime knows all the accounts that will be written to and read by everyone at all times it can run those transactions in parallel that do not touch the same accounts or touch the same accounts but only read and don't write. If a transaction violates this constraint and reads or writes to an account of which the runtime has not been notified, the transaction will fail.

Now, to finally conclude this section, create a new `entrypoint.rs` file next to `lib.rs` and move the `lib.rs` code there. Finally, register the entrypoint module inside `lib.rs`.

``` rust
// inside lib.rs, only the following line should be in here
pub mod entrypoint;
```

::: theory-recap
- each program is processed by its BPF Loader and has an entrypoint whose structure depends on which BPF Loader is used
- accounts are used to store state
- accounts are owned by programs
- only the account owner may debit an account and adjust its data
- all accounts to be written to or read must be passed into the entrypoint
:::

### instruction.rs Part 1, general code structure, and the beginning of the escrow program flow

#### code structure

Next, create a file `instruction.rs` next to the other two and register it inside `lib.rs` like you did with the entrypoint. To understand the new file's purpose, let's look at a common way to structure a program's code and the way
we will structure our program as well.


```
.
├─ src
│  ├─ lib.rs -> registering modules
│  ├─ entrypoint.rs -> entrypoint to the program
│  ├─ instruction.rs -> program API, (de)serializing instruction data
│  ├─ processor.rs -> program logic
│  ├─ state.rs -> program objects, (de)serializing state
│  ├─ error.rs -> program specific errors
├─ .gitignore
├─ Cargo.lock
├─ Cargo.toml
├─ Xargo.toml
```

The flow of a program using this structure looks like this:

1. Someone calls the entrypoint
2. The entrypoint forwards the arguments to the processor
3. The processor asks `instruction.rs` to decode the `instruction_data` argument from the entrypoint function.
4. Using the decoded data, the processor will now decide which processing function to use to process the request.
5. The processor may use `state.rs` to encode state into or decode the state of an account which has been passed into the entrypoint.

As you can see,

> instruction.rs defines the API of the program

While there is only one entrypoint, program execution can follow different paths depending on the given instruction data that is decoded inside `instruction.rs`.

#### beginning of the escrow program flow

Let's now look at the different execution paths our program may take by zooming out and sketching the program flow for our escrow program.

Remember we have two parties _Alice_ and _Bob_ which means there are two `system_program` accounts. Because _Alice_ and _Bob_ want to transfer tokens,
we'll make use of - you guessed it! - the `token program`. This program assigns each token its own account. Both _Alice_ and _Bob_ need an account for each token (which we'll call X and Y), so we get 4 more accounts. Since escrow creation and the trade won't happen inside a single transaction, it's probably a good idea to have another account to save some escrow data. Note that this account is created for each exchange. For now, our world looks like this:

![](../images/2020-12-24/2020-12-24-escrow-sketch-1.png)

Now there are two questions you might ask yourself. How will Alice and Bob transfer ownership of X and Y respectively to the escrow and how are their main accs connected to their token accs?
To find an answer to these questions, we must briefly jump into the `token program`.

### The token program Part 1

#### token ownership

The naive way one might connect Alice's main account to her token accounts is by not connecting them at all. Whenever she wanted transfer a token, she'd use the private key
of the token account. Clearly, this would not be sustainable if Alice owned many tokens because that would require her to keep a private key for each token account.

It would be much easier for Alice if she just had one private key for all her token accounts and this is exactly how the token program does it!
It assigns each token account an owner. Note that this token account owner attribute is **not** the same as the account owner. The account owner is an internal Solana attribute that will always be a program. This new token owner attribute is something the token program declares in user space. It's encoded inside a token account's `data`, in addition to other properties such as the balance of tokens the account holds. What this also means is that once a token account has been set up, its private key is useless, only its token owner attribute matters. And the token owner attribute is going to be some other address, in our case Alice's and Bob's main account respectively. When making a token transfer they simply have to sign the tx with the private key of their main account.

> All internal Solana internal account information are saved into [fields on the account](https://docs.rs/solana-program/1.5.0/solana_program/account_info/struct.AccountInfo.html#fields) but never into the `data` field which is solely meant for user space information

We can see all this when looking at a token account in the [explorer](https://explorer.solana.com/address/FpYU4M8oH9pfUqzpff44gsGso96MUKW1G1tBZ9Kxcb7d?cluster=mainnet-beta).

You've probably noticed the `mint` field in the explorer. This is how we know which token the token account belongs to. For each token there is 1 mint account that holds the token's metadata such as the supply. We'll need this field later to verify that the token accs Alice and Bob use really belong to asset X and Y and that neither party is sneaking in a wrong asset.

With all this in mind, we can create populate our world with more information:

![](../images/2020-12-24/2020-12-24-escrow-sketch-2.png)

Now we know how all those accounts are connected but we don't know yet how Alice can transfer tokens to the escrow. We'll cover this now.
#### transferring ownership

The only way to own units of a token is to own a token account that holds some token balance of the token referenced by the account's (user space) `mint` property. Hence, the escrow program will need an account to hold Alice's X tokens. One way of achieving this is to have Alice create a temporary X token account to which she transfers the X tokens she wants to trade. Then, using a function in the token program, she transfers (token-program) ownership of the temporary X token account to the escrow program. Let's add the temporary account to our escrow world. The image shows the escrow world _before_ Alice transfers token account ownership.

![](../images/2020-12-24/2020-12-24-escrow-sketch-3.png)

There is one more problem here. What exactly does Alice transfer ownership to? Enter [_Program Derived Addresses_](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses).

::: theory-recap
- developers should use the `data` field to save data inside accounts
- the token program owns token accounts which - inside their `data` field - hold [relevant information](https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/state.rs#L86)
- the token program also owns token mint accounts with [relevant data](https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/state.rs#L86)
- each token account holds a reference to their token mint account, thereby stating which token mint they belong to
- the token program allows the (user space) owner of a token account to transfer its ownership to another address
- All internal Solana internal account information are saved into [fields on the account](https://docs.rs/solana-program/1.5.0/solana_program/account_info/struct.AccountInfo.html#fields) but never into the data field which is solely meant for user space information
:::

### Program Derived Addresses (PDAs) Part 1

Transferring ownership to the account the program is stored at is a bad idea. The program's deployer might have the private key to that address and you don't want them to own your funds. The question is then, can programs be given user space ownership of a token account?

![](../images/2020-12-24/2020-12-24_no_but_yes.jpg)

The trick is to assign token account ownership to a _Program Derived Address_ of the escrow program. For now, it is enough for you to know this address exists and we can use it to let a program sign transactions or assign it user space ownership of accounts. We will cover PDAs in depth later but for now let's go back to coding!

### instruction.rs Part 2

We left off at `instruction.rs` with the knowledge that this file would define the API of the program but without having written any code yet. 
Let's start coding by adding an `InitEscrow` API endpoint.

``` rust
// inside instruction.rs
pub enum EscrowInstruction {

    /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 4. `[]` The token program
    InitEscrow {
        /// The amount party A expects to receive of token Y
        amount: u64
    }
}
```

Although `instruction.rs` does not touch accounts, it is helpful to define which accounts you expect here so all the required calling info is in one place and easy to find for others. Additionally, it's helpful to add required account properties inside brackets. Note that everything after the `///` is a comment an has no effect on the program, it's only there for documentation purposes. The `writable` property should remind you of the parallelisation I explained above. If the caller does not mark the account `writable` in their calling code but the program attempts to write to it, the transaction will fail.

Let me explain why the endpoint looks like it does:

```
0. `[signer]` The account of the person initializing the escrow
```
We need Account 0 and specifically Account 0 as a signer because transferring the ownership of the temporary account requires Alice's signature.
```
1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
```
Account 1 is the temp token X account which needs to be writable. This is because changing token account ownership is a user space change which means the `data` field of the account will be changed
```
2. `[]` The initializer's token account for the token they will receive should the trade go through
```
Account 2 is Alice's token Y account. While it will be written to eventually, it won't happen in this transaction which is why we can leave the brackets empty (implying read-only)
```
3. `[writable]` The escrow account, it will hold all necessary info about the trade.
```
Account 3 is the escrow account which also needs to be writable because the program will write the escrow information into it
```
4. `[]` The token program
```
Account 4 is the account of the token program itself. I will explain why we need this account when we get to writing the processor code
``` rust
InitEscrow {
    /// The amount party A expects to receive of token Y
    amount: u64
}
```
Finally, the program requires the amount of token Y that Alice wants to receive for her X tokens. This amount is not provided through an account but through the `instruction_data`.

`instruction.rs` is responsible for decoding `instruction_data` so that's that we'll do next.

``` rust{2-5,25-46}
// inside instruction.rs
use std::convert::TryInto;
use solana_program::program_error::ProgramError;

use crate::error::EscrowError::InvalidInstruction;

 pub enum EscrowInstruction {

    /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 4. `[]` The token program
    InitEscrow {
        /// The amount party A expects to receive of token Y
        amount: u64
    }
}

impl EscrowInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => Self::InitEscrow {
                amount: Self::unpack_amount(rest)?,
            },
            _ => return Err(InvalidInstruction.into()),
        })
    }

    fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
        let amount = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;
        Ok(amount)
    }
}
```

`unpack` expects a [reference](https://doc.rust-lang.org/stable/book/ch04-02-references-and-borrowing.html) to a slice of `u8`. It looks at the first byte to determine how to decode the rest of the slice. For now, we'll leave it at one instruction (ignoring the instruction where Bob takes the trade).

This won't compile because we are using an undefined error. Let's add that error next.

### error.rs

Create a new file `error.rs` next to the others and register it inside `lib.rs`. Then, add the following dependency to your `Cargo.toml`

``` toml {4}
...
[dependencies]
solana-program = "1.5.0"
thiserror = "1.0.21"
```

and the following code to `error.rs`.

``` rust
// inside error.rs
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum EscrowError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
}
```

What we are doing here is [defining an error type](https://doc.rust-lang.org/rust-by-example/error/multiple_error_types/define_error_type.html). Instead of having to write the `fmt::Display` implementation ourselves as is done in the example the link points to, we use the handy [thiserror](https://docs.rs/thiserror/1.0.22/thiserror/) library that does it for us using the `#[error("..")]` notation. This will become especially useful when we add more errors later on.

Looking back into `instruction.rs`, we can see that we are not quite done. The compiler is telling us it has no way of turning an EscrowError into a ProgramError. So let's implement a way.

``` rust{3,12-16}
use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum EscrowError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<EscrowError> for ProgramError {
    fn from(e: EscrowError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
```

### processor.rs Part 1, starting to process the InitEscrow instruction

#### pub fn process

After creating the entrypoint, an InitEscrow endpoint, and our first error, we can finally move on to code `processor.rs`. This is where the magic happens.
Start by creating `processor.rs` and registering it inside `lib.rs`. Then paste the following into `processor.rs`.

``` rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

use crate::instruction::EscrowInstruction;

pub struct Processor;
impl Processor {
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = EscrowInstruction::unpack(instruction_data)?;

        match instruction {
            EscrowInstruction::InitEscrow { amount } => {
                msg!("Instruction: InitEscrow");
                return Self::process_init_escrow(accounts, amount, program_id);
            }
        };
    }
}
```

Let's start unpacking what's happening. First, we pass the reference to the slice holding the `instruction_data` from `entrypoint.rs` into the `unpack` function we created earlier ([Note the `?` after the function call](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html?highlight=question,mark#a-shortcut-for-propagating-errors-the--operator)). We use `match` to figure out which processing function to call. Trivial, for now. `msg!` logs where we are going.

#### fn process_init_escrow


``` rust
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg,
    pubkey::Pubkey,
};
...
impl Processor {
    ...
    fn process_init_escrow(
        accounts: &[AccountInfo],
        amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;

        if !initializer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(())
    }
}
```

`process_init_escrow` is next. To be clear, `...` just means there is other stuff around the code you're seeing, don't copy those! Copy and replace your current `use solana_program...` with the one here or add the invididual missing pieces.

Inside `process_init_escrow` we first create an iterator of accounts. It needs to be mutable so we can take elements out of it. The first account we expect - as defined in `instruction.rs` - is the escrow's initializer, i.e. Alice's main account. She needs to be a signer which we check right away. It's just a boolean field on `AccountInfo`.

``` rust {14-19}
...
fn process_init_escrow(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let initializer = next_account_info(account_info_iter)?;

    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let temp_token_account = next_account_info(account_info_iter)?;

    let received_token_account = next_account_info(account_info_iter)?;
    if *received_token_account.owner != spl_token::id() {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}
...
```

Next, add the highlighted lines. The temporary token account needs to be writable but there is no need to explicitly check this. The transaction will fail automatically should Alice not mark the account as writable. You might ask yourself, "why do we check that the `received_token_account` is actually owned by the token program but don't do the same for the `temp_token_account`?". The answer is that later on in the function we will ask the token program to transfer ownership of the `temp_token_account` to the _PDA_. This transfer will fail if the `temp_token_account` is not owned by the token program, because - as I'm sure you remember - only programs that own accounts may change accounts. Hence, there is no need for us to add another check here.

We don't make any changes to the `received_token_account` though. We will just save it into the escrow data so that when Bob takes the trade, the escrow will know where to send asset Y. Thus, for this account, we should add a check. Note that nothing terrible would happen if we didn't. Instead of Alice's transaction failing because of our added check, Bob's would fail because the token program will attempt to send the Y tokens to Alice but not be the owner of the `received_token_account`. That said, it seems more reasonable to let the tx fail that actually led to the invalid state.

Finally, I'm sure you have noticed that we are using a crate here which we have not registered inside `Cargo.toml` yet. Let's do that now.
``` toml{4}
[dependencies]
solana-program = "1.5.0"
thiserror = "1.0.21"
spl-token = {version = "3.0.1", features = ["no-entrypoint"]}
```

We are using a slighly different way to import a dependency here than we did we the other dependencies. That's because we are importing another Solana program that has its own entrypoint. But our program should only have one entrypoint, the one we defined earlier. Luckily, the token program provides a switch to turn its entrypoint off with the help of a [cargo feature](https://doc.rust-lang.org/cargo/reference/features.html). We should define this feature in our program as well so others can import our program! I'll leave this to you with some hints: Check out the token program's `Cargo.toml` and its `lib.rs`. If you cannot or don't want to figure it out on your own, you can take a look into the escrow program I created.

Now back to `processor.rs`. Copy and replace the `solana_program` use statement and add more code to `process_init_escrow`:


``` rust {18-23}
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg,
    pubkey::Pubkey,
    program_pack::{Pack, IsInitialized}
};
//inside process_init_escrow
...
let temp_token_account = next_account_info(account_info_iter)?;

let received_token_account = next_account_info(account_info_iter)?;
if *received_token_account.owner != spl_token::id() {
    return Err(ProgramError::IncorrectProgramId);
}

let escrow_account = next_account_info(account_info_iter)?;

let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
if escrow_info.is_initialized() {
    return Err(ProgramError::AccountAlreadyInitialized);
}

Ok(())
...
```

Something unfamiliar is happening here. For the first time, we are accessing the `data` field. Because `data` is also just an array of `u8`, we need to deserialize it with `Escrow::unpack_unchecked`. This is a function inside `state.rs` which we'll create in the next section.

### state.rs

Create `state.rs` and register it inside `lib.rs`. The state file is responsible for 1) defining state objects that the processor can use 2) serializing and deserializing such objects from and into arrays of `u8` respectively.

Start by adding the following to `state.rs`.

``` rust
use solana_program::pubkey::Pubkey;

pub struct Escrow {
    pub is_initialized: bool,
    pub initializer_pubkey: Pubkey,
    pub initializer_temp_token_account_pubkey: Pubkey,
    pub initializer_receiving_token_account_pubkey: Pubkey,
    pub expected_amount: u64,
}
```

We need to save `initializer_temp_token_account_pubkey` so that when Bob takes the trade, the escrow program can send tokens from the account at `initializer_temp_token_account_pubkey` to Bob's account. We already know that Bob will have to pass in the account into his entrypoint call eventually so why do we save it here? First, if we save its public key here, Bob can easily find the address of the accounts he needs to pass into the entrypoint. Otherwise Alice would have to send him not only the escrow acount address but also all her account addresses. Secondly, and more important for security is that Bob could pass in a different token account. Nothing stops him from doing so if we don't add a check requiring him to pass in the account with `initializer_temp_token_account_pubkey` as its public key. And to add that check later in the processor, we need the InitEscrow instruction to save the `initializer_temp_token_account_pubkey`.

> When writing Solana programs, be mindful of the fact that any accounts may be passed into the entrypoint, including different ones than those defined in the API inside `instruction.rs`. It's the program's responsibility to check that `received accounts == expected accounts`

`initializer_receiving_token_account_pubkey` needs to be saved so that when Bob takes the trade, his tokens can be sent to that account. `expected_amount` will be used to check that Bob sends enough of his token. That leaves `initializer_pubkey` and `is_initialized`. I'll explain the latter now and the former later on.

We use `is_initialized` to determine whether a given escrow account is already in use. This, serialization, and deserialization are all standardized in the [traits](https://doc.rust-lang.org/book/ch10-02-traits.html) of the [`program pack` module](https://docs.rs/solana-program/1.5.0/solana_program/program_pack/index.html). First, implement `Sealed` and `IsInitialized`. 

``` rust
use solana_program::{
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};
...
impl Sealed for Escrow {}

impl IsInitialized for Escrow {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
```

`Sealed` is just Solana's version of Rust's `Sized` trait although there does not seem to be any difference between the two.
Now, `Pack`, which relies on `Sealed` and in our case also on `IsInitialized` being implemented. It's a big but simple blog of code. I'll split it into 2 parts. Let's start with the first one (you can copy and replace the `use` imports again):

``` rust
use solana_program::{
    program_pack::{IsInitialized, Pack, Sealed},
    program_error::ProgramError,
    pubkey::Pubkey,
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
...
impl Pack for Escrow {
    const LEN: usize = 105;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, Escrow::LEN];
        let (
            is_initialized,
            initializer_pubkey,
            initializer_temp_token_account_pubkey,
            initializer_receiving_token_account_pubkey,
            expected_amount,
        ) = array_refs![src, 1, 32, 32, 32, 8];
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        Ok(Escrow {
            is_initialized,
            initializer_pubkey: Pubkey::new_from_array(*initializer_pubkey),
            initializer_temp_token_account_pubkey: Pubkey::new_from_array(*initializer_temp_token_account_pubkey),
            initializer_receiving_token_account_pubkey: Pubkey::new_from_array(*initializer_receiving_token_account_pubkey),
            expected_amount: u64::from_le_bytes(*expected_amount),
        })
    }
}
```

The first requirement for something implementing `Pack` is defining `LEN` which is the size of our type. Looking at our Escrow struct, we can see calculate the length of the struct by adding the sizes of the individual data types: `1 (bool) + 3 * 32 (Pubkey) + 1 * 8 (u64) = 105`.  It's okay to use an entire `u8` for the bool since it'll make our coding easier and the cost of those extra wasted bits is infinitesimal.

After defining the escrow's length, we implement `unpack_from_slice` which turns an array of `u8` into an instance of the Escrow struct we defined above. Nothing too interesting happens here. Notable here is the use of [arrayref](https://docs.rs/arrayref/0.3.6/arrayref/), a library for getting references to sections of a slice. The docs should be enough to understand the (just 4) different functions from the library. Make sure to add the library to `Cargo.toml`.

``` toml
...
[dependencies]
...
arrayref = "0.3.6"
...
```

We can now deserialize state, serialization is next.

``` rust
...
impl Pack for Escrow {
    ...
    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, Escrow::LEN];
        let (
            is_initialized_dst,
            initializer_pubkey_dst,
            initializer_temp_token_account_pubkey_dst,
            initializer_receiving_token_account_pubkey_dst,
            expected_amount_dst,
        ) = mut_array_refs![dst, 1, 32, 32, 32, 8];

        let Escrow {
            is_initialized,
            initializer_pubkey,
            initializer_temp_token_account_pubkey,
            initializer_receiving_token_account_pubkey,
            expected_amount,
        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        initializer_pubkey_dst.copy_from_slice(initializer_pubkey.as_ref());
        initializer_temp_token_account_pubkey_dst.copy_from_slice(initializer_temp_token_account_pubkey.as_ref());
        initializer_receiving_token_account_pubkey_dst.copy_from_slice(initializer_receiving_token_account_pubkey.as_ref());
        *expected_amount_dst = expected_amount.to_le_bytes();
    }
}
```

This is pretty much the same as the `unpack_from_slice` function, just vice versa! This time, we also pass in `&self`. We didn't have to do this inside `unpack_from_slice` because _there was no self_ yet. `unpack_from_slice` was a static constructor function returning a new instance of an escrow struct. When we `pack_into_slice`, we already have an instance of an Escrow struct and now serialize it into the given `dst` slice. And that's it for `state.rs`! But wait, if we look back into `processor.rs`, we call `unpack_unchecked`, a function we didn't define, so where is it coming from? The answer is that traits can have default functions that may be overridden but don't have to be.
[Look here](https://docs.rs/solana-program/1.5.0/src/solana_program/program_pack.rs.html#29-39) to find out about `Pack`'s default functions. 

With `state.rs` done, let's go back to the `processor.rs` and adjust one of our `use` statements.
 
From
``` rust
use crate::instruction::EscrowInstruction;
``` 
to 
``` rust
use crate::{instruction::EscrowInstruction, state::Escrow};
```

### Processor Part 2, PDAs Part 2, CPIs Part 1

Let's finish the `process_init_escrow` function by first adding the state serialization. We've already created the escrow struct instance and checked that it is indeed uninitialized. Time to populate the struct's fields!

``` rust {7-14}
// inside process_init_escrow
...
let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
if escrow_info.is_initialized() {
    return Err(ProgramError::AccountAlreadyInitialized);
}

escrow_info.is_initialized = true;
escrow_info.initializer_pubkey = *initializer.key;
escrow_info.sending_token_account_pubkey = *temp_token_account.key;
escrow_info.receiving_token_account_pubkey = *received_token_account.key;
escrow_info.expected_amount = amount;

Escrow::pack(escrow_info, &mut escrow_account.data.borrow_mut())?;
```

Pretty straightforward. `pack` is another default function which internally calls our `pack_into_slice` function. 

#### PDAs Part 2

There's one thing left to do inside `process_init_escrow`: transferring (user space) ownership of the temporary token account to the PDA. This is a good time to explain what PDAs actually are and why we might need the `program_id` inside a process function. Copy and look at the higlighted line:

``` rust {5}
// inside process_init_escrow
...
escrow_info.expected_amount = amount;
Escrow::pack(escrow_info, &mut escrow_account.data.borrow_mut())?;
let (pda, _nonce) = Pubkey::find_program_address(&[b"escrow"], program_id);
```


We create a PDA by passing in an array of seeds and the `program_id` into the `find_program_address` function. We get back a new `pda` and `nonce` with a 1/(2^255) chance the function fails ([2^255 is a BIG number](https://youtu.be/S9JGmA5_unY)). In our case the seeds can be static. There are cases such as in the [Associated Token Account program](https://github.com/solana-labs/solana-program-library/blob/596700b6b100902cde33db0f65ca123a6333fa58/associated-token-account/program/src/lib.rs#L24) where they aren't (cause different users should own different associated token accounts). We just need `1` PDA that can own `N` temporary token accounts for different escrows occuring at any and possibly the same point in time.

Ok, but what _is_ a PDA? Normally, Solana key pairs use the [`ed25519`](http://ed25519.cr.yp.to/) standard. This means normal public keys lie on the `ed25519` elliptic curve. PDAs are public keys that are derived from the `program_id` and the seeds as well as _having been pushed off the curve by the nonce_. Hence,

> Program Derived Addresses do not lie on the `ed25519` curve and therefore have no private key associated with them.

They are just random array of bytes with the only defining feature being that they are _not_ on that curve. That said, they can still be used as normal addresses most of the time. You should absolutely read the two different docs on PDAs ([here](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses) and [here(find_program_address calls this function)](https://docs.rs/solana-program/1.5.0/src/solana_program/pubkey.rs.html#114)). We don't use the nonce here yet (also indicated by the underscore before the variable name). We will do that when we look into how it's possible to sign messages with PDAs even without a private key in PDAs Part 3 inside Bob's transaction.

#### CPIs Part 1

For now, let's look at how we can transfer the (user space) ownership of the temporary token account to the PDA. To do this, we will call the token program from our escrow program. This is called a [_Cross-Program Invocation_](https://docs.solana.com/developing/programming-model/calling-between-programs#cross-program-invocations) and executed using either the `invoke` or the `invoke_signed` function. Here we use `invoke`. In Bob's transaction we will use `invoke_signed`. The difference will become clear then. `invoke` takes two arguments: an instruction and an array of accounts.

``` rust
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    program::invoke
};
/// inside process_init_escrow
...
let token_program = next_account_info(account_info_iter)?;
let owner_change_ix = spl_token::instruction::set_authority(
    token_program.key,
    temp_token_account.key,
    Some(&pda),
    spl_token::instruction::AuthorityType::AccountOwner,
    initializer.key,
    &[&initializer.key],
)?;

msg!("Calling the token program to transfer token account ownership...");
invoke(
    &owner_change_ix,
    &[
        temp_token_account.clone(),
        initializer.clone(),
        token_program.clone(),
    ],
)?;

Ok(())
// end of process_init_escrow
```

Copy and replace the `solana_program` use statement. We continue with `process_init_escrow` by getting the token_program account. It's a rule that the program being called through a CPI must be included as an account in the 2nd argument of `invoke` (and `invoke_signed`). Next, we create the instruction. This is just the instruction that the token program would expect were we executing a normal call. The token program defines some helper functions inside its `instruction.rs` that we can make use of. Of particular interest to us is the `set_token_authority` function which is a builder function to create such an instruction. We pass in the token program id, then the account whose authority we'd like to change, the account that's the new authority (in our case the PDA), the type of authority change (there are different authority types for token accounts, we care about changing the owner), the current account owner (Alice -> initializer.key), and finally the public keys signing the CPI.

The concept that is being used here is [_Signature Extension_](https://docs.solana.com/developing/programming-model/calling-between-programs#instructions-that-require-privileges). In short,

> When including a `signed` account in a program call, in all CPIs including that account made by that program inside the current instruction, the account will also be `signed`, i.e. the _signature is extended_ to the CPIs.

In our case this means that because Alice signed the `InitEscrow` transaction, the program can make the token program `set_authority` CPI and include her pubkey as a signer pubkey. This is necessary because changing a token account's owner should of course require the approval of the current owner.

Next to the instruction, we also need to pass in the accounts that are required by the instruction, in addition to the account of the program we are calling. You can look these up by going to the token programs `instruction.rs` and finding the setAuthority Enum whose comments will tell you which accounts are required (in our case, the current Owner's account and the account whose owner is to be changed).

Finally, adjust `entrypoint.rs` so it looks like this:
``` rust
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey
};

use crate::processor::Processor;

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Processor::process(program_id, accounts, instruction_data)
}
```

::: theory-recap
- Program Derived Addresses do not lie on the `ed25519` curve and therefore have no private key associated with them.
- When including a `signed` account in a program call, in all CPIs including that account made by that program inside the current instruction, the account will also be `signed`, i.e. the _signature is extended_ to the CPIs.
:::

### Trying out the program, understanding Alice's transaction

Because we've built a part of the program that is complete in itself, we can now try it out! In doing so, we can acquire more knowledge about Solana, e.g. where do accounts come from?

You can use this UI to try out your program. I explain how it works and what you need to do to make it work below. Feel free to build your own!

<Escrow/>


#### Deploying your program on devnet
First, use the `cargo build-bpf` command to compile your program to a file with the `so` file extension. You should also create a personal account using the solana dev tools and airdrop some SOL into it _on devnet_. Then, use the `solana deploy` command to deploy the program to devnet. The Path will be printed by `cargo build-bpf`.

``` shell
solana deploy --url https://devnet.solana.com PATH_TO_YOUR_PROGRAM
```

The `deploy` command should print the program id which you can now paste into the UI above.

#### Creating a throwaway private key

My UI requires a private key (NEVER DO THIS IN A REAL APP). An easy way to create a private key is to open an _incognito mode_ browser window and then to go to [sollet.io](https://www.sollet.io). Because we are in _incognito mode_, we can create a new wallet even if we had one in sollet already.

After creating the wallet, airdrop yourself some SOL to pay for the tx fees. Then, click on `export` to export your Base58 encoded private key and paste it above.

Use your throwaway wallet for the next steps as well. It will represent Alice.

#### Creating tokens for testing on devnet

You'll also need a token to put into the escrow so head over to the [SPL Token UI](https://www.spl-token-ui.com).

During the next steps, you will create 2 tokens X and Y and 2 token accounts, Alice's X and Alice's Y account. After each step, copy the account address and put it into the appropriate UI field. You could also write them down somewhere else so can reuse them when eventually testing the entire escrow, including Bob's transaction.

Start by heading over to `Create new token` inside the `Tokens` tab. Fill out the mint authority with your sollet pubkey and create the new token. Keep in mind, this is the _token mint account_ for token X, i.e. the account that holds all the metadata of the token e.g. its supply and who is allowed to mint it (if you set the mint authority correctly, that should be your sollet pubkey! You can verify this in the explorer).

Next, go to `Create account` inside the `Accounts` tab and fill in the address of the token you just created and use your sollet pubkey as the account owner. Create an account (doesn't matter whether it's associated or not). This is Alice's token X token account.

Then, go to `Edit account` inside the `Accounts` tab. The `mint` option is selected by default. Put in Alice's token X token account (the one you just created) as the destination account and some number in the amount field. Click `Mint to account`.

Go through the same steps for token Y. You don't have to mint tokens to Alice's token Y account.

#### Creating the escrow

With all the steps completed, all that is left to do is to fill in Alice's expected amount and the amount she wants to put into the escrow. Fill in both numbers (the 2nd needs to be lower than what you minted to Alice's account) and hit `Init Escrow`.

#### Understanding what just happened, Rent, and Commitment

<div style="margin-top: 1.5rem">
    <Slideshow :images="[
        '/images/escrow-alice-initial.jpg',
        '/images/escrow-alice-ix1.jpg',
        '/images/escrow-alice-ix2-1.jpg',
        '/images/escrow-alice-ix2-2.jpg',
        '/images/escrow-alice-ix3.jpg',
        '/images/escrow-alice-ix4.jpg',
        '/images/escrow-alice-ix5-1.jpg',
        '/images/escrow-alice-ix5-2.jpg',
        '/images/escrow-alice-end.jpg'
    ]"/>
</div>

I've created a little slideshow to show the life of the transaction that Alice sends off. As you can see in the top right corner,

> there can be several _instructions_ (ix) inside one _transaction_ (tx) in Solana. These instructions are executed out _synchronously_ and the tx as a whole is executed _atomically_

This means that if a single instruction fails, the entire transaction fails. Right in ix1, we can see how accounts come to life.

> The system program is responsible for allocating account space and assigning (internal - not user space) account ownership

Alice's transaction consists of 5 instructions.

```
1. create empty account owned by token program
2. initialize empty account as Alice's X token account
3. transfer X tokens from Alice's main X token account to her temporary X token account
4. create empty account owned by escrow program
5. initialize empty account as escrow state and transfer temporary X token account ownership to PDA
```

As you can see,

> instructions may depend on previous instructions inside the same transaction

I'll now walk you through the important parts of the frontend code which uses the Solana js/ts libraries. Feel free to look at [the code](https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts) yourself. 

``` ts
const tempTokenAccount = new Account();
const createTempTokenAccountIx = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
    lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip'),
    fromPubkey: feePayerAcc.publicKey,
    newAccountPubkey: tempTokenAccount.publicKey
});
```

The first instruction that is created is to create the new X token account that will be transferred to the PDA eventually. Note that it's just built here,
nothing is sent yet. The function requires the user to specify which program the new account should belong to (`programId`), how much space it should have (`space`), what the initial balance should be (`lamports`), where to transfer that balance from (`fromPubkey`) and the address of the new account (`newAccountPubkey`). It's pretty straightforward except for line 5 where we meet a new Solana term: [Rent](https://docs.solana.com/implemented-proposals/rent).

> Rent is deducted from accounts according to their space requirements regularly. An account can, however, be made rent-exempt if its balance is higher than some threshold that depends on the space it's consuming

`connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip')` finds exactly this threshold for the size of a token account (`=AccountLayout.span`).

What about the `'singleGossip'` argument? `singleGossip` is one of the available [_Commitments_](https://solana-labs.github.io/solana-web3.js/typedef/index.html#static-typedef-Commitment) and tells us how to query the network. Which commitment level to pick depends on your use case. If you're moving millions and want to be as sure as possible that your tx cannot be rolled back, choose `max`. `singleGossip` is still pretty safe because of [optimistic confirmation and slashing](https://docs.solana.com/proposals/optimistic-confirmation-and-slashing).

```ts
const initTempAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, XTokenMintAccountPubkey, tempTokenAccount.publicKey, feePayerAcc.publicKey);
const transferXTokensToTempAccIx = Token
    .createTransferInstruction(TOKEN_PROGRAM_ID, initializerXTokenAccountPubkey, tempTokenAccount.publicKey, feePayerAcc.publicKey, [], amountXTokensToSendToEscrow);
```

After building the ix for creating the new account, we call two functions provided by the [spl-token js library](https://www.npmjs.com/package/@solana/spl-token) to create the next two instructions. Nothing new here. Then, instruction 4 is creating another account, this time owned by the escrow program but still very similar to the first ix.

```ts
const initEscrowIx = new TransactionInstruction({
    programId: escrowProgramId,
    keys: [
        { pubkey: feePayerAcc.publicKey, isSigner: true, isWritable: false },
        { pubkey: tempTokenAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(initializerReceivingTokenAccountPubkeyString), isSigner: false, isWritable: false },
        { pubkey: escrowAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ],
    data: Buffer.from(Uint8Array.of(0, ...new BN(expectedAmount).toArray("le", 8)))
})
```

The 5th and final ix - where we initiate the escrow - is more interesting since here we get almost no help from the Solana libraries. We manually create the instruction by calling its constructor (`new TransactionInstruction...`). The required format should feel familiar! It's exactly what our program entrypoint expects. We pass in the programId of our escrow program and then the keys. Here, we specify whether a given account will sign the tx - if it then doesn't the tx will fail - and whether an account is read-only - if it's then written to the tx will fail. Finally, we specify what will arrive at the entrypoint as `instruction_data`. We start with a `0` since the first byte is what we used in `instruction.rs` as a `tag` to determine how to decode the instruction. `0` means `InitEscrow`. The next bytes will be the `expected_amount`. We use the `bn.js` library to write our expected amount as an 8-byte array of little-endian numbers. 8 bytes because inside `instruction.rs` we decode a `u64` and little-endian because we decode it the slice with `u64::from_le_bytes`. We use a `u64` because that's the [max supply of a token](https://github.com/solana-labs/solana-program-library/blob/123a3dc1e43dbc6c90c503b2c27a0d9b264e9ede/token/program/src/state.rs#L22).

```ts
const tx = new Transaction()
        .add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
await connection.sendTransaction(tx, [feePayerAcc, tempTokenAccount, escrowAccount]);
```

Finally, we create a new Transaction and add all the instructions. Then, we send off the tx with its signers. In the js library world, an `Account` has a double meaning and is also used as the object to hold a keypair. That means the signers we pass in include the private keys and can actually sign. Obviously, we have to add Alice's account as a signer - she pays the fees and needs to authorize transfers from her accounts. We also have to add the other two accounts because it turns out when the system program creates a new account, the tx needs to be signed by that account.

What we end up with after Alice's transaction is the last slide. There's a new esrow state account that holds relevant data to complete the trade as well as a new token account that is owned by a PDA of the escrow program. That token account's token balance is the amount of X tokens Alice would like to trade in for the expected amount (which is saved in the escrow state acount) of Y tokens.

An important note here is that while it's not important that all the instructions are in the same transaction, **it is important that at least ix 1,2 and ix 4,5 are in the same transaction**. This is because after an account has been created by the system program, it's kind of just floating on the blockchain, still uninitialized, with no user space owner. If, for example, you put ix 1 and 2 in different transactions, someone could try to send a tx between those two and initialize their own token account, using the then still ownerless account created by ix 1. This cannot happen if you put ix 1 and 2 in the same transaction since a tx is executed atomically.

::: theory-recap
<li>There can be several <i>instructions</i> (ix) inside one <i>transaction</i> (tx) in Solana. These instructions are executed out <i>synchronously</i> and the tx as a whole is executed <i>atomically</i></li>
<li>The system program is responsible for allocating account space and assigning (internal - not user space) account ownership</li>
<li>instructions may depend on previous instructions inside the same transaction</li>
<li>Rent is deducted from accounts according to their space requirements regularly. An account can, however, be made rent-exempt if its balance is higher than some threshold that depends on the space it's consuming</li>
<li>Commitment settings give downstream developers ways to query the network which differ in finality likelihood</li>
:::

#### Adapting the frontend for real life use

There are a couple of things that were left out - to keep things simple - but should definitely be added for a real program. First, the maximum token amount is U64_MAX which is higher than javascript's number value. Hence, you need to find a way to handle this, either by limiting the allowed amount of tokens that can be put in or by accepting the token amount as a string and then using a library like `bn.js` to convert the string. Secondly, you should never have your users put in a private key. Use an external wallet like `solong` or the `sol-wallet-adapter` library. You'd create the transaction, add the instructions, and then ask whatever trusted service you're using to sign the transaction and send it back to you. You can then add the other two keypair accounts and send off the tx to the network.

## Building the escrow program - Bob's Transaction
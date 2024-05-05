const { getNamedAccounts, ethers, network } = require('hardhat');
const { getWeth, AMOUNT } = require('./getWETH');
const { networkConfig } = require('../helper-hardhat-config');

const BORROW_MODE = 2; // Variable borrow mode. Stable was disabled.

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  // abi, address
  const lendingPool = await getLendingPool(deployer);
  console.log(`LendingPool address: ${lendingPool.address}`);

  // deposit!
  const wethTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  // approve
  await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
  console.log('Depositing...');
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log('Deposited!');
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // Borrow time!
  const daiETHPrice = await getDAIPrice();
  // How much we have borrowed, how much we have in collateral, how much we can borrow
  const amountDAI2Borrow =
    availableBorrowsETH.toString() * 0.95 * (1 / daiETHPrice.toNumber());
  console.log(`daiETHPrice.toNumber(): ${daiETHPrice.toNumber()}`);
  console.log(`You can borrow ${amountDAI2Borrow} DAI...`);
  const amountDAI2BorrowWei = ethers.utils.parseEther(
    amountDAI2Borrow.toString()
  );
  const daiTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
  await borrowDAI(daiTokenAddress, lendingPool, amountDAI2BorrowWei, deployer);
  await getBorrowUserData(lendingPool, deployer);
  await repay(amountDAI2BorrowWei, daiTokenAddress, lendingPool, deployer);
  await getBorrowUserData(lendingPool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveERC20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(
    amount,
    daiAddress,
    lendingPool,
    account
  );
  await repayTx.wait(1);
  console.log('Repaid!');
}

async function borrowDAI(
  daiAddress,
  lendingPool,
  amountDAI2BorrowWei,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDAI2BorrowWei,
    BORROW_MODE,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("You've borrowed!");
}

async function getDAIPrice() {
  console.log(`networkConfig: ${JSON.stringify(networkConfig)}`);
  const daiETHPriceFeed = await ethers.getContractAt(
    'AggregatorV3Interface',
    '0x773616E4d11A78F511299002da57A0a94577F1f4'
    // networkConfig[network.config.chainId].daiEthPriceFeed
  );
  const price = (await daiETHPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} worth of ETH wei deposited.`);
  console.log(`You have ${totalDebtETH} worth of ETH wei borrowed.`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH wei.`);
  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool(account) {
  // https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts ↓
  // Lending Pool Addresses Provider: 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    'ILendingPoolAddressesProvider',
    '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
    account
  );
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    'ILendingPool',
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

async function approveERC20(
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt(
    'IERC20',
    erc20Address,
    account
  );
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log('ERC20 Approved!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

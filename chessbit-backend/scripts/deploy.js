// scripts/deploy.js

async function main() {
  const [deployer, account1, account2] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the ChessBitToken contract
  const Token = await ethers.getContractFactory("ChessBitToken");
  const initialSupply = ethers.utils.parseUnits("1000000", 18); // 1 million tokens
  const token = await Token.deploy(initialSupply);
  await token.deployed();
  console.log("ChessBitToken deployed to:", token.address);

  // Deploy the GameContract
  const GameContract = await ethers.getContractFactory("GameContract");
  const gameContract = await GameContract.deploy(token.address);
  await gameContract.deployed();
  console.log("GameContract deployed to:", gameContract.address);

  // Transfer tokens to other accounts
  const transferAmount = ethers.utils.parseUnits("10000", 18); // 10,000 tokens

  // Transfer to account1
  await token.transfer(account1.address, transferAmount);
  console.log(`Transferred ${ethers.utils.formatUnits(transferAmount, 18)} tokens to ${account1.address}`);

  // Transfer to account2
  await token.transfer(account2.address, transferAmount);
  console.log(`Transferred ${ethers.utils.formatUnits(transferAmount, 18)} tokens to ${account2.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error deploying contracts:", error);
      process.exit(1);
  });
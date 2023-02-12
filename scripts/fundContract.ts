const { ethers, network } = require("hardhat");

import deploy from "./../deploy/artifacts/deploy.json";

async function main() {
  console.info("funding started ...");
  // setting remote for current network, we can create task for it
  const nftAddress = deploy[network.name];
  const [signer] = await ethers.getSigners();

  const tx = await signer.sendTransaction({
    to: nftAddress,
    value: await ethers.utils.parseEther("0.025"),
  });
  console.log("Tx: tx went with hash: ", tx.hash);
  await tx.wait();
  console.log("Tx: tx went successfull");
}

main()
  .then(() => console.info("Funded !!"))
  .catch(console.error);

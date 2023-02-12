const { ethers, upgrades, network } = require("hardhat");

import { abi, bytecode } from "../artifacts/contracts/nft.sol/NFT.json";

import config from "./../constants/config";
import deploy from "./../deploy/artifacts/deploy.json";

async function main() {
  console.info("setting fee token and approving Started ...");

  const nftAddress = deploy[network.name];
  const [signer] = await ethers.getSigners();
  const nftContract = await ethers.getContractAt(abi, nftAddress, signer);

  // set setFeesToken
  console.log("Setting fee token ...");
  const _token = config[network.name].wNativeToken;
  let tx = await nftContract.setFeesToken(_token);
  console.log("setFeesToken: tx went with tx hash as ", tx.hash);
  await tx.wait();
  console.log("setFeesToken: tx went successfull");

  // set _approveFees
  console.log("approving fee ...");
  const feeToken = config[network.name].wNativeToken;
  const _amount = await ethers.BigNumber.from("1000000000000000000000000");
  tx = await nftContract._approveFees(feeToken, _amount);
  console.log("_approveFees: tx went with tx hash as ", tx.hash);
  await tx.wait();
  console.log("_approveFees: tx went successfull");
}

main()
  .then(() => console.info("Deploy complete !!"))
  .catch(console.error);

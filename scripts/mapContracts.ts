const { ethers, network } = require("hardhat");

import config from "../constants/config";

import deploy from "./../deploy/artifacts/deploy.json";

import { abi as handlerABI } from "../artifacts/@routerprotocol/router-crosstalk/contracts/interfaces/iGenericHandler.sol/iGenericHandler.json";

async function main() {
  console.info("Contract Mapping started...");

  // hard coding for fuji and goerli here
  let remoteChain: string;
  if (network.name == "fuji") remoteChain = "goerli";
  else remoteChain = "fuji";

  const _handlerAddress = config[network.name]._handlerAddress;
  const handlerContract = await ethers.getContractAt(
    handlerABI,
    _handlerAddress
  );

  const remoteChainId = config[remoteChain].internalChainId;
  const remoteChainContractAddress = deploy[remoteChain];
  const sourceChainContractAddress = deploy[network.name];

  const tx = await handlerContract.MapContract([
    sourceChainContractAddress, // contract address of src chain
    remoteChainId, // remote chain id
    remoteChainContractAddress, // contract address of remote
  ]);

  console.log("Contract Mapping: tx sent with tx hash ", tx.hash);
  await tx.wait();
  console.log(
    "Contract Mapping: Added remote to  ",
    network.name,
    " to ",
    remoteChain
  );
}

main()
  .then(() => console.info("Enrollmented completed !!"))
  .catch(console.error);

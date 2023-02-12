const { ethers, upgrades, network } = require("hardhat");
import { readFile, writeFile } from "node:fs/promises";
import { access, constants, mkdir } from "node:fs";

import config from "./../constants/config";

const isFileExist = (path: string) => {
  return new Promise((resolve, reject) => {
    access(path, constants.F_OK, (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  });
};

async function main() {
  const [signer] = await ethers.getSigners();

  console.info("Deployment Started ...");

  const NFT = await ethers.getContractFactory("NFT");
  const _handlerAddress = config[network.name]._handlerAddress;
  const _destGasLimit = 1000000;
  const _srcChainId = config[network.name].internalChainId;

  const nftProxy = await upgrades.deployProxy(NFT, [
    _handlerAddress,
    _srcChainId,
  ]);
  await nftProxy.deployed();
  console.log("NFT contract deployed to ", nftProxy.address);

  // setting gas limit
  console.log("Setting dst gas limit ...");
  let tx = await nftProxy.setCrossChainGasLimit(_destGasLimit);
  console.log("setCrossChainGasLimit: tx went with tx hash as ", tx.hash);
  await tx.wait();
  console.log("setCrossChainGasLimit: tx went successfull");

  // set linker
  console.log("Setting linker ...");
  tx = await nftProxy.setLinker(signer.address);
  console.log("setLinker: tx went with tx hash as ", tx.hash);
  await tx.wait();
  console.log("setLinker: tx went successfull");

  const path = `${__dirname}/artifacts`;

  if (!(await isFileExist(`${path}`))) {
    await new Promise((resolve, reject) => {
      mkdir(path, { recursive: true }, (err) => {
        if (err) return reject("erro while creating dir");
        resolve("created");
      });
    });
  }

  if (!(await isFileExist(`${path}/deploy.json`))) {
    await writeFile(`${path}/deploy.json`, "{}");
  }

  const prevDetails = await readFile(`${path}/deploy.json`, {
    encoding: "utf8",
  });

  const prevDetailsJson: { [network: string]: string } = await JSON.parse(
    prevDetails
  );
  let newDeployData = { ...prevDetailsJson, [network.name]: nftProxy.address };
  await writeFile(`${path}/deploy.json`, JSON.stringify(newDeployData));
  console.log("Deploy file updated successfully!");
}

main()
  .then(() => console.info("Deploy complete !!"))
  .catch(console.error);

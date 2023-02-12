import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "console";

import deploy from "./../deploy/artifacts/deploy.json";

const { ethers } = require("hardhat");

import { abi, bytecode } from "./../artifacts/contracts/nft.sol/NFT.json";

import config from "../constants/config";

async function main() {
  const localChain = "goerli";
  const remoteChain = "fuji";
  const jsonURLLocalChain =
    "https://goerli.infura.io/v3/f4d139222fce4c03963c4145d0a30260";
  const jsonURLRemoteChain = "https://api.avax-test.network/ext/bc/C/rpc";
  const localChainId = config[localChain].internalChainId;
  const remoteChainId = config[remoteChain].internalChainId;

  let signerOrigin: SignerWithAddress;
  let signerRemote: SignerWithAddress;

  let remoteChainProvider;
  let localChainProvider;

  let nftSrcContract: any;
  let nftDstContract: any;

  let signer: SignerWithAddress;

  let tx;
  let nftOwner;
  let txReceipt;
  let tokenId;

  const setup = async () => {
    signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    localChainProvider = new ethers.providers.JsonRpcProvider(
      jsonURLLocalChain
    );
    remoteChainProvider = new ethers.providers.JsonRpcProvider(
      jsonURLRemoteChain
    );

    signerOrigin = signer.connect(localChainProvider);
    signerRemote = signer.connect(remoteChainProvider);

    nftSrcContract = await ethers.getContractAt(
      abi,
      deploy[localChain],
      signerOrigin
    );

    nftDstContract = await ethers.getContractAt(
      abi,
      deploy[remoteChain],
      signerRemote
    );
  };

  const testNFTFLOW = async () => {
    tx = await nftSrcContract
      .connect(signerOrigin)
      .safeMint(signerOrigin.address, "URI", {
        value: 1,
        // gasPrice: await localChainProvider.getGasPrice(),
      });
    console.log("mint tx sent successfully with tx hash: ", tx.hash);
    txReceipt = await tx.wait();
    // before sending
    tokenId = parseInt(txReceipt.logs[0].data, 10);
    // tokenId = 0;
    console.log("SRC Chain: NFT minted with tokenId ", tokenId);
    nftOwner = await nftSrcContract.connect(signerOrigin).ownerOf(tokenId); // should be equal to signerOrigin.address
    assert(
      nftOwner == signerOrigin.address,
      "srcchain: minted to someone else"
    );

    const destGasPrice = await remoteChainProvider.getGasPrice();
    tx = await nftSrcContract
      .connect(signerOrigin)
      .transferNFTCrossChain(
        remoteChainId,
        destGasPrice,
        signerOrigin.address,
        tokenId,
        {
          value: 1, // already funded
          gasPrice: await localChainProvider.getGasPrice(),
        }
      );
    console.log("nft transfer: tx sent successfully with tx hash: ", tx.hash);
    txReceipt = await tx.wait();
    console.log(
      "SRC chain: nft transfer went successfull on src chain, let's wait for message to be delivered to dst chain"
    );
    nftOwner = await nftDstContract.ownerOf(tokenId);
    assert(
      nftOwner == signerOrigin.address,
      "srcchain: minted to someone else"
    );
  };

  setup()
    .then(async () => {
      console.log("Setup completed !!");
      await testNFTFLOW();
    })
    .catch(console.log);
}

main()
  .then(() => console.info("Test completed cross chain !!"))
  .catch(console.error);

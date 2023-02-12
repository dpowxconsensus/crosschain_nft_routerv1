import { expect } from "chai";
import { ethers, upgrades, network } from "hardhat";

describe("NFT", function () {
  const localRPC = "http://localhost:8545";
  const localMnemonic =
    "coyote news rib observe almost hub mimic scissors guitar order increase angry";

  const remoteRPC = "http://localhost:8575";
  const remoteMnemonic =
    "inherit bone warfare differ proof kind what wool install kite act renew";

  let remoteProvider;
  let localProvider;
  let localSigner;
  let remoteSigner;

  let localValidator;
  let remoteValidator;

  let localGateway;
  let remoteGateway;

  let localNFTProxy;
  let remoteNFTProxy;

  const _dstGastLimit = 1000000;
  const gasLimit = 1000000;
  const LOCAL_CHAIN_ID: string = "1";
  const REMOTE_CHAIN_ID: string = "2";

  const CHAIN_TYPE: number = 1;
  const POWERS = [4294967295];
  const VALSET_NONCE: number = 1;
  const ROUTER_BRIDGE_ADDRESS =
    "router10emt4hxmeyr8mjxayyt8huelzd7fpntmly8vus5puelqde6kn8xqcqa30g";
  const RELAYER_ROUTER_ADDRESS =
    "router1hrpna9v7vs3stzyd4z3xf00676kf78zpe2u5ksvljswn2vnjp3ys8kpdc7";

  // function getProxyFactory(signer) {
  //   return ethers.getContractFactory(
  //     ERC1967Proxy.abi,
  //     ERC1967Proxy.bytecode,
  //     signer
  //   );
  // }

  // const deployProxy = async (signer) => {
  //   const ProxyFactory = await getProxyFactory(signer);
  //   const proxyDeployment = Object.assign(
  //     { kind },
  //     await deploy(ProxyFactory, impl, data)
  //   );
  // };

  before(async () => {
    const [signer] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    localNFTProxy = await upgrades.deployProxy(NFT, [signer.address, 9]);
    await localNFTProxy.deployed();
    console.log(localNFTProxy.functions);

    // remoteNFTProxy = await upgrades.deployProxy(
    //   await NFT.connect(remoteSigner),
    //   [remoteGateway.address, _dstGastLimit, remoteSigner],
    //   {
    //     timeout: 100000000000,

    //     pollingInterval: 10000,
    //     useDeployedImplementation: false,
    //   }
    // );
    // await remoteNFTProxy.deployed();

    // console.log({
    //   con: localNFTProxy.provider.connection,
    //   add: localNFTProxy.address,
    //   t: "local",
    // });

    // console.log({
    //   con: remoteNFTProxy.provider.connection,
    //   add: remoteNFTProxy.address,
    //   t: "remote",
    // });

    // enroll remote
  });
  beforeEach(async function () {});

  it("gateway Setup and nft deployment to chains", () => {});

  it("Cross Chain NFT Transfer", async function () {
    return;
    // mint nft on local chain
    await localNFTProxy
      .connect(localSigner)
      .safeMint(localSigner.address, "URI", {
        value: 1, // 1wei
        gasLimit,
      });

    expect(await localNFTProxy.ownerOf(0)).to.be.equal(localSigner.address);

    const expiryDurationInSeconds = 0; // for infinity
    const destGasPrice = await remoteProvider.getGasPrice();
    const tx = await localNFTProxy
      .connect(localSigner)
      .transferNFTCrossChain(
        CHAIN_TYPE,
        REMOTE_CHAIN_ID,
        expiryDurationInSeconds,
        destGasPrice,
        localSigner.address,
        0,
        {
          gasPrice: await localProvider.getGasPrice(),
          gasLimit,
        }
      );

    // const ok = await tx.wait();
    // console.log(ok);
  });
});

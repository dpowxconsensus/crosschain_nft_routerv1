// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@routerprotocol/router-crosstalk/contracts/RouterCrossTalkUpgradeable.sol";

contract NFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    RouterCrossTalkUpgradeable
{
    event SendNFTCrossChain(
        address from,
        address to,
        uint8 dstId,
        uint256 tokenId
    );

    event NFTReceivedFromChain(
        address from,
        address to,
        uint8 _srcChainId,
        uint256 tokenId
    );

    uint256 _crossChainGasLimit;
    uint8 _srcChainId;

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    function initialize(address _handler, uint8 srcChainId) public initializer {
        _srcChainId = srcChainId;
        __RouterCrossTalkUpgradeable_init(_handler);
        __ERC721_init("NFT", "SNFT");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _safeMint(address to, string memory uri) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function safeMint(address to, string memory uri) public payable {
        require(msg.value >= 1 wei, "1 wei required to mint");

        _safeMint(to, uri);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // The following functions are overrides required by Solidity.

    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC165Upgradeable, IERC165Upgradeable, ERC721Upgradeable)
        returns (bool)
    {
        //    interfaceId == type(IERC721Upgradeable).interfaceId ||
        //     interfaceId == type(IERC721MetadataUpgradeable).interfaceId ||
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice setLinker Used to set address of linker, this can only be set by Admin
     * @param _linker Address of the linker
     */
    function setLinker(address _linker) external onlyOwner {
        setLink(_linker);
    }

    /**
     * @notice _approveFees To approve handler to deduct fees from source contract, this can only be set by Admin
     * @param _feeToken Address of the feeToken
     * @param _amount Amount to be approved
     */
    function _approveFees(
        address _feeToken,
        uint256 _amount
    ) external onlyOwner {
        approveFees(_feeToken, _amount);
    }

    /**
     * @notice setFeesToken To set the fee token in which fee is desired to be charged, this can only be set by Admin
     * @param _feeToken Address of the feeToken
     */
    function setFeesToken(address _feeToken) external onlyOwner {
        setFeeToken(_feeToken);
    }

    /**
     * @notice setCrossChainGasLimit Used to set CrossChainGasLimit, this can only be set by Admin
     * @param _gasLimit Amount of gasLimit that is to be set
     */
    function setCrossChainGasLimit(uint256 _gasLimit) external onlyOwner {
        _crossChainGasLimit = _gasLimit;
    }

    /**
     * @notice fetchCrossChainGasLimit Used to fetch CrossChainGasLimit
     * @return crossChainGasLimit that is set
     */
    function fetchCrossChainGasLimit() external view returns (uint256) {
        return _crossChainGasLimit;
    }

    // These gas limit and gas price should be higher than one entered in the original tx.
    function relpayTransaction(
        bytes32 hash,
        uint256 gasLimit,
        uint256 gasPrice
    ) external {
        routerReplay(hash, gasLimit, gasPrice);
    }

    function transferNFTCrossChain(
        uint8 _dstChainId,
        uint256 _crossChainGasPrice,
        address to,
        uint256 tokenId
    ) public payable {
        require(msg.value > 0, "pls send ether for gas fees");

        bytes memory payload = abi.encode(
            tokenId,
            tokenURI(tokenId),
            to,
            msg.sender
        );

        bytes memory _data = abi.encode(_srcChainId, address(this), payload);

        _burn(tokenId);
        bytes4 _selector = bytes4(
            keccak256("handleRequestFromSource(uint8,address,bytes)")
        );
        (bool success, ) = routerSend(
            _dstChainId,
            _selector,
            _data,
            _crossChainGasLimit,
            _crossChainGasPrice
        );

        require(success, "Unsuccessful");
        emit SendNFTCrossChain(msg.sender, to, _dstChainId, tokenId);
    }

    function _routerSyncHandler(
        bytes4 _selector,
        bytes memory _data
    ) internal virtual override returns (bool, bytes memory) {
        (uint8 srcChainId, address srcAddress, bytes memory payload) = abi
            .decode(_data, (uint8, address, bytes));
        (bool success, bytes memory returnData) = address(this).call(
            abi.encodeWithSelector(_selector, srcChainId, srcAddress, payload)
        );
        return (success, returnData);
    }

    // mint nft to receipent user
    function handleRequestFromSource(
        uint8 srcChainId,
        address srcAddress,
        bytes memory _payload
    ) external isSelf returns (bool) {
        (
            uint256 tokenId,
            string memory tokenUri,
            address to,
            address from
        ) = abi.decode(_payload, (uint256, string, address, address));

        _safeMint(to, tokenUri);
        emit NFTReceivedFromChain(from, to, srcChainId, tokenId);
        return true;
    }

    receive() external payable {}
}

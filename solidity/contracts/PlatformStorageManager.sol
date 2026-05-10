// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PlatformStorageManager is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;
    address public platformTreasury;
    uint256 public pricePerGb;
    uint16 public maxExtraStorageGb;
    uint64 public periodSeconds;
    bool public active;

    mapping(address author => uint256 paidUntil) public paidUntil;
    mapping(address author => uint16 extraStorageGb) public extraStorageGb;

    event StoragePlanUpdated(uint256 pricePerGb, uint16 maxExtraStorageGb, uint64 periodSeconds, bool active);
    event PlatformStoragePaid(address indexed author, uint16 extraStorageGb, uint256 amount, uint256 paidUntil);
    event PlatformTreasuryUpdated(address indexed platformTreasury);
    event PaymentTokenUpdated(address indexed paymentToken);

    error InvalidAddress();
    error InvalidPeriod();
    error InvalidStorageAmount();
    error StorageInactive();

    constructor(
        address initialOwner,
        address initialPlatformTreasury,
        address initialPaymentToken,
        uint256 initialPricePerGb,
        uint16 initialMaxExtraStorageGb,
        uint64 initialPeriodSeconds
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) || initialPlatformTreasury == address(0)
                || initialPaymentToken == address(0)
        ) {
            revert InvalidAddress();
        }
        if (initialPeriodSeconds == 0) {
            revert InvalidPeriod();
        }

        platformTreasury = initialPlatformTreasury;
        paymentToken = IERC20(initialPaymentToken);
        pricePerGb = initialPricePerGb;
        maxExtraStorageGb = initialMaxExtraStorageGb;
        periodSeconds = initialPeriodSeconds;
        active = true;
        emit StoragePlanUpdated(initialPricePerGb, initialMaxExtraStorageGb, initialPeriodSeconds, true);
    }

    function updateStoragePlan(uint256 nextPricePerGb, uint16 nextMaxExtraStorageGb, uint64 nextPeriodSeconds, bool nextActive)
        external
        onlyOwner
    {
        if (nextPeriodSeconds == 0) {
            revert InvalidPeriod();
        }

        pricePerGb = nextPricePerGb;
        maxExtraStorageGb = nextMaxExtraStorageGb;
        periodSeconds = nextPeriodSeconds;
        active = nextActive;
        emit StoragePlanUpdated(nextPricePerGb, nextMaxExtraStorageGb, nextPeriodSeconds, nextActive);
    }

    function subscribeStorage(uint16 selectedExtraStorageGb) external returns (uint256 nextPaidUntil) {
        if (!active) {
            revert StorageInactive();
        }
        if (selectedExtraStorageGb == 0 || selectedExtraStorageGb > maxExtraStorageGb) {
            revert InvalidStorageAmount();
        }

        uint256 amount = uint256(selectedExtraStorageGb) * pricePerGb;
        if (amount > 0) {
            paymentToken.safeTransferFrom(msg.sender, platformTreasury, amount);
        }

        uint256 currentPaidUntil = paidUntil[msg.sender];
        uint256 startsAt = currentPaidUntil > block.timestamp ? currentPaidUntil : block.timestamp;
        nextPaidUntil = startsAt + periodSeconds;
        paidUntil[msg.sender] = nextPaidUntil;
        extraStorageGb[msg.sender] = selectedExtraStorageGb;

        emit PlatformStoragePaid(msg.sender, selectedExtraStorageGb, amount, nextPaidUntil);
    }

    function setPlatformTreasury(address nextPlatformTreasury) external onlyOwner {
        if (nextPlatformTreasury == address(0)) {
            revert InvalidAddress();
        }

        platformTreasury = nextPlatformTreasury;
        emit PlatformTreasuryUpdated(nextPlatformTreasury);
    }

    function setPaymentToken(address nextPaymentToken) external onlyOwner {
        if (nextPaymentToken == address(0)) {
            revert InvalidAddress();
        }

        paymentToken = IERC20(nextPaymentToken);
        emit PaymentTokenUpdated(nextPaymentToken);
    }
}

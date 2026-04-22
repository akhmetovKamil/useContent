// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PlatformSubscriptionManager is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;
    address public platformTreasury;

    struct Tier {
        uint256 price;
        uint16 baseStorageGb;
        uint16 maxExtraStorageGb;
        uint256 pricePerExtraGb;
        uint64 periodSeconds;
        bool active;
    }

    mapping(bytes32 tierKey => Tier tier) public tiers;
    mapping(address author => mapping(bytes32 tierKey => uint256 paidUntil)) public paidUntil;

    event TierRegistered(
        bytes32 indexed tierKey,
        uint256 price,
        uint16 baseStorageGb,
        uint16 maxExtraStorageGb,
        uint256 pricePerExtraGb,
        uint64 periodSeconds
    );

    event TierUpdated(
        bytes32 indexed tierKey,
        uint256 price,
        uint16 baseStorageGb,
        uint16 maxExtraStorageGb,
        uint256 pricePerExtraGb,
        uint64 periodSeconds,
        bool active
    );

    event PlatformSubscriptionPaid(
        address indexed author,
        bytes32 indexed tierKey,
        uint16 extraStorageGb,
        uint16 totalStorageGb,
        uint256 amount,
        uint256 paidUntil
    );

    event PlatformTreasuryUpdated(address indexed platformTreasury);
    event PaymentTokenUpdated(address indexed paymentToken);

    error InvalidAddress();
    error InvalidTierKey();
    error InvalidPeriod();
    error TierAlreadyExists();
    error TierNotFound();
    error TierInactive();
    error ExtraStorageTooHigh();

    constructor(address initialOwner, address initialPlatformTreasury, address initialPaymentToken)
        Ownable(initialOwner)
    {
        if (
            initialOwner == address(0) || initialPlatformTreasury == address(0)
                || initialPaymentToken == address(0)
        ) {
            revert InvalidAddress();
        }

        platformTreasury = initialPlatformTreasury;
        paymentToken = IERC20(initialPaymentToken);
    }

    function registerTier(
        bytes32 tierKey,
        uint256 price,
        uint16 baseStorageGb,
        uint16 maxExtraStorageGb,
        uint256 pricePerExtraGb,
        uint64 periodSeconds
    ) external onlyOwner {
        _validateTierInput(tierKey, periodSeconds);

        if (tiers[tierKey].periodSeconds != 0) {
            revert TierAlreadyExists();
        }

        tiers[tierKey] = Tier({
            price: price,
            baseStorageGb: baseStorageGb,
            maxExtraStorageGb: maxExtraStorageGb,
            pricePerExtraGb: pricePerExtraGb,
            periodSeconds: periodSeconds,
            active: true
        });

        emit TierRegistered(tierKey, price, baseStorageGb, maxExtraStorageGb, pricePerExtraGb, periodSeconds);
    }

    function updateTier(
        bytes32 tierKey,
        uint256 price,
        uint16 baseStorageGb,
        uint16 maxExtraStorageGb,
        uint256 pricePerExtraGb,
        uint64 periodSeconds,
        bool active
    ) external onlyOwner {
        _validateTierInput(tierKey, periodSeconds);

        Tier storage tier = tiers[tierKey];
        if (tier.periodSeconds == 0) {
            revert TierNotFound();
        }

        tier.price = price;
        tier.baseStorageGb = baseStorageGb;
        tier.maxExtraStorageGb = maxExtraStorageGb;
        tier.pricePerExtraGb = pricePerExtraGb;
        tier.periodSeconds = periodSeconds;
        tier.active = active;

        emit TierUpdated(tierKey, price, baseStorageGb, maxExtraStorageGb, pricePerExtraGb, periodSeconds, active);
    }

    function subscribe(bytes32 tierKey, uint16 extraStorageGb) external returns (uint256 nextPaidUntil) {
        Tier memory tier = tiers[tierKey];
        if (tier.periodSeconds == 0) {
            revert TierNotFound();
        }
        if (!tier.active) {
            revert TierInactive();
        }
        if (extraStorageGb > tier.maxExtraStorageGb) {
            revert ExtraStorageTooHigh();
        }

        uint256 amount = calculateAmount(tierKey, extraStorageGb);
        if (amount > 0) {
            paymentToken.safeTransferFrom(msg.sender, platformTreasury, amount);
        }

        uint256 currentPaidUntil = paidUntil[msg.sender][tierKey];
        uint256 startsAt = currentPaidUntil > block.timestamp ? currentPaidUntil : block.timestamp;
        nextPaidUntil = startsAt + tier.periodSeconds;
        paidUntil[msg.sender][tierKey] = nextPaidUntil;

        emit PlatformSubscriptionPaid(
            msg.sender,
            tierKey,
            extraStorageGb,
            tier.baseStorageGb + extraStorageGb,
            amount,
            nextPaidUntil
        );
    }

    function calculateAmount(bytes32 tierKey, uint16 extraStorageGb) public view returns (uint256) {
        Tier memory tier = tiers[tierKey];
        if (tier.periodSeconds == 0) {
            revert TierNotFound();
        }
        if (extraStorageGb > tier.maxExtraStorageGb) {
            revert ExtraStorageTooHigh();
        }

        return tier.price + (uint256(extraStorageGb) * tier.pricePerExtraGb);
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

    function _validateTierInput(bytes32 tierKey, uint64 periodSeconds) private pure {
        if (tierKey == bytes32(0)) {
            revert InvalidTierKey();
        }
        if (periodSeconds == 0) {
            revert InvalidPeriod();
        }
    }
}

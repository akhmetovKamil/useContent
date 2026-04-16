// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SubscriptionManager is Ownable {
    using SafeERC20 for IERC20;

    uint16 public constant BPS_BASE = 10_000;
    uint16 public constant MAX_PLATFORM_FEE_BPS = 3_000;

    address public platformTreasury;
    uint16 public platformFeeBps = 2_000;

    struct Plan {
        address author;
        address token;
        uint256 price;
        uint64 periodSeconds;
        bool active;
        bytes32 externalId;
    }

    mapping(bytes32 planKey => Plan plan) public plans;
    mapping(address subscriber => mapping(bytes32 planKey => uint256 paidUntil)) public paidUntil;

    event PlanRegistered(
        bytes32 indexed planKey,
        address indexed author,
        address indexed token,
        uint256 price,
        uint64 periodSeconds,
        bytes32 externalId
    );

    event PlanUpdated(
        bytes32 indexed planKey,
        address indexed author,
        address indexed token,
        uint256 price,
        uint64 periodSeconds,
        bool active,
        bytes32 externalId
    );

    event SubscriptionPaid(
        bytes32 indexed planKey,
        address indexed subscriber,
        address indexed author,
        address token,
        uint256 amount,
        uint256 platformFee,
        uint256 paidUntil
    );

    event PlatformTreasuryUpdated(address indexed platformTreasury);
    event PlatformFeeUpdated(uint16 platformFeeBps);

    error InvalidAddress();
    error InvalidPlanKey();
    error InvalidPrice();
    error InvalidPeriod();
    error PlanAlreadyExists();
    error PlanNotFound();
    error UnauthorizedPlanAuthor();
    error PlanInactive();
    error FeeTooHigh();

    constructor(address initialOwner, address initialPlatformTreasury) Ownable(initialOwner) {
        if (initialOwner == address(0) || initialPlatformTreasury == address(0)) {
            revert InvalidAddress();
        }

        platformTreasury = initialPlatformTreasury;
    }

    function registerPlan(
        bytes32 planKey,
        address token,
        uint256 price,
        uint64 periodSeconds,
        bytes32 externalId
    ) external {
        _validatePlanInput(planKey, token, price, periodSeconds);

        if (plans[planKey].author != address(0)) {
            revert PlanAlreadyExists();
        }

        plans[planKey] = Plan({
            author: msg.sender,
            token: token,
            price: price,
            periodSeconds: periodSeconds,
            active: true,
            externalId: externalId
        });

        emit PlanRegistered(planKey, msg.sender, token, price, periodSeconds, externalId);
    }

    function updatePlan(
        bytes32 planKey,
        address token,
        uint256 price,
        uint64 periodSeconds,
        bool active,
        bytes32 externalId
    ) external {
        _validatePlanInput(planKey, token, price, periodSeconds);

        Plan storage plan = plans[planKey];
        if (plan.author == address(0)) {
            revert PlanNotFound();
        }
        if (plan.author != msg.sender) {
            revert UnauthorizedPlanAuthor();
        }

        plan.token = token;
        plan.price = price;
        plan.periodSeconds = periodSeconds;
        plan.active = active;
        plan.externalId = externalId;

        emit PlanUpdated(planKey, msg.sender, token, price, periodSeconds, active, externalId);
    }

    function subscribe(bytes32 planKey) external returns (uint256 nextPaidUntil) {
        Plan memory plan = plans[planKey];
        if (plan.author == address(0)) {
            revert PlanNotFound();
        }
        if (!plan.active) {
            revert PlanInactive();
        }

        uint256 fee = (plan.price * platformFeeBps) / BPS_BASE;
        uint256 authorAmount = plan.price - fee;
        IERC20 token = IERC20(plan.token);

        if (fee > 0) {
            token.safeTransferFrom(msg.sender, platformTreasury, fee);
        }
        token.safeTransferFrom(msg.sender, plan.author, authorAmount);

        uint256 currentPaidUntil = paidUntil[msg.sender][planKey];
        uint256 startsAt = currentPaidUntil > block.timestamp ? currentPaidUntil : block.timestamp;
        nextPaidUntil = startsAt + plan.periodSeconds;
        paidUntil[msg.sender][planKey] = nextPaidUntil;

        emit SubscriptionPaid(
            planKey,
            msg.sender,
            plan.author,
            plan.token,
            plan.price,
            fee,
            nextPaidUntil
        );
    }

    function setPlatformTreasury(address nextPlatformTreasury) external onlyOwner {
        if (nextPlatformTreasury == address(0)) {
            revert InvalidAddress();
        }

        platformTreasury = nextPlatformTreasury;
        emit PlatformTreasuryUpdated(nextPlatformTreasury);
    }

    function setPlatformFeeBps(uint16 nextPlatformFeeBps) external onlyOwner {
        if (nextPlatformFeeBps > MAX_PLATFORM_FEE_BPS) {
            revert FeeTooHigh();
        }

        platformFeeBps = nextPlatformFeeBps;
        emit PlatformFeeUpdated(nextPlatformFeeBps);
    }

    function _validatePlanInput(
        bytes32 planKey,
        address token,
        uint256 price,
        uint64 periodSeconds
    ) private pure {
        if (planKey == bytes32(0)) {
            revert InvalidPlanKey();
        }
        if (token == address(0)) {
            revert InvalidAddress();
        }
        if (price == 0) {
            revert InvalidPrice();
        }
        if (periodSeconds == 0) {
            revert InvalidPeriod();
        }
    }
}

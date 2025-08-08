import { min } from "bn.js";

const OPEN_POSITION_BPS = 1000;
const MIN_COLLATERAL_RATIO_BPS = 10000;


function getWorstPrice(price: number, slippageBps: number) {
    return price * (1 + slippageBps / 10000);
}

function getNumOfContracts(usdcSize: number, price: number) {  
    return usdcSize / price;
}

function getOpeningFee(collateral: number) {
    return collateral * OPEN_POSITION_BPS / 10000;
}
function getMinCollateral(usdcSize: number) {

    return usdcSize * MIN_COLLATERAL_RATIO_BPS / 10000;
}

function isLiquidatable(numOfContracts: number, collateral: number, entryPrice: number, isLong: boolean, liquidationThresholdBps: number, exitPrice: number) {
    const unrealizedPnl = numOfContracts * (exitPrice - entryPrice);
    const totalEquity = collateral + (unrealizedPnl * (isLong ? 1 : -1));

    const positionValue = numOfContracts * entryPrice;
    const liquidationThreshold = positionValue * liquidationThresholdBps / 10000;

    return totalEquity < liquidationThreshold;
}

function getLiquidationPrice(liquidationThresholdBps: number, collateral: number, size: number, entryPrice: number, isLong: boolean) {
    const maintenanceMargin = size * entryPrice * liquidationThresholdBps / 10000;
    const maxLoss = collateral - maintenanceMargin;
    const priceDelta = maxLoss / size;
    return entryPrice + (isLong ? -priceDelta : priceDelta);
}


let price = 100;
let slippageBps = 100;




let position_value = 10000;
let min_collateral_needed = getMinCollateral(position_value);
let opening_fee = getOpeningFee(min_collateral_needed);
let collateral_to_be_provided = min_collateral_needed + opening_fee;
let worst_price = getWorstPrice(price, slippageBps);
let num_of_contracts = getNumOfContracts(position_value, worst_price);


console.log("--------------USER GIVES POSITION VALUE------------------");
console.log("position_value", position_value);
console.log("min_collateral_needed", min_collateral_needed);
console.log("opening_fee", opening_fee);
console.log("collateral_to_be_provided", collateral_to_be_provided);
console.log("worst_price", worst_price);
console.log("num_of_contracts", num_of_contracts);
console.log("liquidationPrice", getLiquidationPrice(500, min_collateral_needed, num_of_contracts, worst_price, true));
console.log("Short liquidationPrice", getLiquidationPrice(500, min_collateral_needed, num_of_contracts, worst_price, false));

console.log("--------------------------------");


let user_given_size = 10; 
position_value = user_given_size * worst_price;

let min_collateral = getMinCollateral(position_value);
opening_fee = getOpeningFee(min_collateral);
collateral_to_be_provided = min_collateral + opening_fee;

console.log("--------------USER GIVES SIZE------------------");
console.log("user_given_size", user_given_size);
console.log("position_value", position_value);
console.log("min_collateral", min_collateral);
console.log("opening_fee", opening_fee);
console.log("collateral_to_be_provided", collateral_to_be_provided);
console.log("liquidationPrice", getLiquidationPrice(500, min_collateral, user_given_size, worst_price, true));
console.log("--------------------------------");

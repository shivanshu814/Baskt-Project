import { fetchAssetPrices } from ".";


async function main() {
    const assetPrices = await fetchAssetPrices([
        {
            provider: {
                name: 'coingecko',
                chain: '',
                id: 'pump-fun',
            },
            twp: {
                seconds: 1,
            },
            updateFrequencySeconds: 1,
            units: 1,
        },
    ], ["0x0000000000000000000000000000000000000000"]);

    console.log(assetPrices);
}


main().then(() => {
    process.exit(0);
});
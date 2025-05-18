#!/bin/bash
# Generate mock USDC account with our controlled mint authority
# This script creates a usdc-mock.json file that can be loaded into the Solana validator

# Extract public key from test-wallet.json
MINT_AUTHORITY_PUBKEY=$(cat test-wallet.json | jq -r '.public_key')
echo "Using mint authority: $MINT_AUTHORITY_PUBKEY"

# Fetch the USDC account data
echo "Fetching USDC account data..."
solana account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --output json-compact --output-file usdc.json

# Replace mint authority with our keypair
echo "Replacing mint authority..."
python3 -c "
import json, base64, base58

# load usdc account dump
with open('usdc.json','r') as f:
    usdc = json.load(f)

# patch the mint-authority bytes
data = bytearray(base64.b64decode(usdc['account']['data'][0]))
data[4:4+32] = base58.b58decode('6UvSQ8aRj4z1iD6eQPV6NJMdPXbMUjUzgDFKB9ExekvK')

# write out your mock
usdc['account']['data'][0] = base64.b64encode(data).decode('utf8')
with open('usdc-mock.json','w') as f:
    json.dump(usdc, f)
"

echo "Mock USDC account created at usdc-mock.json"
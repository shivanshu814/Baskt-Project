/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/baskt.json`.
 */
export type Baskt = {
  "address": "Bw6sN8LvQMqVhgZYihtkxoYqUZdPZe3vMWJ8N7ba6jLW",
  "metadata": {
    "name": "baskt",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "activateBaskt",
      "discriminator": [
        192,
        71,
        227,
        111,
        125,
        60,
        4,
        56
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "@dev Requires BasktManager role to activate baskts"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "activateBasktParams"
            }
          }
        }
      ]
    },
    {
      "name": "addAsset",
      "discriminator": [
        81,
        53,
        134,
        142,
        243,
        73,
        42,
        179
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "asset",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.ticker"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "addAssetParams"
            }
          }
        }
      ]
    },
    {
      "name": "addCollateral",
      "discriminator": [
        127,
        82,
        121,
        42,
        161,
        176,
        249,
        206
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "position.position_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralAccount",
          "writable": true
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "docs": [
            "PDA used for token authority over escrow"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account - required for validating the feature flag"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "addCollateralParams"
            }
          }
        }
      ]
    },
    {
      "name": "addLiquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "provider",
          "docs": [
            "The liquidity provider"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "liquidityPool",
          "docs": [
            "The liquidity pool account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to verify feature flags"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "providerUsdcAccount",
          "docs": [
            "The provider's token account to withdraw funds from"
          ],
          "writable": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "The vault that holds the pool's assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "providerLpAccount",
          "docs": [
            "The provider's LP token account to receive LP tokens"
          ],
          "writable": true
        },
        {
          "name": "lpMint",
          "docs": [
            "The LP token mint"
          ],
          "writable": true
        },
        {
          "name": "treasuryUsdcAccount",
          "docs": [
            "The treasury token account to receive fees"
          ],
          "writable": true
        },
        {
          "name": "treasury"
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minSharesOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addRole",
      "discriminator": [
        45,
        20,
        52,
        132,
        56,
        24,
        179,
        37
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "@dev Requires Owner role to assign roles to other accounts"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "account",
          "docs": [
            "Account to assign the role to"
          ]
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "roleType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelOrder",
      "discriminator": [
        95,
        129,
        237,
        240,
        8,
        49,
        223,
        132
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "order.order_id",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralAccount",
          "writable": true
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to verify feature flags"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "closeBaskt",
      "discriminator": [
        179,
        197,
        59,
        154,
        196,
        169,
        95,
        50
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "creator",
          "docs": [
            "Creator of the baskt - receives rent when closed"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can close baskt (BasktManager)"
          ],
          "signer": true
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "closePosition",
      "discriminator": [
        123,
        134,
        81,
        0,
        49,
        68,
        98,
        98
      ],
      "accounts": [
        {
          "name": "matcher",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.owner",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.order_id",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "orderOwner",
          "writable": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.owner",
                "account": "position"
              },
              {
                "kind": "account",
                "path": "position.position_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol for permission checks"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "treasury"
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "docs": [
            "Position escrow token account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralAccount",
          "docs": [
            "User's collateral token account to receive settlement"
          ],
          "writable": true
        },
        {
          "name": "treasuryToken",
          "docs": [
            "Protocol treasury token account for fee collection"
          ],
          "writable": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "BLP token vault for liquidity pool fees"
          ],
          "writable": true
        },
        {
          "name": "programAuthority",
          "docs": [
            "PDA used for token authority over escrow - still needed for CPI signing"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "closePositionParams"
            }
          }
        }
      ]
    },
    {
      "name": "createBaskt",
      "discriminator": [
        179,
        137,
        71,
        8,
        178,
        191,
        25,
        167
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.uid"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account to receive the fee"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for SOL transfers"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createBasktParams"
            }
          }
        }
      ]
    },
    {
      "name": "createOrder",
      "discriminator": [
        141,
        54,
        37,
        207,
        237,
        210,
        250,
        215
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "params.order_id"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account"
          ]
        },
        {
          "name": "ownerCollateralAccount",
          "writable": true
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to verify feature flags"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createOrderParams"
            }
          }
        }
      ]
    },
    {
      "name": "decommissionBaskt",
      "discriminator": [
        18,
        111,
        38,
        100,
        153,
        152,
        218,
        148
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can decommission (BasktManager or Owner for emergency)"
          ],
          "signer": true
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "forceClosePosition",
      "discriminator": [
        109,
        177,
        151,
        242,
        227,
        130,
        79,
        37
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.owner",
                "account": "position"
              },
              {
                "kind": "account",
                "path": "position.position_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool to update state"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "docs": [
            "Position escrow token account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralAccount",
          "docs": [
            "User's collateral token account to receive settlement"
          ],
          "writable": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "BLP token vault for liquidity pool"
          ],
          "writable": true
        },
        {
          "name": "treasuryToken",
          "docs": [
            "Protocol treasury token account for fee collection"
          ],
          "writable": true
        },
        {
          "name": "programAuthority",
          "docs": [
            "Program authority PDA"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "forceClosePositionParams"
            }
          }
        }
      ]
    },
    {
      "name": "initializeLiquidityPool",
      "discriminator": [
        155,
        18,
        138,
        107,
        111,
        23,
        178,
        178
      ],
      "accounts": [
        {
          "name": "admin",
          "docs": [
            "Admin with Owner role who can initialize the pool"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to verify admin role",
            "@dev Requires Owner role to initialize liquidity pool"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool account to initialize"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "lpMint",
          "docs": [
            "The mint that will be used for LP tokens"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "The token account that will hold the pool's assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "lpTokenEscrow",
          "docs": [
            "The token account that will hold LP tokens during withdrawal queue processing"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "docs": [
            "The mint of the token used for collateral"
          ]
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "depositFeeBps",
          "type": "u16"
        },
        {
          "name": "withdrawalFeeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeProtocol",
      "discriminator": [
        188,
        233,
        252,
        106,
        134,
        146,
        202,
        91
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "collateralMint",
          "docs": [
            "Escrow mint (USDC)"
          ]
        },
        {
          "name": "programAuthority",
          "docs": [
            "Program authority PDA - created during protocol initialization"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "liquidatePosition",
      "discriminator": [
        187,
        74,
        229,
        149,
        102,
        81,
        221,
        68
      ],
      "accounts": [
        {
          "name": "liquidator",
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.owner",
                "account": "position"
              },
              {
                "kind": "account",
                "path": "position.position_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol for permission checks"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "CHECK Treasury account"
          ]
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "docs": [
            "Position escrow token account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralAccount",
          "docs": [
            "User's collateral token account to receive settlement"
          ],
          "writable": true
        },
        {
          "name": "treasuryToken",
          "docs": [
            "Protocol treasury token account for fee collection"
          ],
          "writable": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "BLP token vault for liquidity pool fees"
          ],
          "writable": true
        },
        {
          "name": "programAuthority",
          "docs": [
            "PDA used for token authority over escrow"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "liquidatePositionParams"
            }
          }
        }
      ]
    },
    {
      "name": "openPosition",
      "discriminator": [
        135,
        128,
        47,
        77,
        15,
        152,
        240,
        49
      ],
      "accounts": [
        {
          "name": "matcher",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.owner",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.order_id",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "orderOwner",
          "writable": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "order.owner",
                "account": "order"
              },
              {
                "kind": "arg",
                "path": "params.position_id"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account that contains the embedded oracle for price validation"
          ],
          "writable": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for checking permissions",
            "@dev Requires Matcher role to open positions"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool for account validation and fee accounting"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "orderEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order.owner",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "ownerCollateralEscrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "docs": [
            "PDA used for token authority over escrow"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "collateralMint",
          "docs": [
            "Escrow mint (USDC) - validated via protocol"
          ]
        },
        {
          "name": "treasuryToken",
          "docs": [
            "Protocol treasury token account for fee collection"
          ],
          "writable": true
        },
        {
          "name": "usdcVault",
          "docs": [
            "BLP token vault for liquidity pool fees"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "openPositionParams"
            }
          }
        }
      ]
    },
    {
      "name": "processWithdrawQueue",
      "discriminator": [
        23,
        100,
        61,
        241,
        134,
        190,
        48,
        53
      ],
      "accounts": [
        {
          "name": "keeper",
          "writable": true,
          "signer": true
        },
        {
          "name": "liquidityPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "usdcVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "treasuryUsdcAccount",
          "writable": true
        },
        {
          "name": "lpTokenEscrow",
          "docs": [
            "LP token escrow account where LP tokens are held during withdrawal queue processing"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "providerUsdcAccount",
          "docs": [
            "USDC account"
          ],
          "writable": true
        },
        {
          "name": "withdrawRequest",
          "writable": true
        },
        {
          "name": "provider",
          "writable": true
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint for burning"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "queueWithdrawLiquidity",
      "discriminator": [
        180,
        225,
        125,
        70,
        9,
        230,
        128,
        117
      ],
      "accounts": [
        {
          "name": "provider",
          "docs": [
            "The liquidity provider requesting withdrawal"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool state account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol state for feature flags validation"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "providerLpAccount",
          "docs": [
            "Provider's LP token account (source for burn)"
          ],
          "writable": true
        },
        {
          "name": "providerUsdcAccount",
          "docs": [
            "USDC account"
          ]
        },
        {
          "name": "lpTokenEscrow",
          "docs": [
            "LP token escrow account where LP tokens are held during withdrawal queue processing"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              }
            ]
          }
        },
        {
          "name": "withdrawRequest",
          "docs": [
            "Withdrawal request PDA"
          ],
          "writable": true
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint for burning"
          ],
          "writable": true
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "liquidityPool"
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "requestWithdrawParams"
            }
          }
        }
      ]
    },
    {
      "name": "rebalance",
      "discriminator": [
        108,
        158,
        77,
        9,
        210,
        52,
        88,
        62
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "@dev Requires Rebalancer role to rebalance"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "assetConfigs",
          "type": {
            "vec": {
              "defined": {
                "name": "assetConfig"
              }
            }
          }
        },
        {
          "name": "newNav",
          "type": "u64"
        },
        {
          "name": "rebalanceFeePerUnit",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "rebalanceRequest",
      "discriminator": [
        114,
        49,
        98,
        158,
        41,
        46,
        138,
        201
      ],
      "accounts": [
        {
          "name": "baskt"
        },
        {
          "name": "creator",
          "docs": [
            "@dev Only the baskt creator can request a rebalance"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to get fee configuration"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account to receive the fee"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for SOL transfers"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "removeRole",
      "discriminator": [
        74,
        69,
        168,
        163,
        248,
        3,
        130,
        0
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "@dev Requires Owner role to remove roles from other accounts"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "account",
          "docs": [
            "Account to remove the role from"
          ]
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "roleType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setBasktClosingFeeBps",
      "discriminator": [
        221,
        101,
        129,
        68,
        37,
        222,
        146,
        84
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newClosingFeeBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "setBasktCreationFee",
      "discriminator": [
        174,
        195,
        87,
        31,
        78,
        125,
        189,
        6
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager or Owner role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newFeeLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setBasktLiquidationFeeBps",
      "discriminator": [
        135,
        100,
        171,
        91,
        162,
        158,
        226,
        36
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newLiquidationFeeBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "setBasktLiquidationThresholdBps",
      "discriminator": [
        79,
        130,
        174,
        106,
        60,
        213,
        50,
        73
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newLiquidationThresholdBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "setBasktMinCollateralRatioBps",
      "discriminator": [
        131,
        192,
        20,
        188,
        210,
        35,
        201,
        163
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newMinCollateralRatioBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "setBasktOpeningFeeBps",
      "discriminator": [
        197,
        44,
        153,
        105,
        230,
        244,
        44,
        88
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newOpeningFeeBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "setClosingFeeBps",
      "discriminator": [
        228,
        245,
        238,
        120,
        199,
        91,
        4,
        228
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newClosingFeeBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFundingCutBps",
      "discriminator": [
        187,
        140,
        188,
        89,
        202,
        49,
        175,
        65
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newFundingCutBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setLiquidationFeeBps",
      "discriminator": [
        133,
        242,
        86,
        151,
        4,
        91,
        77,
        161
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newLiquidationFeeBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setLiquidationThresholdBps",
      "discriminator": [
        240,
        171,
        134,
        1,
        231,
        151,
        240,
        201
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newLiquidationThresholdBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setMinCollateralRatioBps",
      "discriminator": [
        227,
        204,
        66,
        98,
        143,
        96,
        99,
        122
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newMinCollateralRatioBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setMinLiquidity",
      "discriminator": [
        162,
        147,
        87,
        130,
        193,
        136,
        3,
        58
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newMinLiquidity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setOpeningFeeBps",
      "discriminator": [
        157,
        25,
        242,
        124,
        119,
        236,
        144,
        81
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newOpeningFeeBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setRebalanceRequestFee",
      "discriminator": [
        243,
        54,
        146,
        34,
        66,
        87,
        28,
        118
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newFeeLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setTreasuryCutBps",
      "discriminator": [
        127,
        177,
        56,
        177,
        157,
        146,
        191,
        230
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer that must have the ConfigManager role"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account containing configuration"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newTreasuryCutBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateBasktConfig",
      "discriminator": [
        231,
        139,
        249,
        181,
        181,
        140,
        50,
        232
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can modify baskt config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to update"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for role checking"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateBasktConfigParams"
            }
          }
        }
      ]
    },
    {
      "name": "updateFeatureFlags",
      "discriminator": [
        139,
        88,
        184,
        214,
        40,
        6,
        55,
        247
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "@dev Requires Owner role to update feature flags"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateFeatureFlagsParams"
            }
          }
        }
      ]
    },
    {
      "name": "updateFundingIndex",
      "discriminator": [
        27,
        238,
        109,
        184,
        62,
        17,
        163,
        149
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "@dev Requires FundingManager role to update funding indices"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account associated with the funding index. Used only for seed verification."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  107,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "baskt.uid",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newRate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateTreasury",
      "discriminator": [
        60,
        16,
        243,
        66,
        96,
        59,
        254,
        131
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer must be Owner or ConfigManager"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newTreasury",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "baskt",
      "discriminator": [
        105,
        38,
        119,
        212,
        185,
        63,
        190,
        248
      ]
    },
    {
      "name": "liquidityPool",
      "discriminator": [
        66,
        38,
        17,
        64,
        188,
        80,
        68,
        129
      ]
    },
    {
      "name": "order",
      "discriminator": [
        134,
        173,
        223,
        185,
        77,
        86,
        28,
        51
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "programAuthority",
      "discriminator": [
        38,
        198,
        188,
        60,
        171,
        210,
        169,
        38
      ]
    },
    {
      "name": "protocol",
      "discriminator": [
        45,
        39,
        101,
        43,
        115,
        72,
        131,
        40
      ]
    },
    {
      "name": "syntheticAsset",
      "discriminator": [
        106,
        240,
        239,
        114,
        174,
        40,
        189,
        218
      ]
    },
    {
      "name": "withdrawRequest",
      "discriminator": [
        186,
        239,
        174,
        191,
        189,
        13,
        47,
        196
      ]
    }
  ],
  "events": [
    {
      "name": "basktActivatedEvent",
      "discriminator": [
        88,
        137,
        206,
        103,
        196,
        4,
        65,
        8
      ]
    },
    {
      "name": "basktClosed",
      "discriminator": [
        30,
        129,
        31,
        215,
        46,
        231,
        241,
        7
      ]
    },
    {
      "name": "basktConfigUpdatedEvent",
      "discriminator": [
        161,
        255,
        126,
        226,
        10,
        130,
        31,
        137
      ]
    },
    {
      "name": "basktCreatedEvent",
      "discriminator": [
        230,
        10,
        18,
        30,
        165,
        178,
        209,
        132
      ]
    },
    {
      "name": "basktDecommissioningInitiated",
      "discriminator": [
        41,
        181,
        24,
        72,
        93,
        88,
        141,
        100
      ]
    },
    {
      "name": "basktRebalancedEvent",
      "discriminator": [
        201,
        140,
        15,
        4,
        88,
        198,
        74,
        170
      ]
    },
    {
      "name": "collateralAddedEvent",
      "discriminator": [
        90,
        251,
        19,
        246,
        134,
        164,
        243,
        177
      ]
    },
    {
      "name": "fundingIndexInitializedEvent",
      "discriminator": [
        103,
        198,
        106,
        15,
        181,
        173,
        213,
        165
      ]
    },
    {
      "name": "fundingIndexUpdatedEvent",
      "discriminator": [
        142,
        186,
        249,
        164,
        193,
        209,
        84,
        145
      ]
    },
    {
      "name": "liquidityAddedEvent",
      "discriminator": [
        220,
        104,
        7,
        39,
        147,
        1,
        194,
        142
      ]
    },
    {
      "name": "liquidityPoolInitializedEvent",
      "discriminator": [
        206,
        100,
        66,
        15,
        113,
        180,
        118,
        59
      ]
    },
    {
      "name": "liquidityRemovedEvent",
      "discriminator": [
        233,
        117,
        13,
        70,
        229,
        1,
        106,
        215
      ]
    },
    {
      "name": "orderCancelledEvent",
      "discriminator": [
        200,
        73,
        179,
        145,
        247,
        176,
        10,
        101
      ]
    },
    {
      "name": "orderCreatedEvent",
      "discriminator": [
        75,
        88,
        56,
        153,
        87,
        22,
        170,
        46
      ]
    },
    {
      "name": "positionClosedEvent",
      "discriminator": [
        76,
        129,
        10,
        225,
        238,
        51,
        158,
        126
      ]
    },
    {
      "name": "positionForceClosed",
      "discriminator": [
        169,
        152,
        228,
        17,
        218,
        207,
        1,
        119
      ]
    },
    {
      "name": "positionLiquidatedEvent",
      "discriminator": [
        70,
        153,
        226,
        254,
        176,
        139,
        225,
        72
      ]
    },
    {
      "name": "positionOpenedEvent",
      "discriminator": [
        163,
        1,
        92,
        149,
        138,
        188,
        177,
        23
      ]
    },
    {
      "name": "protocolStateUpdatedEvent",
      "discriminator": [
        191,
        17,
        185,
        143,
        32,
        206,
        61,
        29
      ]
    },
    {
      "name": "rebalanceRequestEvent",
      "discriminator": [
        14,
        9,
        248,
        15,
        162,
        243,
        186,
        161
      ]
    },
    {
      "name": "withdrawQueueProcessedEvent",
      "discriminator": [
        167,
        34,
        124,
        242,
        149,
        97,
        242,
        17
      ]
    },
    {
      "name": "withdrawalQueuedEvent",
      "discriminator": [
        189,
        125,
        98,
        229,
        140,
        253,
        16,
        86
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6001,
      "name": "insufficientCollateral",
      "msg": "Insufficient collateral for position"
    },
    {
      "code": 6002,
      "name": "positionNotLiquidatable",
      "msg": "Position is not liquidatable"
    },
    {
      "code": 6003,
      "name": "positionAlreadyClosed",
      "msg": "Position is already closed"
    },
    {
      "code": 6004,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in pool"
    },
    {
      "code": 6005,
      "name": "invalidBasktConfig",
      "msg": "Invalid baskt configuration"
    },
    {
      "code": 6006,
      "name": "invalidPositionSize",
      "msg": "Invalid position size"
    },
    {
      "code": 6007,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6008,
      "name": "unauthorizedRole",
      "msg": "Unauthorized: Missing required role for this operation"
    },
    {
      "code": 6009,
      "name": "unauthorizedTokenOwner",
      "msg": "Unauthorized: Token account owner mismatch"
    },
    {
      "code": 6010,
      "name": "invalidLpTokenAmount",
      "msg": "Invalid LP token amount"
    },
    {
      "code": 6011,
      "name": "invalidOraclePrice",
      "msg": "Invalid oracle price"
    },
    {
      "code": 6012,
      "name": "priceOutOfBounds",
      "msg": "Submitted price is outside acceptable deviation bounds from oracle price"
    },
    {
      "code": 6013,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for operation"
    },
    {
      "code": 6014,
      "name": "basktNotActive",
      "msg": "Baskt is not active for trading"
    },
    {
      "code": 6015,
      "name": "roleNotFound",
      "msg": "Role not found for the account"
    },
    {
      "code": 6016,
      "name": "invalidRoleType",
      "msg": "Invalid role type"
    },
    {
      "code": 6017,
      "name": "invalidAssetAccount",
      "msg": "Invalid asset account"
    },
    {
      "code": 6018,
      "name": "longPositionsDisabled",
      "msg": "Long positions are disabled for this asset"
    },
    {
      "code": 6019,
      "name": "shortPositionsDisabled",
      "msg": "Short positions are disabled for this asset"
    },
    {
      "code": 6020,
      "name": "assetNotInBaskt",
      "msg": "Asset not in baskt"
    },
    {
      "code": 6021,
      "name": "invalidAssetConfig",
      "msg": "Invalid asset config"
    },
    {
      "code": 6022,
      "name": "tradingDisabled",
      "msg": "Trading operations are currently disabled"
    },
    {
      "code": 6023,
      "name": "liquidityOperationsDisabled",
      "msg": "Liquidity operations are currently disabled"
    },
    {
      "code": 6024,
      "name": "positionOperationsDisabled",
      "msg": "Position operations are currently disabled"
    },
    {
      "code": 6025,
      "name": "basktOperationsDisabled",
      "msg": "Baskt management operations are currently disabled"
    },
    {
      "code": 6026,
      "name": "inactiveAsset",
      "msg": "Asset Not Active"
    },
    {
      "code": 6027,
      "name": "basktAlreadyActive",
      "msg": "Baskt Already Active"
    },
    {
      "code": 6028,
      "name": "invalidAssetWeights",
      "msg": "Invalid asset weights"
    },
    {
      "code": 6029,
      "name": "orderAlreadyProcessed",
      "msg": "Order already processed"
    },
    {
      "code": 6030,
      "name": "invalidEscrowAccount",
      "msg": "Invalid escrow account"
    },
    {
      "code": 6031,
      "name": "invalidProgramAuthority",
      "msg": "Invalid program authority"
    },
    {
      "code": 6032,
      "name": "tokenHasDelegate",
      "msg": "Token has delegate"
    },
    {
      "code": 6033,
      "name": "tokenHasCloseAuthority",
      "msg": "Token has close authority"
    },
    {
      "code": 6034,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6035,
      "name": "zeroSizedPosition",
      "msg": "Zero sized position"
    },
    {
      "code": 6036,
      "name": "invalidTargetPosition",
      "msg": "Invalid target position"
    },
    {
      "code": 6037,
      "name": "invalidBaskt",
      "msg": "Invalid baskt"
    },
    {
      "code": 6038,
      "name": "invalidOrderAction",
      "msg": "Invalid order action"
    },
    {
      "code": 6039,
      "name": "fundingNotUpToDate",
      "msg": "Funding not up to date"
    },
    {
      "code": 6040,
      "name": "positionStillOpen",
      "msg": "Position still open"
    },
    {
      "code": 6041,
      "name": "invalidTreasuryAccount",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6042,
      "name": "collateralOverflow",
      "msg": "Collateral amount would overflow maximum value"
    },
    {
      "code": 6043,
      "name": "invalidDepositAmount",
      "msg": "Invalid deposit amount"
    },
    {
      "code": 6044,
      "name": "invalidUsdcVault",
      "msg": "Invalid usdc vault account"
    },
    {
      "code": 6045,
      "name": "invalidFeeBps",
      "msg": "Invalid fee basis points"
    },
    {
      "code": 6046,
      "name": "invalidCollateralRatio",
      "msg": "Invalid collateral ratio"
    },
    {
      "code": 6047,
      "name": "fundingRateExceedsMaximum",
      "msg": "Funding rate exceeds maximum allowed"
    },
    {
      "code": 6048,
      "name": "invalidOwner",
      "msg": "Invalid owner"
    },
    {
      "code": 6049,
      "name": "invalidFundingIndex",
      "msg": "Invalid funding index account"
    },
    {
      "code": 6050,
      "name": "invalidBasktState",
      "msg": "Invalid baskt state for this operation"
    },
    {
      "code": 6051,
      "name": "gracePeriodNotOver",
      "msg": "Grace period has not ended"
    },
    {
      "code": 6052,
      "name": "positionsStillOpen",
      "msg": "Positions are still open"
    },
    {
      "code": 6053,
      "name": "invalidGracePeriod",
      "msg": "Invalid grace period - must be between 1 hour and 7 days"
    },
    {
      "code": 6054,
      "name": "priceDeviationTooHigh",
      "msg": "Price deviation too high"
    },
    {
      "code": 6055,
      "name": "leverageExceeded",
      "msg": "Realised leverage exceeds declared leverage amount"
    },
    {
      "code": 6056,
      "name": "invalidInput",
      "msg": "Invalid input provided"
    },
    {
      "code": 6057,
      "name": "transferFailed",
      "msg": "SOL transfer failed"
    },
    {
      "code": 6058,
      "name": "invalidLpTokenEscrow",
      "msg": "Invalid LP token escrow"
    }
  ],
  "types": [
    {
      "name": "accessControl",
      "docs": [
        "Access control system for the protocol"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "entries",
            "docs": [
              "Map of accounts to their roles"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "accessControlEntry"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "accessControlEntry",
      "docs": [
        "Access control entry for a specific account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "account",
            "docs": [
              "The account that has this role"
            ],
            "type": "pubkey"
          },
          {
            "name": "role",
            "docs": [
              "The role assigned to this account"
            ],
            "type": {
              "defined": {
                "name": "role"
              }
            }
          }
        ]
      }
    },
    {
      "name": "actionParams",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open",
            "fields": [
              {
                "defined": {
                  "name": "openOrderParams"
                }
              }
            ]
          },
          {
            "name": "close",
            "fields": [
              {
                "defined": {
                  "name": "closeOrderParams"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "activateBasktParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "prices",
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "addAssetParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "permissions",
            "type": {
              "defined": {
                "name": "assetPermissions"
              }
            }
          },
          {
            "name": "ticker",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "addCollateralParams",
      "docs": [
        "Parameters for adding collateral to a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "additionalCollateral",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "assetConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "assetId",
            "type": "pubkey"
          },
          {
            "name": "direction",
            "type": "bool"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "baselinePrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "assetPermissions",
      "docs": [
        "Permissions for the asset - optimized to use bitfield"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "flags",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "baskt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "uid",
            "type": "u32"
          },
          {
            "name": "currentAssetConfigs",
            "type": {
              "vec": {
                "defined": {
                  "name": "assetConfig"
                }
              }
            }
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "basktStatus"
              }
            }
          },
          {
            "name": "openPositions",
            "type": "u32"
          },
          {
            "name": "lastRebalanceTime",
            "type": "u32"
          },
          {
            "name": "baselineNav",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "rebalancePeriod",
            "type": "u32"
          },
          {
            "name": "config",
            "type": {
              "defined": {
                "name": "basktConfig"
              }
            }
          },
          {
            "name": "fundingIndex",
            "type": {
              "defined": {
                "name": "fundingIndex"
              }
            }
          },
          {
            "name": "rebalanceFeeIndex",
            "type": {
              "defined": {
                "name": "rebalanceFeeIndex"
              }
            }
          },
          {
            "name": "extraSpace",
            "type": {
              "array": [
                "u8",
                120
              ]
            }
          }
        ]
      }
    },
    {
      "name": "basktActivatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "baselineNav",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "basktClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baskt",
            "type": "pubkey"
          },
          {
            "name": "closedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "basktConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "flags",
            "type": "u8"
          },
          {
            "name": "openingFeeBps",
            "type": "u64"
          },
          {
            "name": "closingFeeBps",
            "type": "u64"
          },
          {
            "name": "liquidationFeeBps",
            "type": "u64"
          },
          {
            "name": "minCollateralRatioBps",
            "type": "u64"
          },
          {
            "name": "liquidationThresholdBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "basktConfigUpdatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baskt",
            "type": "pubkey"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "basktCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktCreationFee",
            "type": "u64"
          },
          {
            "name": "uid",
            "type": "u32"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "assetCount",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "basktRebalancePeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "basktDecommissioningInitiated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baskt",
            "type": "pubkey"
          },
          {
            "name": "initiatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "basktRebalancedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "rebalanceIndex",
            "type": "u64"
          },
          {
            "name": "baselineNav",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "basktStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "decommissioning"
          }
        ]
      }
    },
    {
      "name": "closeOrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sizeAsContracts",
            "type": "u64"
          },
          {
            "name": "targetPosition",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "closePositionParams",
      "docs": [
        "Parameters for closing a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exitPrice",
            "type": "u64"
          },
          {
            "name": "sizeToClose",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "collateralAddedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "additionalCollateral",
            "type": "u64"
          },
          {
            "name": "newTotalCollateral",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "createBasktAssetParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "direction",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "createBasktParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "uid",
            "type": "u32"
          },
          {
            "name": "assetParams",
            "type": {
              "vec": {
                "defined": {
                  "name": "createBasktAssetParams"
                }
              }
            }
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "basktRebalancePeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "createOrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "u32"
          },
          {
            "name": "notionalValue",
            "type": "u64"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "orderAction"
              }
            }
          },
          {
            "name": "targetPosition",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "sizeAsContracts",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "limitPrice",
            "type": "u64"
          },
          {
            "name": "maxSlippageBps",
            "type": "u64"
          },
          {
            "name": "leverageBps",
            "type": "u64"
          },
          {
            "name": "orderType",
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "exitInfo",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "closed",
            "fields": [
              {
                "name": "price",
                "type": "u64"
              },
              {
                "name": "timestamp",
                "type": "u32"
              }
            ]
          },
          {
            "name": "liquidated",
            "fields": [
              {
                "name": "price",
                "type": "u64"
              },
              {
                "name": "timestamp",
                "type": "u32"
              }
            ]
          },
          {
            "name": "forceClosed",
            "fields": [
              {
                "name": "price",
                "type": "u64"
              },
              {
                "name": "timestamp",
                "type": "u32"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "featureFlags",
      "docs": [
        "Feature flags to enable or disable specific protocol features"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowAddLiquidity",
            "docs": [
              "Allow adding liquidity to the protocol"
            ],
            "type": "bool"
          },
          {
            "name": "allowRemoveLiquidity",
            "docs": [
              "Allow removing liquidity from the protocol"
            ],
            "type": "bool"
          },
          {
            "name": "allowOpenPosition",
            "docs": [
              "Allow opening new positions"
            ],
            "type": "bool"
          },
          {
            "name": "allowClosePosition",
            "docs": [
              "Allow closing existing positions"
            ],
            "type": "bool"
          },
          {
            "name": "allowPnlWithdrawal",
            "docs": [
              "Allow withdrawal of PnL"
            ],
            "type": "bool"
          },
          {
            "name": "allowCollateralWithdrawal",
            "docs": [
              "Allow withdrawal of collateral"
            ],
            "type": "bool"
          },
          {
            "name": "allowAddCollateral",
            "docs": [
              "Allow adding collateral to existing positions"
            ],
            "type": "bool"
          },
          {
            "name": "allowBasktCreation",
            "docs": [
              "Allow creation of new baskts"
            ],
            "type": "bool"
          },
          {
            "name": "allowBasktUpdate",
            "docs": [
              "Allow updating existing baskts"
            ],
            "type": "bool"
          },
          {
            "name": "allowTrading",
            "docs": [
              "Allow trading on the protocol"
            ],
            "type": "bool"
          },
          {
            "name": "allowLiquidations",
            "docs": [
              "Allow liquidations to occur"
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "forceClosePositionParams",
      "docs": [
        "Parameters for force closing a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "closePrice",
            "docs": [
              "Price to use for closing the position"
            ],
            "type": "u64"
          },
          {
            "name": "sizeToClose",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "fundingIndex",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cumulativeIndex",
            "type": "i128"
          },
          {
            "name": "lastUpdateTimestamp",
            "type": "i64"
          },
          {
            "name": "currentRate",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "fundingIndexInitializedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "initialIndex",
            "type": "i128"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "fundingIndexUpdatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "cumulativeIndex",
            "type": "i128"
          },
          {
            "name": "currentRate",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "limitOrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "limitPrice",
            "type": "u64"
          },
          {
            "name": "maxSlippageBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "liquidatePositionParams",
      "docs": [
        "Parameters for liquidating a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exitPrice",
            "type": "u64"
          },
          {
            "name": "sizeToClose",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "liquidityAddedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "provider",
            "type": "pubkey"
          },
          {
            "name": "liquidityPool",
            "type": "pubkey"
          },
          {
            "name": "depositAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "sharesMinted",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "liquidityPool",
      "docs": [
        "LiquidityPool represents the shared liquidity pool for the entire protocol",
        "This is a single pool that acts as the counterparty to all user positions"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalLiquidity",
            "docs": [
              "The total amount of liquidity in the pool"
            ],
            "type": "u64"
          },
          {
            "name": "lpMint",
            "docs": [
              "The token mint for the LP tokens"
            ],
            "type": "pubkey"
          },
          {
            "name": "usdcVault",
            "docs": [
              "The token account where USDC is stored"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpTokenEscrow",
            "docs": [
              "The token account where LP tokens are held during withdrawal queue processing"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalShares",
            "docs": [
              "Total supply of LP tokens"
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdateTimestamp",
            "docs": [
              "The timestamp of the last pool update"
            ],
            "type": "i64"
          },
          {
            "name": "depositFeeBps",
            "docs": [
              "Fee percentage charged on deposits in basis points (e.g. 10 = 0.1%)"
            ],
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "docs": [
              "Fee percentage charged on withdrawals in basis points (e.g. 30 = 0.3%)"
            ],
            "type": "u16"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for this PDA"
            ],
            "type": "u8"
          },
          {
            "name": "poolAuthorityBump",
            "docs": [
              "Bump for pool authority PDA"
            ],
            "type": "u8"
          },
          {
            "name": "pendingLpTokens",
            "docs": [
              "Sum of LP tokens in the withdrawal queue but not yet burned"
            ],
            "type": "u64"
          },
          {
            "name": "withdrawQueueHead",
            "docs": [
              "Monotonically increasing identifier for the next withdrawal request to append"
            ],
            "type": "u64"
          },
          {
            "name": "withdrawQueueTail",
            "docs": [
              "Identifier of the next withdrawal request expected to be processed"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "liquidityPoolInitializedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "liquidityPool",
            "type": "pubkey"
          },
          {
            "name": "lpMint",
            "type": "pubkey"
          },
          {
            "name": "usdcVault",
            "type": "pubkey"
          },
          {
            "name": "depositFeeBps",
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "type": "u16"
          },
          {
            "name": "initializer",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "liquidityRemovedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "provider",
            "type": "pubkey"
          },
          {
            "name": "liquidityPool",
            "type": "pubkey"
          },
          {
            "name": "sharesBurned",
            "type": "u64"
          },
          {
            "name": "withdrawalAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "netAmountReceived",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "marketOrderParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "openOrderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "notionalValue",
            "type": "u64"
          },
          {
            "name": "leverageBps",
            "type": "u64"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "openPositionParams",
      "docs": [
        "Parameters for opening a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "positionId",
            "type": "u32"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "order",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "orderId",
            "type": "u32"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "orderAction"
              }
            }
          },
          {
            "name": "orderType",
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          },
          {
            "name": "actionParams",
            "type": {
              "defined": {
                "name": "actionParams"
              }
            }
          },
          {
            "name": "orderTypeParams",
            "type": {
              "defined": {
                "name": "orderTypeParams"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "orderStatus"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "extraSpace",
            "type": {
              "array": [
                "u8",
                150
              ]
            }
          }
        ]
      }
    },
    {
      "name": "orderAction",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "close"
          }
        ]
      }
    },
    {
      "name": "orderCancelledEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "orderId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "orderId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "notionalValue",
            "type": "u64"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "orderAction"
              }
            }
          },
          {
            "name": "targetPosition",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "limitPrice",
            "type": "u64"
          },
          {
            "name": "maxSlippageBps",
            "type": "u64"
          },
          {
            "name": "orderType",
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          },
          {
            "name": "leverageBps",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "filled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "orderType",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "market"
          },
          {
            "name": "limit"
          }
        ]
      }
    },
    {
      "name": "orderTypeParams",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "market",
            "fields": [
              {
                "defined": {
                  "name": "marketOrderParams"
                }
              }
            ]
          },
          {
            "name": "limit",
            "fields": [
              {
                "defined": {
                  "name": "limitOrderParams"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "positionId",
            "type": "u32"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          },
          {
            "name": "exitInfo",
            "type": {
              "defined": {
                "name": "exitInfo"
              }
            }
          },
          {
            "name": "lastFundingIndex",
            "type": "i128"
          },
          {
            "name": "fundingAccumulated",
            "type": "i128"
          },
          {
            "name": "lastRebalanceFeeIndex",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "positionStatus"
              }
            }
          },
          {
            "name": "timestampOpen",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "extraSpace",
            "type": {
              "array": [
                "u8",
                120
              ]
            }
          }
        ]
      }
    },
    {
      "name": "positionClosedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "sizeClosed",
            "type": "u64"
          },
          {
            "name": "sizeRemaining",
            "type": "u64"
          },
          {
            "name": "exitPrice",
            "type": "u64"
          },
          {
            "name": "pnl",
            "type": "i64"
          },
          {
            "name": "feeToTreasury",
            "type": "u64"
          },
          {
            "name": "feeToBlp",
            "type": "u64"
          },
          {
            "name": "fundingPayment",
            "type": "i128"
          },
          {
            "name": "settlementAmount",
            "type": "u64"
          },
          {
            "name": "poolPayout",
            "type": "u64"
          },
          {
            "name": "collateralRemaining",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionForceClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baskt",
            "type": "pubkey"
          },
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "settlementPrice",
            "type": "u64"
          },
          {
            "name": "closePrice",
            "type": "u64"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          },
          {
            "name": "sizeClosed",
            "type": "u64"
          },
          {
            "name": "sizeRemaining",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "collateralReturned",
            "type": "u64"
          },
          {
            "name": "pnl",
            "type": "i64"
          },
          {
            "name": "fundingPayment",
            "type": "i128"
          },
          {
            "name": "closedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "escrowReturnedToPool",
            "type": "u64"
          },
          {
            "name": "poolPayout",
            "type": "u64"
          },
          {
            "name": "badDebtAbsorbed",
            "type": "u64"
          },
          {
            "name": "collateralRemaining",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionLiquidatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "sizeLiquidated",
            "type": "u64"
          },
          {
            "name": "sizeRemaining",
            "type": "u64"
          },
          {
            "name": "exitPrice",
            "type": "u64"
          },
          {
            "name": "pnl",
            "type": "i64"
          },
          {
            "name": "feeToTreasury",
            "type": "u64"
          },
          {
            "name": "feeToBlp",
            "type": "u64"
          },
          {
            "name": "fundingPayment",
            "type": "i128"
          },
          {
            "name": "remainingCollateral",
            "type": "u64"
          },
          {
            "name": "poolPayout",
            "type": "u64"
          },
          {
            "name": "collateralRemaining",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionOpenedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          },
          {
            "name": "feeToTreasury",
            "type": "u64"
          },
          {
            "name": "feeToBlp",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "closed"
          },
          {
            "name": "liquidated"
          },
          {
            "name": "forceClosed"
          }
        ]
      }
    },
    {
      "name": "programAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "protocol",
      "docs": [
        "* It should track all the assets that we have in the system.\n * it should keep track of all the fees we are charging and what not\n * it should keep track of min liqudiation margins\n * it should keep track of fee splits\n * it should keep track of owner and be able to transfer ownership\n * it should keep track of protocol level stats maybe? fees, trading, volume, total baskts, total assets"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "accessControl",
            "type": {
              "defined": {
                "name": "accessControl"
              }
            }
          },
          {
            "name": "featureFlags",
            "type": {
              "defined": {
                "name": "featureFlags"
              }
            }
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "collateralMint",
            "docs": [
              "Collateral mint (USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "config",
            "docs": [
              "Protocol configuration parameters"
            ],
            "type": {
              "defined": {
                "name": "protocolConfig"
              }
            }
          }
        ]
      }
    },
    {
      "name": "protocolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "openingFeeBps",
            "docs": [
              "Fee parameters (in basis points)"
            ],
            "type": "u64"
          },
          {
            "name": "closingFeeBps",
            "type": "u64"
          },
          {
            "name": "liquidationFeeBps",
            "type": "u64"
          },
          {
            "name": "treasuryCutBps",
            "docs": [
              "Fee split parameters (in basis points)"
            ],
            "type": "u64"
          },
          {
            "name": "fundingCutBps",
            "type": "u64"
          },
          {
            "name": "maxFundingRateBps",
            "docs": [
              "Funding parameters"
            ],
            "type": "u64"
          },
          {
            "name": "fundingIntervalSeconds",
            "type": "i64"
          },
          {
            "name": "minCollateralRatioBps",
            "docs": [
              "Risk parameters"
            ],
            "type": "u64"
          },
          {
            "name": "liquidationThresholdBps",
            "type": "u64"
          },
          {
            "name": "minLiquidity",
            "docs": [
              "Liquidity parameters"
            ],
            "type": "u64"
          },
          {
            "name": "rebalanceRequestFeeLamports",
            "docs": [
              "Rebalance request fee in lamports (SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "basktCreationFeeLamports",
            "docs": [
              "Baskt creation fee in lamports (SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "docs": [
              "Metadata"
            ],
            "type": "i64"
          },
          {
            "name": "lastUpdatedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "protocolStateUpdatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocol",
            "type": "pubkey"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rebalanceFeeIndex",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cumulativeIndex",
            "docs": [
              "Cumulative rebalance fee index (monotonically increasing)",
              "Represents the total cumulative rebalance fee amount per unit position size",
              "Scaled by PRICE_PRECISION for precision"
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdateTimestamp",
            "docs": [
              "Timestamp of the last rebalance that updated this index"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rebalanceRequestEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rebalanceRequestFee",
            "type": "u64"
          },
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestWithdrawParams",
      "docs": [
        "Parameters for withdrawal request creation"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "role",
      "docs": [
        "Roles that can be assigned to accounts for access control"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "owner"
          },
          {
            "name": "assetManager"
          },
          {
            "name": "basktManager"
          },
          {
            "name": "rebalancer"
          },
          {
            "name": "matcher"
          },
          {
            "name": "liquidator"
          },
          {
            "name": "fundingManager"
          },
          {
            "name": "configManager"
          },
          {
            "name": "keeper"
          }
        ]
      }
    },
    {
      "name": "syntheticAsset",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ticker",
            "type": "string"
          },
          {
            "name": "permissions",
            "type": {
              "defined": {
                "name": "assetPermissions"
              }
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "listingTime",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updateBasktConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "openingFeeBps",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "closingFeeBps",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "liquidationFeeBps",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "minCollateralRatioBps",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "liquidationThresholdBps",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "updateFeatureFlagsParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowAddLiquidity",
            "type": "bool"
          },
          {
            "name": "allowRemoveLiquidity",
            "type": "bool"
          },
          {
            "name": "allowOpenPosition",
            "type": "bool"
          },
          {
            "name": "allowClosePosition",
            "type": "bool"
          },
          {
            "name": "allowPnlWithdrawal",
            "type": "bool"
          },
          {
            "name": "allowCollateralWithdrawal",
            "type": "bool"
          },
          {
            "name": "allowAddCollateral",
            "type": "bool"
          },
          {
            "name": "allowBasktCreation",
            "type": "bool"
          },
          {
            "name": "allowBasktUpdate",
            "type": "bool"
          },
          {
            "name": "allowTrading",
            "type": "bool"
          },
          {
            "name": "allowLiquidations",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "withdrawQueueProcessedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "provider",
            "type": "pubkey"
          },
          {
            "name": "lpTokensBurned",
            "type": "u64"
          },
          {
            "name": "amountPaidToUser",
            "type": "u64"
          },
          {
            "name": "feesCollected",
            "type": "u64"
          },
          {
            "name": "queueTailUpdated",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "withdrawRequest",
      "docs": [
        "Per-user withdrawal request queued when liquidity utilisation is high."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Sequential queue ID (monotonically increasing per pool)"
            ],
            "type": "u64"
          },
          {
            "name": "provider",
            "docs": [
              "Requester (LP owner)"
            ],
            "type": "pubkey"
          },
          {
            "name": "remainingLp",
            "docs": [
              "LP tokens locked in the request (may be partially fulfilled)"
            ],
            "type": "u64"
          },
          {
            "name": "providerUsdcAccount",
            "docs": [
              "Destination token account for payouts"
            ],
            "type": "pubkey"
          },
          {
            "name": "requestedTs",
            "docs": [
              "Timestamp when the request was created"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "withdrawalQueuedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "provider",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "lpTokensBurned",
            "type": "u64"
          },
          {
            "name": "withdrawalAmount",
            "type": "u64"
          },
          {
            "name": "queuePosition",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};

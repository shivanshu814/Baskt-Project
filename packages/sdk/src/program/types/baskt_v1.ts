/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/baskt_v1.json`.
 */
export type BasktV1 = {
  "address": "GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm",
  "metadata": {
    "name": "basktV1",
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
          "writable": true
        },
        {
          "name": "protocol",
          "docs": [
            "@dev Requires either baskt creator or OracleManager role to activate baskts"
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
          "docs": [
            "@dev Requires AssetManager role to add new assets"
          ],
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
          "docs": [
            "Protocol account for access control check"
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
          "name": "ownerToken",
          "writable": true
        },
        {
          "name": "escrowToken",
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
          "name": "registry",
          "docs": [
            "Protocol registry containing common addresses"
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
                  108,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
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
          ]
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
              },
              {
                "kind": "account",
                "path": "protocol"
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
          "name": "providerTokenAccount",
          "docs": [
            "The provider's token account to withdraw funds from"
          ],
          "writable": true
        },
        {
          "name": "tokenVault",
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
          "name": "treasuryTokenAccount",
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
          "name": "ownerToken",
          "writable": true
        },
        {
          "name": "escrowToken",
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
          "name": "positionOwner"
        },
        {
          "name": "fundingIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "position.baskt_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "baskt"
        },
        {
          "name": "registry",
          "docs": [
            "Protocol registry containing common addresses"
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
                  108,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol for permission checks"
          ]
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool (loaded from registry)"
          ],
          "writable": true
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account (loaded from registry)"
          ]
        },
        {
          "name": "escrowToken",
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
          "name": "poolAuthority"
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
          "writable": true
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
          "name": "systemProgram",
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
                "path": "orderId"
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
          "name": "ownerToken",
          "writable": true
        },
        {
          "name": "escrowMint"
        },
        {
          "name": "escrowToken",
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
          "name": "orderId",
          "type": "u64"
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
        }
      ]
    },
    {
      "name": "initializeFundingIndex",
      "discriminator": [
        150,
        223,
        168,
        231,
        205,
        101,
        166,
        21
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "@dev Requires Owner role to initialize funding indices"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "fundingIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "baskt"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account to initialize funding index for."
          ]
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
      "args": []
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
          "name": "payer",
          "docs": [
            "Payer for the rent fees",
            "TODO sidduHERE admin and payer should be the same"
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
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "lpMint",
          "docs": [
            "The mint that will be used for LP tokens",
            "TODO sidduHERE  need clarity on this. Who is creating this."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenVault",
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
          "name": "tokenMint",
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
        },
        {
          "name": "minDeposit",
          "type": "u64"
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
      "args": []
    },
    {
      "name": "initializeRegistry",
      "discriminator": [
        189,
        181,
        20,
        17,
        174,
        57,
        249,
        59
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Protocol owner who can initialize the registry"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account"
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
          "name": "registry",
          "docs": [
            "Registry PDA to initialize"
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
                  108,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account that receives fees"
          ]
        },
        {
          "name": "treasuryToken",
          "docs": [
            "Treasury token account for USDC"
          ]
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool account"
          ],
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
              },
              {
                "kind": "account",
                "path": "protocol"
              }
            ]
          }
        },
        {
          "name": "tokenVault",
          "docs": [
            "Token vault for the liquidity pool"
          ],
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
          "docs": [
            "Pool authority PDA"
          ],
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
          "name": "escrowMint",
          "docs": [
            "Escrow mint (USDC)"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
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
          "name": "positionOwner"
        },
        {
          "name": "fundingIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "position.baskt_id",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "baskt"
        },
        {
          "name": "registry",
          "docs": [
            "Protocol registry containing common addresses"
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
                  108,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol for permission checks"
          ]
        },
        {
          "name": "liquidityPool",
          "docs": [
            "Liquidity pool (loaded from registry)"
          ],
          "writable": true
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account (loaded from registry)"
          ]
        },
        {
          "name": "escrowToken",
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
          "name": "poolAuthority"
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
          "name": "fundingIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "order.baskt_id",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account that contains the embedded oracle for price validation"
          ]
        },
        {
          "name": "registry",
          "docs": [
            "Protocol registry containing common addresses"
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
                  108,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account for checking permissions",
            "@dev Requires Matcher role to open positions"
          ]
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
          "name": "escrowToken",
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
          "name": "escrowMint",
          "docs": [
            "Escrow mint (USDC) - validated via registry"
          ]
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
          "name": "rebalanceHistory",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101,
                  95,
                  104,
                  105,
                  115,
                  116,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "baskt.baskt_id",
                "account": "basktV1"
              },
              {
                "kind": "account",
                "path": "baskt.last_rebalance_index",
                "account": "basktV1"
              }
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "@dev Requires either baskt creator or Rebalancer role to rebalance"
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
        }
      ]
    },
    {
      "name": "removeLiquidity",
      "discriminator": [
        80,
        85,
        209,
        72,
        24,
        206,
        177,
        108
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
              },
              {
                "kind": "account",
                "path": "protocol"
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
          "name": "providerTokenAccount",
          "docs": [
            "The provider's token account to receive funds"
          ],
          "writable": true
        },
        {
          "name": "tokenVault",
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
            "The provider's LP token account to burn LP tokens from"
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
          "name": "treasuryTokenAccount",
          "docs": [
            "The treasury token account to receive fees",
            "/TODO sidduHERE where is the check for this"
          ],
          "writable": true
        },
        {
          "name": "treasury",
          "docs": [
            "TODO sidduHERE where is the check for this. We should be setting this during init"
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lpAmount",
          "type": "u64"
        },
        {
          "name": "minTokensOut",
          "type": "u64"
        }
      ]
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
      "name": "updateCustomOracle",
      "discriminator": [
        92,
        133,
        3,
        62,
        0,
        27,
        254,
        99
      ],
      "accounts": [
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "@dev Requires OracleManager role to update oracle prices"
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
          "name": "price",
          "type": "u64"
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
          "name": "fundingIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "baskt"
              }
            ]
          }
        },
        {
          "name": "baskt",
          "docs": [
            "Baskt account associated with the funding index. Used only for seed verification."
          ],
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
                "path": "baskt.baskt_id",
                "account": "basktV1"
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
    }
  ],
  "accounts": [
    {
      "name": "basktV1",
      "discriminator": [
        115,
        252,
        189,
        242,
        180,
        200,
        87,
        199
      ]
    },
    {
      "name": "fundingIndex",
      "discriminator": [
        205,
        206,
        185,
        89,
        105,
        187,
        167,
        31
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
      "name": "protocolRegistry",
      "discriminator": [
        54,
        93,
        199,
        192,
        39,
        46,
        204,
        190
      ]
    },
    {
      "name": "rebalanceHistory",
      "discriminator": [
        99,
        118,
        90,
        210,
        209,
        145,
        80,
        204
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
      "name": "registryInitializedEvent",
      "discriminator": [
        25,
        72,
        229,
        103,
        34,
        177,
        247,
        255
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
      "name": "invalidOracleAccount",
      "msg": "Invalid oracle account"
    },
    {
      "code": 6002,
      "name": "oraclePriceTooOld",
      "msg": "Oracle price is too old"
    },
    {
      "code": 6003,
      "name": "oraclePriceTooUncertain",
      "msg": "Oracle price has too much uncertainty"
    },
    {
      "code": 6004,
      "name": "insufficientCollateral",
      "msg": "Insufficient collateral for position"
    },
    {
      "code": 6005,
      "name": "positionNotLiquidatable",
      "msg": "Position is not liquidatable"
    },
    {
      "code": 6006,
      "name": "positionAlreadyClosed",
      "msg": "Position is already closed"
    },
    {
      "code": 6007,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in pool"
    },
    {
      "code": 6008,
      "name": "invalidBasktConfig",
      "msg": "Invalid baskt configuration"
    },
    {
      "code": 6009,
      "name": "invalidPositionSize",
      "msg": "Invalid position size"
    },
    {
      "code": 6010,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6011,
      "name": "unauthorizedRole",
      "msg": "Unauthorized: Missing required role for this operation"
    },
    {
      "code": 6012,
      "name": "unauthorizedTokenOwner",
      "msg": "Unauthorized: Token account owner mismatch"
    },
    {
      "code": 6013,
      "name": "invalidLpTokenAmount",
      "msg": "Invalid LP token amount"
    },
    {
      "code": 6014,
      "name": "unsupportedOracle",
      "msg": "Unsupported oracle type"
    },
    {
      "code": 6015,
      "name": "staleOraclePrice",
      "msg": "Stale oracle price"
    },
    {
      "code": 6016,
      "name": "invalidOraclePrice",
      "msg": "Invalid oracle price"
    },
    {
      "code": 6017,
      "name": "priceOutOfBounds",
      "msg": "Submitted price is outside acceptable deviation bounds from oracle price"
    },
    {
      "code": 6018,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for operation"
    },
    {
      "code": 6019,
      "name": "invalidBasktName",
      "msg": "Invalid baskt name"
    },
    {
      "code": 6020,
      "name": "basktInactive",
      "msg": "Baskt is inactive"
    },
    {
      "code": 6021,
      "name": "roleNotFound",
      "msg": "Role not found for the account"
    },
    {
      "code": 6022,
      "name": "missingRequiredRole",
      "msg": "Missing required role for this operation"
    },
    {
      "code": 6023,
      "name": "unauthorizedSigner",
      "msg": "Unauthorized signer for this operation"
    },
    {
      "code": 6024,
      "name": "invalidRoleType",
      "msg": "Invalid role type"
    },
    {
      "code": 6025,
      "name": "invalidRemainingAccounts",
      "msg": "Invalid remaining accounts"
    },
    {
      "code": 6026,
      "name": "invalidAssetAccount",
      "msg": "Invalid asset account"
    },
    {
      "code": 6027,
      "name": "longPositionsDisabled",
      "msg": "Long positions are disabled for this asset"
    },
    {
      "code": 6028,
      "name": "shortPositionsDisabled",
      "msg": "Short positions are disabled for this asset"
    },
    {
      "code": 6029,
      "name": "invalidOrStaleOraclePrice",
      "msg": "Invalid or stale oracle price"
    },
    {
      "code": 6030,
      "name": "assetNotInBaskt",
      "msg": "Asset not in baskt"
    },
    {
      "code": 6031,
      "name": "invalidAssetConfig",
      "msg": "Invalid asset config"
    },
    {
      "code": 6032,
      "name": "featureDisabled",
      "msg": "Feature is currently disabled"
    },
    {
      "code": 6033,
      "name": "tradingDisabled",
      "msg": "Trading operations are currently disabled"
    },
    {
      "code": 6034,
      "name": "liquidityOperationsDisabled",
      "msg": "Liquidity pool operations are currently disabled"
    },
    {
      "code": 6035,
      "name": "positionOperationsDisabled",
      "msg": "Position operations are currently disabled"
    },
    {
      "code": 6036,
      "name": "basktOperationsDisabled",
      "msg": "Baskt management operations are currently disabled"
    },
    {
      "code": 6037,
      "name": "inactiveAsset",
      "msg": "Asset Not Active"
    },
    {
      "code": 6038,
      "name": "basktAlreadyActive",
      "msg": "Baskt Already Active"
    },
    {
      "code": 6039,
      "name": "invalidAssetWeights",
      "msg": "Invalid asset weights"
    },
    {
      "code": 6040,
      "name": "invalidOracleParameter",
      "msg": "Invalid oracle parameter"
    },
    {
      "code": 6041,
      "name": "orderAlreadyProcessed",
      "msg": "Order already processed"
    },
    {
      "code": 6042,
      "name": "invalidEscrowAccount",
      "msg": "Invalid escrow account"
    },
    {
      "code": 6043,
      "name": "invalidProgramAuthority",
      "msg": "Invalid program authority"
    },
    {
      "code": 6044,
      "name": "tokenHasDelegate",
      "msg": "Token has delegate"
    },
    {
      "code": 6045,
      "name": "tokenHasCloseAuthority",
      "msg": "Token has close authority"
    },
    {
      "code": 6046,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6047,
      "name": "zeroSizedPosition",
      "msg": "Zero sized position"
    },
    {
      "code": 6048,
      "name": "invalidTargetPosition",
      "msg": "Invalid target position"
    },
    {
      "code": 6049,
      "name": "invalidBaskt",
      "msg": "Invalid baskt"
    },
    {
      "code": 6050,
      "name": "invalidOrderAction",
      "msg": "Invalid order action"
    },
    {
      "code": 6051,
      "name": "fundingNotUpToDate",
      "msg": "Funding not up to date"
    },
    {
      "code": 6052,
      "name": "positionStillOpen",
      "msg": "Position still open"
    },
    {
      "code": 6053,
      "name": "invalidTreasuryAccount",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6054,
      "name": "collateralOverflow",
      "msg": "Collateral amount would overflow maximum value"
    },
    {
      "code": 6055,
      "name": "depositsDisabled",
      "msg": "Liquidity pool deposits are currently disabled"
    },
    {
      "code": 6056,
      "name": "withdrawalsDisabled",
      "msg": "Liquidity pool withdrawals are currently disabled"
    },
    {
      "code": 6057,
      "name": "belowMinimumDeposit",
      "msg": "Deposit amount is below the minimum"
    },
    {
      "code": 6058,
      "name": "divisionByZero",
      "msg": "Division by zero"
    },
    {
      "code": 6059,
      "name": "invalidLiquidityPool",
      "msg": "Invalid liquidity pool account"
    },
    {
      "code": 6060,
      "name": "invalidTokenVault",
      "msg": "Invalid token vault account"
    },
    {
      "code": 6061,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6062,
      "name": "invalidFeeBps",
      "msg": "Invalid fee basis points"
    },
    {
      "code": 6063,
      "name": "fundingRateExceedsMaximum",
      "msg": "Funding rate exceeds maximum allowed"
    },
    {
      "code": 6064,
      "name": "invalidPoolAuthority",
      "msg": "Invalid pool authority account"
    },
    {
      "code": 6065,
      "name": "invalidAccountInput",
      "msg": "Invalid account input"
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
      "name": "activateBasktParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "prices",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "maxPriceAgeSec",
            "type": "u32"
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
        "Permissions for the asset"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowLongs",
            "type": "bool"
          },
          {
            "name": "allowShorts",
            "type": "bool"
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
      "name": "basktCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "basktName",
            "type": "string"
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
      "name": "basktV1",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "basktId",
            "type": "pubkey"
          },
          {
            "name": "basktName",
            "type": "string"
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
            "name": "creationTime",
            "type": "i64"
          },
          {
            "name": "lastRebalanceIndex",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "lastRebalanceTime",
            "type": "i64"
          },
          {
            "name": "oracle",
            "type": {
              "defined": {
                "name": "oracleParams"
              }
            }
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
            "name": "extraSpace",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
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
            "name": "basktName",
            "type": "string"
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
      "name": "fundingIndex",
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
            "name": "lastUpdateTimestamp",
            "type": "i64"
          },
          {
            "name": "currentRate",
            "type": "i64"
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
                128
              ]
            }
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
            "name": "tokenVault",
            "docs": [
              "The token account where collateral is stored"
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
            "name": "minDeposit",
            "docs": [
              "Minimum deposit amount allowed"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for this PDA"
            ],
            "type": "u8"
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
            "name": "tokenVault",
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
            "name": "minDeposit",
            "type": "u64"
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
      "name": "openPositionParams",
      "docs": [
        "Parameters for opening a position"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "positionId",
            "type": "u64"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oracleParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "maxPriceAgeSec",
            "type": "u32"
          },
          {
            "name": "publishTime",
            "type": "i64"
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
            "name": "action",
            "type": {
              "defined": {
                "name": "orderAction"
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
            "type": "i64"
          },
          {
            "name": "targetPosition",
            "type": {
              "option": "pubkey"
            }
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
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "orderAction",
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
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
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
            "name": "exitPrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "entryFundingIndex",
            "type": "i128"
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
            "name": "status",
            "type": {
              "defined": {
                "name": "positionStatus"
              }
            }
          },
          {
            "name": "timestampOpen",
            "type": "i64"
          },
          {
            "name": "timestampClose",
            "type": {
              "option": "i64"
            }
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
                128
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
            "name": "exitPrice",
            "type": "u64"
          },
          {
            "name": "pnl",
            "type": "i64"
          },
          {
            "name": "feeAmount",
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
            "name": "timestamp",
            "type": "i64"
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
            "name": "size",
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
            "name": "liquidationFee",
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
            "name": "entryFundingIndex",
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
      "name": "positionStatus",
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
        "* REVIEW: I will need a permissions struct which can be used to turn of certain features of the system\n * It should track all the assets that we have in the system.\n * it should keep track of all the fees we are charging and what not\n * it should keep track of min liqudiation margins\n * it should keep track of fee splits\n * it should keep track of owner and be able to transfer ownership\n * it should keep track of protocol level stats maybe? fees, trading, volume, total baskts, total assets"
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
          }
        ]
      }
    },
    {
      "name": "protocolRegistry",
      "docs": [
        "Central registry for commonly used protocol addresses"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocol",
            "docs": [
              "Protocol account reference"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Treasury account that receives fees"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasuryToken",
            "docs": [
              "Treasury token account for USDC"
            ],
            "type": "pubkey"
          },
          {
            "name": "liquidityPool",
            "docs": [
              "Main liquidity pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenVault",
            "docs": [
              "Token vault for the liquidity pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "poolAuthority",
            "docs": [
              "Pool authority PDA"
            ],
            "type": "pubkey"
          },
          {
            "name": "poolAuthorityBump",
            "docs": [
              "Pool authority bump"
            ],
            "type": "u8"
          },
          {
            "name": "programAuthority",
            "docs": [
              "Program authority PDA"
            ],
            "type": "pubkey"
          },
          {
            "name": "programAuthorityBump",
            "docs": [
              "Program authority bump"
            ],
            "type": "u8"
          },
          {
            "name": "escrowMint",
            "docs": [
              "Escrow mint (USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Registry bump"
            ],
            "type": "u8"
          },
          {
            "name": "extraSpace",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "rebalanceHistory",
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
      "name": "registryInitializedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registry",
            "type": "pubkey"
          },
          {
            "name": "protocol",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "treasuryToken",
            "type": "pubkey"
          },
          {
            "name": "liquidityPool",
            "type": "pubkey"
          },
          {
            "name": "tokenVault",
            "type": "pubkey"
          },
          {
            "name": "poolAuthority",
            "type": "pubkey"
          },
          {
            "name": "programAuthority",
            "type": "pubkey"
          },
          {
            "name": "escrowMint",
            "type": "pubkey"
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
            "name": "oracleManager"
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
            "name": "treasury"
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
            "name": "assetId",
            "type": "pubkey"
          },
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
            "type": "i64"
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
    }
  ]
};

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/baskt_v1.json`.
 */
export type BasktV1 = {
  "address": "G4MVhTKu6LGJZ7ZepYA8JonEVVCfH2wuvrJ42MwEthzu",
  "metadata": {
    "name": "basktV1",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
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
          "writable": true
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
          "name": "trader",
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "liquidityPool",
          "writable": true
        },
        {
          "name": "asset",
          "writable": true
        },
        {
          "name": "oracle"
        }
      ],
      "args": []
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
          "name": "creator",
          "writable": true,
          "signer": true
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
                "kind": "arg",
                "path": "basktName"
              }
            ]
          }
        },
        {
          "name": "protocol",
          "docs": [
            "Protocol account to check feature flags"
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
              "name": "createBasktParams"
            }
          }
        }
      ]
    },
    {
      "name": "depositLiquidity",
      "discriminator": [
        245,
        99,
        59,
        25,
        151,
        71,
        233,
        249
      ],
      "accounts": [
        {
          "name": "lp",
          "writable": true,
          "signer": true
        },
        {
          "name": "liquidityPool",
          "writable": true
        },
        {
          "name": "lpDeposit",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lp"
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "getAssetPrice",
      "discriminator": [
        140,
        176,
        162,
        223,
        172,
        213,
        120,
        181
      ],
      "accounts": [
        {
          "name": "asset"
        },
        {
          "name": "oracle"
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "oraclePrice"
        }
      }
    },
    {
      "name": "getBasktNav",
      "discriminator": [
        163,
        138,
        228,
        250,
        83,
        35,
        149,
        140
      ],
      "accounts": [
        {
          "name": "baskt"
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "initializeCustomOracle",
      "discriminator": [
        104,
        55,
        48,
        197,
        116,
        245,
        87,
        103
      ],
      "accounts": [
        {
          "name": "oracle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "instruction_params.oracle_name"
              }
            ]
          }
        },
        {
          "name": "authority",
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
              "name": "customOracleInstructionParams"
            }
          }
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
          "name": "payer",
          "writable": true,
          "signer": true
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
          "writable": true
        },
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "liquidityPool",
          "writable": true
        },
        {
          "name": "asset",
          "writable": true
        },
        {
          "name": "oracle"
        }
      ],
      "args": []
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
          "name": "trader",
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "signer": true
        },
        {
          "name": "baskt",
          "writable": true
        },
        {
          "name": "liquidityPool",
          "writable": true
        },
        {
          "name": "asset",
          "writable": true
        },
        {
          "name": "oracle"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
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
                "account": "baskt"
              },
              {
                "kind": "account",
                "path": "baskt.last_rebalance_index",
                "account": "baskt"
              }
            ]
          }
        },
        {
          "name": "payer",
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
          "name": "assetParams",
          "type": {
            "vec": {
              "defined": {
                "name": "assetParams"
              }
            }
          }
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
          "writable": true
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
          "name": "oracle",
          "writable": true
        },
        {
          "name": "authority",
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
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "customOracleUpdateInstructionParams"
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
          "writable": true,
          "signer": true
        },
        {
          "name": "protocol",
          "writable": true
        }
      ],
      "args": [
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
    },
    {
      "name": "withdrawLiquidity",
      "discriminator": [
        149,
        158,
        33,
        185,
        47,
        243,
        253,
        31
      ],
      "accounts": [
        {
          "name": "lp",
          "writable": true,
          "signer": true
        },
        {
          "name": "liquidityPool",
          "writable": true
        },
        {
          "name": "lpDeposit",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lp"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "lpTokens",
          "type": "u64"
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
      "name": "customOracle",
      "discriminator": [
        227,
        170,
        164,
        218,
        127,
        16,
        35,
        223
      ]
    },
    {
      "name": "lpDepositAccount",
      "discriminator": [
        204,
        34,
        235,
        131,
        66,
        197,
        223,
        65
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
      "name": "invalidLpTokenAmount",
      "msg": "Invalid LP token amount"
    },
    {
      "code": 6012,
      "name": "unsupportedOracle",
      "msg": "Unsupported oracle type"
    },
    {
      "code": 6013,
      "name": "staleOraclePrice",
      "msg": "Stale oracle price"
    },
    {
      "code": 6014,
      "name": "invalidOraclePrice",
      "msg": "Invalid oracle price"
    },
    {
      "code": 6015,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for operation"
    },
    {
      "code": 6016,
      "name": "invalidBasktName",
      "msg": "Invalid baskt name"
    },
    {
      "code": 6017,
      "name": "basktInactive",
      "msg": "Baskt is inactive"
    },
    {
      "code": 6018,
      "name": "roleNotFound",
      "msg": "Role not found for the account"
    },
    {
      "code": 6019,
      "name": "missingRequiredRole",
      "msg": "Missing required role for this operation"
    },
    {
      "code": 6020,
      "name": "unauthorizedSigner",
      "msg": "Unauthorized signer for this operation"
    },
    {
      "code": 6021,
      "name": "invalidRoleType",
      "msg": "Invalid role type"
    },
    {
      "code": 6022,
      "name": "invalidRemainingAccounts",
      "msg": "Invalid remaining accounts"
    },
    {
      "code": 6023,
      "name": "invalidAssetAccount",
      "msg": "Invalid asset account"
    },
    {
      "code": 6024,
      "name": "longPositionsDisabled",
      "msg": "Long positions are disabled for this asset"
    },
    {
      "code": 6025,
      "name": "shortPositionsDisabled",
      "msg": "Short positions are disabled for this asset"
    },
    {
      "code": 6026,
      "name": "invalidOrStaleOraclePrice",
      "msg": "Invalid or stale oracle price"
    },
    {
      "code": 6027,
      "name": "assetNotInBaskt",
      "msg": "Asset not in baskt"
    },
    {
      "code": 6028,
      "name": "invalidAssetConfig",
      "msg": "Invalid asset config"
    },
    {
      "code": 6029,
      "name": "featureDisabled",
      "msg": "Feature is currently disabled"
    },
    {
      "code": 6030,
      "name": "priceNotFound",
      "msg": "Price not found"
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
      "name": "addAssetParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ticker",
            "type": "string"
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
            "name": "permissions",
            "type": {
              "defined": {
                "name": "assetPermissions"
              }
            }
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
      "name": "assetParams",
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
      "name": "baskt",
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
            "name": "totalPositions",
            "type": "u64"
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
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalFees",
            "type": "u64"
          },
          {
            "name": "baselineNav",
            "type": "u64"
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
                  "name": "assetParams"
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
      "name": "customOracle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "expo",
            "type": "i32"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "ema",
            "type": "u64"
          },
          {
            "name": "publishTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "customOracleInstructionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "expo",
            "type": "i32"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "ema",
            "type": "u64"
          },
          {
            "name": "publishTime",
            "type": "i64"
          },
          {
            "name": "oracleName",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "customOracleUpdateInstructionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "ema",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "depositEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositedUsdc",
            "type": "u64"
          },
          {
            "name": "lpTokens",
            "type": "u64"
          },
          {
            "name": "totalUsdcInPool",
            "type": "u64"
          },
          {
            "name": "lpTokenSupply",
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
      "name": "feesStats",
      "docs": [
        "Statistics related to fees"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "openPositionUsd",
            "type": "u64"
          },
          {
            "name": "closePositionUsd",
            "type": "u64"
          },
          {
            "name": "liquidationUsd",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "lpDepositAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "deposits",
            "type": {
              "vec": {
                "defined": {
                  "name": "depositEntry"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "liquidityPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalUsdc",
            "type": "u64"
          },
          {
            "name": "openInterest",
            "type": "u64"
          },
          {
            "name": "lpTokenSupply",
            "type": "u64"
          },
          {
            "name": "liquidationFees",
            "type": "u64"
          },
          {
            "name": "fundingFees",
            "type": "u64"
          },
          {
            "name": "openingFees",
            "type": "u64"
          },
          {
            "name": "closingFees",
            "type": "u64"
          },
          {
            "name": "lastUpdateTime",
            "type": "i64"
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
            "name": "oracleAccount",
            "type": "pubkey"
          },
          {
            "name": "priceFeedId",
            "type": "string"
          },
          {
            "name": "oracleType",
            "type": {
              "defined": {
                "name": "oracleType"
              }
            }
          },
          {
            "name": "maxPriceError",
            "type": "u64"
          },
          {
            "name": "maxPriceAgeSec",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "oraclePrice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i32"
          }
        ]
      }
    },
    {
      "name": "oracleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "custom"
          },
          {
            "name": "pyth"
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
            "name": "closePrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "fundingAccumulated",
            "type": "i64"
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
            "name": "openingFee",
            "type": "u64"
          },
          {
            "name": "closingFee",
            "type": "u64"
          },
          {
            "name": "borrowingFee",
            "type": "u64"
          },
          {
            "name": "pnl",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "fundingFee",
            "type": "i64"
          },
          {
            "name": "liquidationFee",
            "type": "u64"
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
            "name": "oracle",
            "type": {
              "defined": {
                "name": "oracleParams"
              }
            }
          },
          {
            "name": "openInterestLong",
            "type": "u64"
          },
          {
            "name": "openInterestShort",
            "type": "u64"
          },
          {
            "name": "lastFundingUpdate",
            "type": "i64"
          },
          {
            "name": "fundingRate",
            "type": "i64"
          },
          {
            "name": "totalFundingLong",
            "type": "i64"
          },
          {
            "name": "totalFundingShort",
            "type": "i64"
          },
          {
            "name": "volumeStats",
            "type": {
              "defined": {
                "name": "volumeStats"
              }
            }
          },
          {
            "name": "feesStats",
            "type": {
              "defined": {
                "name": "feesStats"
              }
            }
          },
          {
            "name": "permissions",
            "type": {
              "defined": {
                "name": "assetPermissions"
              }
            }
          }
        ]
      }
    },
    {
      "name": "volumeStats",
      "docs": [
        "Statistics related to volume"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "openPositionUsd",
            "type": "u64"
          },
          {
            "name": "closePositionUsd",
            "type": "u64"
          },
          {
            "name": "liquidationUsd",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

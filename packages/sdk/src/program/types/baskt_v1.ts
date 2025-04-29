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
          "name": "baskt",
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
    },
    {
      "code": 6031,
      "name": "inactiveAsset",
      "msg": "Asset Not Active"
    },
    {
      "code": 6032,
      "name": "basktAlreadyActive",
      "msg": "Baskt Already Active"
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
    }
  ]
};

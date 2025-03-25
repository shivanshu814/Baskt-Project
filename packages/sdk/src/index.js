"use strict";
/**
 * Baskt SDK
 *
 * This SDK provides a client for interacting with the Baskt protocol on Solana.
 * It imports the IDL and types from the program package and exposes helper functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleType = exports.OracleHelper = exports.BaseClient = exports.BasktClient = void 0;
// Export the clients
var client_1 = require("./client");
Object.defineProperty(exports, "BasktClient", { enumerable: true, get: function () { return client_1.BasktClient; } });
var base_client_1 = require("./base-client");
Object.defineProperty(exports, "BaseClient", { enumerable: true, get: function () { return base_client_1.BaseClient; } });
// Export utility modules
var oracle_helper_1 = require("./utils/oracle-helper");
Object.defineProperty(exports, "OracleHelper", { enumerable: true, get: function () { return oracle_helper_1.OracleHelper; } });
Object.defineProperty(exports, "OracleType", { enumerable: true, get: function () { return oracle_helper_1.OracleType; } });

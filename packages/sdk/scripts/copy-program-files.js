// Copy the program IDL to the SDK
const fs = require('fs');
const path = require('path');

const programIdlPath = path.join(__dirname, '../../program/target/idl/baskt_v1.json');

// Copy the IDL to the SDK
const sdkIdlPath = path.join(__dirname, '../src/program/idl/baskt_v1.json');
fs.copyFileSync(programIdlPath, sdkIdlPath);

console.log('Program IDL copied to SDK');


// Copy the types to the SDK
const programTypesPath = path.join(__dirname, '../../program/target/types/baskt_v1.ts');
const sdkTypesPath = path.join(__dirname, '../src/program/types/baskt_v1.ts');
fs.copyFileSync(programTypesPath, sdkTypesPath);

console.log('Program types copied to SDK');

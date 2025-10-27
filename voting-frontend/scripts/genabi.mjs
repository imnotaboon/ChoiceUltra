import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACTS = ["FHECounter", "FHEVoting"];
const rel = "../fhevm-hardhat-template";
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

const dir = path.resolve(rel);
const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") return;
  try {
    execSync(`./deploy-hardhat-node.sh`, { cwd: path.resolve("./scripts"), stdio: "inherit" });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    deployOnHardhatNode();
  }
  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) process.exit(1);
    return undefined;
  }
  const jsonString = fs.readFileSync(path.join(chainDeploymentDir, `${contractName}.json`), "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

for (const CONTRACT_NAME of CONTRACTS) {
  const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false);
  let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
  if (!deploySepolia) {
    deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
  }
  if (deployLocalhost && deploySepolia) {
    if (JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)) {
      process.exit(1);
    }
  }

  const tsCode = `
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
`;
  const tsAddresses = `
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
}



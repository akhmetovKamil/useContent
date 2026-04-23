import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function deployMockErc20(ethers: {
  getContractFactoryFromArtifact: (artifact: unknown) => Promise<{
    deploy: (...args: unknown[]) => Promise<unknown>;
  }>;
}) {
  const artifactPath = resolve(
    import.meta.dirname,
    "../../cache/test-artifacts/test/mocks/MockERC20.sol/MockERC20.json",
  );
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const factory = await ethers.getContractFactoryFromArtifact(artifact);
  return factory.deploy();
}

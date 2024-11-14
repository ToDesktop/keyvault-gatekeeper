import { basename } from "path";
import os from "os";
import { join } from "path";
import { getKeyVaultCredentials } from "../keyVault/keyVaultCredentials.js";
import { ParsedOptions } from "../start.js";

export async function signFile(
	filePath: string,
	options: ParsedOptions,
): Promise<string> {
	if (process.platform === "win32") {
		if (!options.windowsCert) {
			throw new Error("Windows certificate is not defined");
		}
		return windowsSign(filePath, options.windowsCert);
	}
	// Only Windows is supported for now.
	throw new Error("Unsupported platform");
}

// TODO: Support Azure Trusted Signing (TD-2775)
export async function windowsSign(
	filePath: string,
	certName: string,
): Promise<string> {
	const { execa } = await import("execa");
	const { default: slash } = await import("slash");

	const credentials = getKeyVaultCredentials();
	const shellCompatiblePath = slash(filePath);
	const hrstart = process.hrtime();

	try {
		// TODO: would be nice to do this in JS instead of relying on `azuresigntool`
		await execa(
			"azuresigntool",
			[
				"sign",
				shellCompatiblePath,
				"--file-digest",
				"sha256",
				"--timestamp-rfc3161",
				"http://timestamp.digicert.com",
				"--timestamp-digest",
				"sha256",
				"--azure-key-vault-url",
				credentials.url,
				"--azure-key-vault-client-id",
				credentials.id,
				"--azure-key-vault-client-secret",
				credentials.secret,
				"--azure-key-vault-certificate",
				certName,
				"--azure-key-vault-tenant-id",
				credentials.tenantId,
				"--verbose",
			],
			{
				cwd: __dirname,
				env: {
					// add ~/.dotnet/tools to PATH
					PATH: [process.env.PATH, join(os.homedir(), ".dotnet", "tools")].join(
						";",
					),
				},
			},
		);
	} catch (err) {
		const errorMessage = (err instanceof Error ? err.message : String(err))
			.replace(credentials.secret, "***")
			.replace(credentials.url, "***")
			.replace(credentials.id, "***");

		console.error("azuresigntool error", errorMessage);
		throw new Error("Failed to codesign the Windows build");
	}

	const [secs, nanosecs] = process.hrtime(hrstart);
	console.debug(
		`Signed in ${secs}s ${nanosecs / 1000000}ms: ${basename(
			shellCompatiblePath,
		)}`,
	);
	return filePath;
}

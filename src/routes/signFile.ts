import { basename } from "path";
import { execa } from "execa";
import os from "os";
import { join } from "path";
import slash from "slash";
import { file } from "tmp-promise";
import { getKeyVaultCredentials } from "../keyVault/keyVaultCredentials.js";
import { writeFile } from "fs/promises";
import { ParsedOptions } from "../start.js";

type SignResult = {
	path: string;
	cleanup: () => Promise<void>;
};

export async function signFile(
	fileName: string,
	content: Buffer,
	options: ParsedOptions,
): Promise<SignResult> {
	if (process.platform === "win32") {
		if (!options.windowsCert) {
			throw new Error("Windows certificate is not defined");
		}
		return windowsSign(fileName, content, options.windowsCert);
	}
	// return writeFileToTmp(content);
	// Only Windows is supported for now.
	throw new Error("Unsupported platform");
}

async function writeFileToTmp(content: Buffer): Promise<SignResult> {
	const { path, cleanup } = await file();
	await writeFile(path, content);
	return { path, cleanup };
}

export async function windowsSign(
	fileName: string,
	content: Buffer,
	certName: string,
): Promise<SignResult> {
	// TODO: Support Azure Trusted Signing (TD-2775)
	const credentials = getKeyVaultCredentials();
	const { path, cleanup } = await writeFileToTmp(content);
	const shellCompatiblePath = slash(path);
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
		await cleanup();
		throw new Error("Failed to codesign the Windows build");
	}

	const [secs, nanosecs] = process.hrtime(hrstart);
	console.debug(
		`Signed in ${secs}s ${nanosecs / 1000000}ms: ${basename(
			shellCompatiblePath,
		)}`,
	);
	return {
		path,
		cleanup,
	};
}

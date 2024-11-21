import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { file as tmpFile } from "tmp-promise";
import { getKeyVaultCredentials } from "./keyVaultCredentials.js";
import { writeFile } from "fs/promises";

export interface HsmSecretFile {
	secretFilePath: string;
	cleanup: () => Promise<void>;
}

export function getSecretClient() {
	const credentials = getKeyVaultCredentials();

	const clientSecretCredential = new ClientSecretCredential(
		credentials.tenantId,
		credentials.id,
		credentials.secret,
	);

	return new SecretClient(credentials.url, clientSecretCredential);
}

export interface HsmCertificateFile {
	secretFilePath: string;
	cleanup: () => Promise<void>;
}

export async function downloadCertificateFile(
	secretName: string | undefined,
): Promise<Buffer> {
	if (!secretName) {
		throw new Error("No secret name provided");
	}
	const secretClient = getSecretClient();

	const secret = await secretClient.getSecret(secretName);

	const base64EncodedSecret = secret.value;
	if (!base64EncodedSecret) {
		throw new Error(`No certificate found for ${secretName}`);
	}
	const pfxBuffer = Buffer.from(base64EncodedSecret, "base64");

	return pfxBuffer;
}

export async function getSecret(secretName: string): Promise<string> {
	const secretClient = getSecretClient();
	const secret = await secretClient.getSecret(secretName);
	if (!secret.value) {
		throw new Error(`No secret found for ${secretName}`);
	}
	return secret.value;
}

export async function downloadSecretFileFromHsm(
	secretName: string,
	{ postfix }: { postfix?: string },
): Promise<HsmSecretFile> {
	const base64EncodedSecret = await getSecret(secretName);
	if (!base64EncodedSecret) {
		throw new Error(`No certificate found for ${secretName}`);
	}
	const pfxBuffer = Buffer.from(base64EncodedSecret, "base64");

	const { path: tmpFilePath, cleanup } = await tmpFile({ postfix });
	console.info(`Writing secret to ${tmpFilePath}`);
	await writeFile(tmpFilePath, pfxBuffer);

	return {
		secretFilePath: tmpFilePath,
		async cleanup() {
			await cleanup();
			console.info(`Secret file for ${secretName} deleted`);
		},
	};
}

import axios, { AxiosError } from "axios";
import { NotaryOutput } from "../routes/getNotarizationCredentials.js";
export type { NotaryOutput };

export async function getSecret(
	secretName: string,
): Promise<{ secretValue: string }> {
	const response = await axios.post<{ secretValue: string }>(
		"http://localhost:3292/getSecret",
		{
			secretName,
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	if (typeof response.data?.secretValue !== "string") {
		throw new Error("Invalid secret response");
	}
	return response.data;
}

export async function getCertBase64(
	certType:
		| "mac"
		| "windows"
		| "macInstaller"
		| "masDevelopment"
		| "masDistribution"
		| "masInstaller",
): Promise<string> {
	const response = await axios.post("http://localhost:3292/getCert", {
		certType,
	});
	if (typeof response.data !== "string") {
		throw new Error("Invalid certificate response");
	}
	return response.data;
}

export async function getNotarizationCredentials(): Promise<NotaryOutput> {
	const response = await axios.post(
		"http://localhost:3292/getNotarizationCredentials",
		{},
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	return response.data as NotaryOutput;
}

export async function signFile(filePath: string): Promise<string> {
	try {
		const response = await axios.post<{ signedFile: string }>(
			"http://localhost:3292/signFile",
			{
				filePath,
			},
		);
		return response.data.signedFile;
	} catch (error) {
		if (error instanceof AxiosError) {
			error.message = `Failed to sign file: ${error.response?.data} (path: ${filePath})`;
		}
		throw error;
	}
}

export async function getAzureTrustedClientSigningSecret(): Promise<string> {
	const response = await axios.post<{ secretValue: string }>(
		"http://localhost:3292/getAzureTrustedClientSigningSecret",
	);
	return response.data.secretValue;
}

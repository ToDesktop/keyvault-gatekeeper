import axios, { AxiosError } from "axios";
import { NotaryOutput } from "../routes/getNotarizationCredentials.js";
import FormData from "form-data";
import { createReadStream, createWriteStream } from "fs";
import { Stream } from "stream";

export { NotaryOutput } from "../routes/getNotarizationCredentials.js";

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

export async function signFile(pathToFile: string): Promise<string> {
	const formData = new FormData();
	formData.append("file", createReadStream(pathToFile));
	try {
		const response = await axios.post<Stream>(
			"http://localhost:3292/signFile",
			formData,
			{
				headers: formData.getHeaders(),
				responseType: "stream",
			},
		);

		const writer = createWriteStream(pathToFile);
		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on("finish", () => resolve(pathToFile));
			writer.on("error", reject);
		});
	} catch (error) {
		if (error instanceof AxiosError) {
			throw new Error(
				`Failed to sign file: ${pathToFile} (${error.response?.status}, ${error.response?.statusText})`,
			);
		}
		throw error;
	}
}

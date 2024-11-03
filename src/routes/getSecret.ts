import { getSecret } from "../keyVault/secretClient.js";

export async function getSecretHandler(
	secretName: string,
	secrets: Record<string, string>,
) {
	const azureObjectName = secrets[secretName];
	if (azureObjectName) {
		return await getSecret(azureObjectName);
	}
}

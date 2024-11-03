import { z } from "zod";

const keyVaultCredentialsSchema = z.object({
	url: z.string(),
	id: z.string(),
	secret: z.string(),
	tenantId: z.string(),
});

type KeyVaultCredentials = z.infer<typeof keyVaultCredentialsSchema>;

function parseKeyVaultCredentials(
	maybeCredentials: unknown,
): KeyVaultCredentials {
	if (typeof maybeCredentials !== "string") {
		throw new Error("Invalid credentials format");
	}

	let parsed: KeyVaultCredentials;
	try {
		parsed = JSON.parse(atob(maybeCredentials)) as KeyVaultCredentials;
	} catch {
		throw new Error("Invalid base64 or JSON format");
	}

	return keyVaultCredentialsSchema.parse(parsed);
}

export function getKeyVaultCredentials(): KeyVaultCredentials {
	const { AZURE_KEY_VAULT_CREDENTIALS } = process.env;

	if (!AZURE_KEY_VAULT_CREDENTIALS) {
		throw new Error("AZURE_KEY_VAULT_CREDENTIALS is not set");
	}

	return parseKeyVaultCredentials(AZURE_KEY_VAULT_CREDENTIALS);
}

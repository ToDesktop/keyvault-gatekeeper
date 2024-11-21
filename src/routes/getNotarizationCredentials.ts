import type {
	NotaryToolApiKeyCredentials,
	NotaryToolPasswordCredentials,
} from "@electron/notarize/lib/types.d.ts";
import {
	downloadSecretFileFromHsm,
	getSecret,
} from "../keyVault/secretClient.js";
import { z } from "zod";

export const notaryToolPasswordCredentialsSchema = z.object({
	appleId: z.string(),
	teamId: z.string(),
	appSpecificPassword$: z.string(),
});

export const notaryToolApiKeyCredentialsSchema = z.object({
	appleApiKey$: z.string(),
	appleApiKeyId: z.string(),
	appleApiIssuer: z.string(),
});

export type NotaryInput =
	| z.infer<typeof notaryToolPasswordCredentialsSchema>
	| z.infer<typeof notaryToolApiKeyCredentialsSchema>;

export type NotaryOutput =
	| NotaryToolPasswordCredentials
	| NotaryToolApiKeyCredentials;

export async function getNotarizationSecretsFromHSM(
	credentialsWithoutSecret: NotaryInput,
): Promise<NotaryOutput> {
	if ("appSpecificPassword$" in credentialsWithoutSecret) {
		const appSpecificPassword = await getSecret(
			credentialsWithoutSecret.appSpecificPassword$,
		);
		return {
			...credentialsWithoutSecret,
			appleIdPassword: appSpecificPassword,
		};
	} else if ("appleApiKey$" in credentialsWithoutSecret) {
		const { secretFilePath } = await downloadSecretFileFromHsm(
			credentialsWithoutSecret.appleApiKey$,
			{ postfix: ".p8" },
		);
		return {
			...credentialsWithoutSecret,
			appleApiKey: secretFilePath,
		};
	} else {
		throw new Error("Invalid credentials");
	}
}

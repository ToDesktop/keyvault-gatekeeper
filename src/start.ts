import { Command } from "@commander-js/extra-typings";
import { createServer } from "./server.js";
import { notaryToolPasswordCredentialsSchema } from "./routes/getNotarizationCredentials.js";
import { formatMaybeZodError } from "./utils.js";

export type macNotarizationOptions = {
	appleId: string;
	teamId: string;
	appSpecificPassword$: string;
};

export type ParsedOptions = {
	macCert: string | undefined;
	macNotarize: macNotarizationOptions | undefined;
	windowsCert: string | undefined;
	macInstallerCert: string | undefined;
	masDevelopmentCert: string | undefined;
	masDistributionCert: string | undefined;
	masInstallerCert: string | undefined;
	secrets: Record<string, string> | undefined;
	azureTrustedSigningClientSecret: string | undefined;
};

function parseNotarizationOptions(options: string) {
	// TODO: handle appleApiKey style options
	const optionsObj: unknown = JSON.parse(options);
	try {
		return notaryToolPasswordCredentialsSchema.parse(optionsObj);
	} catch (err: unknown) {
		console.error("Invalid notarization options");
		formatMaybeZodError(err);
	}
}

export const startCommand = new Command("start")
	.description("Start the keyvault gatekeeper server")
	.option(
		"--mac-cert <name>",
		"Name of the mac certificate to use in Azure KeyVault",
	)
	.option(
		"--mac-notarize <json>",
		"JSON object containing appleId, teamId and the name of the appSpecificPassword reference in Azure KeyVault",
	)
	.option(
		"--mac-installer-cert <name>",
		"Name of the mac installer certificate to use in Azure KeyVault",
	)
	.option(
		"--mas-development-cert <name>",
		"Name of the mac app store certificate to use in Azure KeyVault",
	)
	.option(
		"--mas-distribution-cert <name>",
		"Name of the mac app store certificate to use in Azure KeyVault",
	)
	.option(
		"--mas-installer-cert <name>",
		"Name of the mac app store certificate to use in Azure KeyVault",
	)
	.option(
		"--windows-cert <name>",
		"Name of the windows certificate to use in Azure KeyVault",
	)
	.option(
		"--secrets <json>",
		"JSON object containing the secrets to use in Azure KeyVault",
	)
	.option(
		"--azure-trusted-signing-client-secret <name>",
		"Name of the azure trusted signing client secret to use in Azure KeyVault",
	)
	.action((options) => {
		const parsedOptions = {
			macCert: options.macCert,
			macNotarize: options.macNotarize
				? parseNotarizationOptions(options.macNotarize)
				: undefined,
			windowsCert: options.windowsCert,
			macInstallerCert: options.macInstallerCert,
			masDevelopmentCert: options.masDevelopmentCert,
			masDistributionCert: options.masDistributionCert,
			masInstallerCert: options.masInstallerCert,
			secrets: options.secrets
				? (JSON.parse(options.secrets) as Record<string, string>)
				: undefined,
			azureTrustedSigningClientSecret: options.azureTrustedSigningClientSecret,
		};
		createServer(parsedOptions);
	});

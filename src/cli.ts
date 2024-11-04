import { Command } from "@commander-js/extra-typings";
import { startCommand } from "./start.js";
import { version } from "../package.json";
const program = new Command();

program
	.name("keyvault-gatekeeper")
	.description(
		"A CLI tool to manage delegated access to code signing, secrets and notarization credentials on Azure Key Vault.",
	)
	.version(version ?? "0.0.0");

program.addCommand(startCommand);
program.parse(process.argv);

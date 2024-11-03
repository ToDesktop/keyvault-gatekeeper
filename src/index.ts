import { Command } from "@commander-js/extra-typings";
import { startCommand } from "./start.js";
import { readFileSync } from "fs";
const program = new Command();

function loadPackageJson() {
	const packageJson = readFileSync("./package.json", "utf8");
	return JSON.parse(packageJson) as {
		description: string;
		version: string;
	};
}

function main() {
	const packageJson = loadPackageJson();

	program
		.name("keyvault-gatekeeper")
		.description(packageJson.description)
		.version(packageJson.version);

	program.addCommand(startCommand);
	program.parse(process.argv);
}

void main();

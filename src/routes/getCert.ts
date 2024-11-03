import { downloadCertificateFile } from "../keyVault/secretClient.js";
import { ParsedOptions } from "../start.js";

export async function getCertHandler(certType: string, options: ParsedOptions) {
	switch (certType) {
		case "mac":
			return downloadCertificateFile(options.macCert);
		case "windows":
			return downloadCertificateFile(options.windowsCert);
		case "macInstaller":
			return downloadCertificateFile(options.macInstallerCert);
		case "masDevelopment":
			return downloadCertificateFile(options.masDevelopmentCert);
		case "masDistribution":
			return downloadCertificateFile(options.masDistributionCert);
		case "masInstaller":
			return downloadCertificateFile(options.masInstallerCert);
		default:
			throw new Error(`Unknown certificate type: ${certType}`);
	}
}

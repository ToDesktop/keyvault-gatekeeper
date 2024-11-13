<h1 align="center">Keyvault Gatekeeper</h1>

Retreives code signing and notarization credentials from Azure Key Vault and
delegates the signing and notarization process to a local server.

## How it works

The **priviliged process** can read certificate and secrets from Azure KeyVault based on the configuration passed in via the `start` command.
The **unprivileged process** has no direct access to the KeyVault and instead
communicates with the privileged process via http server and the `keyvault-gatekeeper/client`
npm package.

![Keyvault Gatekeeper](https://i.imgur.com/I8MKRhJ.png)

## Usage

### Basic Command

```bash
keyvault-gatekeeper start
```

### Options

- `--mac-cert <name>`: Name of the Mac certificate to use in Azure KeyVault
- `--mac-notarize <json>`: JSON object containing appleId, teamId, and the name of
  the appSpecificPassword reference in Azure KeyVault
- `--mac-installer-cert <name>`: Name of the Mac installer certificate to use in
  Azure KeyVault
- `--mas-development-cert <name>`: Name of the Mac App Store development certificate
  to use in Azure KeyVault
- `--mas-distribution-cert <name>`: Name of the Mac App Store distribution
  certificate to use in Azure KeyVault
- `--mas-installer-cert <name>`: Name of the Mac App Store installer certificate to
  use in Azure KeyVault
- `--windows-cert <name>`: Name of the Windows certificate to use in Azure KeyVault
- `--secrets <json>`: JSON object containing the secrets to use in Azure KeyVault

### Example command

```bash
keyvault-gatekeeper start --mac-cert "azure-keyvault-reference-to-cert" --mac-notarize '{"appleId": "appleId", "teamId": "teamId", "appSpecificPassword$": "azure-keyvault-reference-to-secret"}' --secrets='{"GITHUB_PAT":"5072cc0c-3de0-4b88-be27-b054bdbbf8dd"}'
```

### Environment Variables

- `AZURE_KEY_VAULT_CREDENTIALS`: Base64 encoded JSON string containing Azure Key
  Vault credentials (url, id, secret, tenantId)

## Examples

1. Request a secret:

```ts
import { requestSecret } from "keyvault-gatekeeper/client";

const secret = await getSecret("GITHUB_PAT");
```

2. Request a certificate in base64 format:

```ts
import { getCertBase64 } from "keyvault-gatekeeper/client";

const cert = await getCertBase64("mac");
```

3. Notarize a file (macOS only):

```ts
import {
	getNotarizationCredentials,
	signFile,
} from "keyvault-gatekeeper/client";
import { notarize } from "@electron/notarize";

const notarizationCredentials = await getNotarizationCredentials();
await notarize({
	...notarizationCredentials,
	appPath: "./out/make/mas-x64/My App.app",
});
```

4. Sign a file (Windows only):

```ts
import { signFile } from "keyvault-gatekeeper/client";

const signedFile = await signFile("c:/path/to/test.exe");
```

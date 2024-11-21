import { describe, expect, it, vi } from "vitest";
import {
	getNotarizationSecretsFromHSM,
	notaryToolPasswordCredentialsSchema,
	notaryToolApiKeyCredentialsSchema,
	NotaryInput,
} from "./getNotarizationCredentials.js";
import * as secretClient from "../keyVault/secretClient.js";

// Mock the getSecret function
vi.mock("../keyVault/secretClient.js", () => ({
	getSecret: vi.fn(),
	downloadSecretFileFromHsm: vi.fn(() => ({
		secretFilePath: "path/to/secret.p8",
		async cleanup() {},
	})),
}));

describe("getNotarizationSecretsFromHSM", () => {
	const mockGetSecret = vi.mocked(secretClient.getSecret);
	const mockDownloadSecretFileFromHsm = vi.mocked(
		secretClient.downloadSecretFileFromHsm,
	);

	it("correctly transforms password credentials", async () => {
		const inputCredentials = {
			appleId: "test@example.com",
			teamId: "TEAM123",
			appSpecificPassword$: "secret-name-in-vault",
		};
		const mockPassword = "retrieved-password";
		mockGetSecret.mockResolvedValueOnce(mockPassword);

		const result = await getNotarizationSecretsFromHSM(inputCredentials);

		expect(mockGetSecret).toHaveBeenCalledWith("secret-name-in-vault");
		expect(result).toEqual({
			appleId: "test@example.com",
			teamId: "TEAM123",
			appleIdPassword: mockPassword,
			appSpecificPassword$: "secret-name-in-vault",
		});
	});

	it("correctly transforms API key credentials", async () => {
		const inputCredentials = {
			appleApiKey$: "api-key-name-in-vault",
			appleApiKeyId: "KEY123",
			appleApiIssuer: "ISSUER123",
		};
		mockDownloadSecretFileFromHsm.mockResolvedValueOnce({
			secretFilePath: "path/to/secret.p8",
			async cleanup() {},
		});

		const result = await getNotarizationSecretsFromHSM(inputCredentials);

		expect(mockDownloadSecretFileFromHsm).toHaveBeenCalledWith(
			"api-key-name-in-vault",
			{ postfix: ".p8" },
		);
		expect(result).toEqual({
			appleApiKey: "path/to/secret.p8",
			appleApiKeyId: "KEY123",
			appleApiIssuer: "ISSUER123",
			appleApiKey$: "api-key-name-in-vault",
		});
	});

	it("throws error for invalid credentials", async () => {
		const invalidCredentials = {
			someOtherField: "value",
		} as unknown as NotaryInput;

		await expect(
			getNotarizationSecretsFromHSM(invalidCredentials),
		).rejects.toThrow("Invalid credentials");
	});
});

describe("notaryToolPasswordCredentialsSchema", () => {
	it("validates correct password credentials", () => {
		const validCredentials = {
			appleId: "test@example.com",
			teamId: "TEAM123",
			appSpecificPassword$: "secret-name",
		};

		const result =
			notaryToolPasswordCredentialsSchema.safeParse(validCredentials);
		expect(result.success).toBe(true);
	});

	it("fails on missing required fields", () => {
		const invalidCredentials = {
			appleId: "test@example.com",
			// missing teamId and appSpecificPassword$
		};

		const result =
			notaryToolPasswordCredentialsSchema.safeParse(invalidCredentials);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ path: ["teamId"] }),
					expect.objectContaining({ path: ["appSpecificPassword$"] }),
				]),
			);
		}
	});

	it("fails on invalid field types", () => {
		const invalidCredentials = {
			appleId: "test@example.com",
			teamId: 123, // should be string
			appSpecificPassword$: "secret-name",
		};

		const result =
			notaryToolPasswordCredentialsSchema.safeParse(invalidCredentials);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toEqual(["teamId"]);
		}
	});
});

describe("notaryToolApiKeyCredentialsSchema", () => {
	it("validates correct API key credentials", () => {
		const validCredentials = {
			appleApiKey$: "key-name",
			appleApiKeyId: "KEY123",
			appleApiIssuer: "ISSUER123",
		};

		const result =
			notaryToolApiKeyCredentialsSchema.safeParse(validCredentials);
		expect(result.success).toBe(true);
	});

	it("fails on missing required fields", () => {
		const invalidCredentials = {
			appleApiKey$: "key-name",
			// missing appleApiKeyId and appleApiIssuer
		};

		const result =
			notaryToolApiKeyCredentialsSchema.safeParse(invalidCredentials);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ path: ["appleApiKeyId"] }),
					expect.objectContaining({ path: ["appleApiIssuer"] }),
				]),
			);
		}
	});

	it("fails on invalid field types", () => {
		const invalidCredentials = {
			appleApiKey$: "key-name",
			appleApiKeyId: 123, // should be string
			appleApiIssuer: "ISSUER123",
		};

		const result =
			notaryToolApiKeyCredentialsSchema.safeParse(invalidCredentials);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toEqual(["appleApiKeyId"]);
		}
	});
});

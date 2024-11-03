import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getKeyVaultCredentials } from "./keyVaultCredentials.js";
import { ZodError } from "zod";

describe("getKeyVaultCredentials", () => {
	const validCredentials = {
		url: "https://vault.azure.net",
		id: "client-id",
		secret: "client-secret",
		tenantId: "tenant-id",
	};

	beforeEach(() => {
		vi.resetModules();
		process.env = {};
	});

	afterEach(() => {
		vi.resetModules();
		process.env = {};
	});

	it("throws error when AZURE_KEY_VAULT_CREDENTIALS is not set", () => {
		expect(() => getKeyVaultCredentials()).toThrow(
			"AZURE_KEY_VAULT_CREDENTIALS is not set",
		);
	});

	it("throws error when credentials string is not valid base64", () => {
		process.env.AZURE_KEY_VAULT_CREDENTIALS = "not-base64!@#$";

		expect(() => getKeyVaultCredentials()).toThrow(
			"Invalid base64 or JSON format",
		);
	});

	it("throws error when decoded JSON is not an object", () => {
		process.env.AZURE_KEY_VAULT_CREDENTIALS = btoa("123");

		expect(() => getKeyVaultCredentials()).toThrow(ZodError);
	});

	it("throws ZodError when credentials are missing required fields", () => {
		const invalidCredentials = {
			url: "https://vault.azure.net",
			// missing id, secret, and tenantId
		};
		process.env.AZURE_KEY_VAULT_CREDENTIALS = btoa(
			JSON.stringify(invalidCredentials),
		);

		expect(() => getKeyVaultCredentials()).toThrow(ZodError);
		try {
			getKeyVaultCredentials();
		} catch (error) {
			expect(error).toBeInstanceOf(ZodError);
			const zodError = error as ZodError;
			expect(zodError.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ path: ["id"] }),
					expect.objectContaining({ path: ["secret"] }),
					expect.objectContaining({ path: ["tenantId"] }),
				]),
			);
		}
	});

	it("throws ZodError when credential fields are not strings", () => {
		const invalidCredentials = {
			url: "https://vault.azure.net",
			id: 123, // should be string
			secret: "client-secret",
			tenantId: "tenant-id",
		};
		process.env.AZURE_KEY_VAULT_CREDENTIALS = btoa(
			JSON.stringify(invalidCredentials),
		);

		expect(() => getKeyVaultCredentials()).toThrow(ZodError);
		try {
			getKeyVaultCredentials();
		} catch (error) {
			expect(error).toBeInstanceOf(ZodError);
			const zodError = error as ZodError;
			expect(zodError.errors[0].path).toEqual(["id"]);
			expect(zodError.errors[0].message).toContain("Expected string");
		}
	});

	it("successfully parses valid credentials", () => {
		process.env.AZURE_KEY_VAULT_CREDENTIALS = btoa(
			JSON.stringify(validCredentials),
		);

		const result = getKeyVaultCredentials();

		expect(result).toEqual(validCredentials);
	});

	it("preserves all credential fields", () => {
		process.env.AZURE_KEY_VAULT_CREDENTIALS = btoa(
			JSON.stringify(validCredentials),
		);

		const result = getKeyVaultCredentials();

		expect(result).toHaveProperty("url", validCredentials.url);
		expect(result).toHaveProperty("id", validCredentials.id);
		expect(result).toHaveProperty("secret", validCredentials.secret);
		expect(result).toHaveProperty("tenantId", validCredentials.tenantId);
	});
});

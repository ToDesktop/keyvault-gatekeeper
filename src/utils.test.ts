/* eslint-disable @typescript-eslint/unbound-method */
import { IncomingMessage, ServerResponse } from "http";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	formatMaybeZodError,
	getPOSTBodyAsJSON,
	badRequest,
	notFound,
	internalServerError,
} from "./utils.js";
import { Socket } from "net";

describe("formatMaybeZodError", () => {
	it("formats ZodError with multiple issues", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});
		const error = schema.safeParse({ name: 123, age: "invalid" }).error;

		formatMaybeZodError(error);

		expect(consoleSpy).toHaveBeenCalledTimes(1);
		expect(consoleSpy.mock.calls[0][0]).toContain("name:");
		expect(consoleSpy.mock.calls[0][0]).toContain("age:");
	});

	it("logs non-Zod errors directly", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const error = new Error("Regular error");

		formatMaybeZodError(error);

		expect(consoleSpy).toHaveBeenCalledWith(error);
	});
});

describe("getPOSTBodyAsJSON", () => {
	it("parses valid JSON body", async () => {
		const mockData = { test: "value" };
		const req = new IncomingMessage(new Socket());

		// Mock the event handlers
		const handlers: Record<string, (chunk?: unknown) => void> = {};
		req.on = vi.fn((event: string, handler) => {
			handlers[event] = handler;
			return req;
		});

		const promise = getPOSTBodyAsJSON(req);

		// Simulate data event
		handlers["data"](Buffer.from(JSON.stringify(mockData)));
		// Simulate end event
		handlers["end"]();

		const result = await promise;
		expect(result).toEqual(mockData);
	});

	it("returns empty object for empty body", async () => {
		const req = new IncomingMessage(new Socket());
		const handlers: Record<string, (chunk?: unknown) => void> = {};
		req.on = vi.fn((event: string, handler) => {
			handlers[event] = handler;
			return req;
		});

		const promise = getPOSTBodyAsJSON(req);
		handlers["end"]();

		const result = await promise;
		expect(result).toEqual({});
	});

	it("rejects with error for invalid JSON", async () => {
		const req = new IncomingMessage(new Socket());
		const handlers: Record<string, (chunk?: unknown) => void> = {};
		req.on = vi.fn((event: string, handler) => {
			handlers[event] = handler;
			return req;
		});

		const promise = getPOSTBodyAsJSON(req);
		handlers["data"](Buffer.from("invalid json"));
		handlers["end"]();

		await expect(promise).rejects.toThrow();
	});
});

describe("HTTP response helpers", () => {
	it("sends 400 Bad Request", () => {
		const res = {
			writeHead: vi.fn(),
			end: vi.fn(),
		} as unknown as ServerResponse;

		badRequest(res);

		expect(res.writeHead).toHaveBeenCalledWith(400);
		expect(res.end).toHaveBeenCalledWith("Bad Request");
	});

	it("sends 404 Not Found", () => {
		const res = {
			writeHead: vi.fn(),
			end: vi.fn(),
		} as unknown as ServerResponse;

		notFound(res);

		expect(res.writeHead).toHaveBeenCalledWith(404);
		expect(res.end).toHaveBeenCalledWith("Not Found");
	});

	it("sends 500 Internal Server Error", () => {
		const res = {
			writeHead: vi.fn(),
			end: vi.fn(),
		} as unknown as ServerResponse;

		internalServerError(res);

		expect(res.writeHead).toHaveBeenCalledWith(500);
		expect(res.end).toHaveBeenCalledWith("Internal Server Error");
	});
});

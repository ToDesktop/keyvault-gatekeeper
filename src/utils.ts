import { IncomingMessage, ServerResponse } from "http";
import { ZodError } from "zod";

export function formatMaybeZodError(error: unknown) {
	if (error instanceof ZodError) {
		console.error(
			error.issues
				.map((issue) => `${issue.path.toString()}: ${issue.message}`)
				.join("\n"),
		);
	} else {
		console.error(error);
	}
}

export function getPOSTBodyAsJSON<T = Record<string, string>>(
	req: IncomingMessage,
): Promise<T> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk: Buffer) => {
			body += chunk.toString();
		});
		req.on("end", () => {
			if (body === "") {
				resolve({} as T);
				return;
			}
			try {
				resolve(JSON.parse(body) as T);
			} catch (err: unknown) {
				if (err instanceof Error) {
					reject(err);
				} else {
					reject(new Error("Invalid JSON"));
				}
			}
		});
		req.on("error", (err) => {
			reject(err);
		});
	});
}

export function parseFormUploadData(
	req: IncomingMessage,
): Promise<{ fileName: string | null; content: Buffer | null }> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk: Buffer) => {
			if (chunk) {
				body += chunk.toString();
			}
		});

		req.on("end", () => {
			try {
				const boundary = req.headers["content-type"]
					?.split("; ")[1]
					?.replace("boundary=", "");

				if (!boundary) {
					throw new Error("No boundary found in content-type header");
				}

				const parts = body.split(`--${boundary}`);

				// Extract file data (assuming a single file)
				const filePart = parts.find((part) => part.includes("Content-Type:"));
				if (filePart) {
					// Get headers and content
					const headersEndIndex = filePart.indexOf("\r\n\r\n");
					const content = filePart.slice(headersEndIndex + 4, -2); // remove trailing \r\n

					const fileNameMatch = filePart.match(/filename="(.+?)"/);
					const fileName = fileNameMatch ? fileNameMatch[1] : "uploaded-file";

					resolve({
						fileName,
						content: Buffer.from(content, "binary"),
					});
				} else {
					resolve({
						fileName: null,
						content: null,
					});
				}
			} catch (err) {
				reject(err as Error);
			}
		});

		req.on("error", (err) => {
			reject(err);
		});
	});
}

export function badRequest(res: ServerResponse) {
	res.writeHead(400);
	res.end("Bad Request");
}

export function notFound(res: ServerResponse) {
	res.writeHead(404);
	res.end("Not Found");
}

export function internalServerError(res: ServerResponse) {
	res.writeHead(500);
	res.end("Internal Server Error");
}

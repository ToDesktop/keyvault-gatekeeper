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
		if (req.readableEnded) {
			reject(new Error("Request stream has already ended"));
			return;
		}

		if (req.readable === false) {
			reject(new Error("Request stream is not readable"));
			return;
		}

		// Resume the stream if it's paused
		req.resume();

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

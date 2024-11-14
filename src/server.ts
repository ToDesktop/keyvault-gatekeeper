import { getSecretHandler } from "./routes/getSecret.js";
import { ParsedOptions } from "./start.js";
import http, { IncomingMessage, ServerResponse } from "http";
import { getCertHandler } from "./routes/getCert.js";
import { getNotarizationSecretsFromHSM } from "./routes/getNotarizationCredentials.js";
import {
	badRequest,
	getPOSTBodyAsJSON,
	internalServerError,
	notFound,
} from "./utils.js";
import { signFile } from "./routes/signFile.js";

const router: Record<
	string,
	(
		req: IncomingMessage,
		res: ServerResponse,
		options: ParsedOptions,
	) => Promise<void> | void
> = {
	"/": (req, res) => {
		res.end("Hello, World!");
	},
	"/getSecret": async (req, res, options) => {
		const { secretName } = await getPOSTBodyAsJSON(req);
		if (typeof secretName !== "string" || !options.secrets) {
			return badRequest(res);
		}
		const secretValue = await getSecretHandler(secretName, options.secrets);
		if (secretValue) {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ secretValue }));
		} else {
			notFound(res);
		}
	},
	"/getCert": async (req, res, options) => {
		const { certType } = await getPOSTBodyAsJSON(req);
		if (typeof certType !== "string") {
			return badRequest(res);
		}
		const certValue = await getCertHandler(certType, options);
		if (certValue) {
			res.end(certValue.toString("base64"));
		} else {
			notFound(res);
		}
	},
	"/signFile": async (req, res, options) => {
		const { filePath } = await getPOSTBodyAsJSON(req);

		if (!filePath) {
			return badRequest(res);
		}
		const signedFile = await signFile(filePath, options);
		res.end(JSON.stringify({ signedFile }));
	},
	"/getNotarizationCredentials": async (req, res, options) => {
		if (!options.macNotarize) {
			return badRequest(res);
		}
		const notarizationSecrets = await getNotarizationSecretsFromHSM(
			options.macNotarize,
		);
		console.log({ notarizationSecrets });
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(notarizationSecrets));
	},
};

export const createServer = function (options: ParsedOptions) {
	const server = http.createServer();

	server.on("request", (req, res) => {
		void (async () => {
			if (!req.url || req.method !== "POST") {
				res.writeHead(404);
				res.end("Not Found");
				return;
			}
			const url = req.url.split("/");
			const routeKey = url[1] ? `/${url[1]}` : "/";
			const routeHandler = router[routeKey] || notFound;

			try {
				await routeHandler(req, res, options);
			} catch (err) {
				console.error(`Error in route handler for ${routeKey}:`, err);
				if (err instanceof Error) {
					res.writeHead(400);
					res.end(err.message);
				} else {
					internalServerError(res);
				}
			}
		})();
	});

	server.listen(3292, () =>
		console.log("Server running on http://localhost:3292"),
	);
};

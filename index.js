// Packages
const express = require("express"),
	app = express();
const fs = require("node:fs");
const logger = require("./logger");
require("dotenv").config();

// Packages for Markdown
const { JSDOM } = require("jsdom");
const marked = require("marked");
const metadataParser = require("@cmdlucas/markdown-metadata");
const dompurify = require("dompurify"),
	purify = dompurify(new JSDOM("").window);

// Configure marked
marked.setOptions({
	renderer: new marked.Renderer(),
	highlight: function (code, lang) {
		const hljs = require("highlight.js");
		const language = hljs.getLanguage(lang) ? lang : "plaintext";

		return hljs.highlight(code, {
			language,
		}).value;
	},
	langPrefix: "hljs language-",
	pedantic: false,
	gfm: true,
	breaks: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,
	xhtml: false,
});

// Middleware
app.use(express.json());
app.set("view engine", "ejs");
app.use(
	express.static("static", {
		root: __dirname,
	})
);

// Endpoint Map
const endpoints = new Map();
const endpointFiles = fs
	.readdirSync("./endpoints")
	.filter((file) => file.endsWith(".js"));

for (const file of endpointFiles) {
	const endpoint = require(`./endpoints/${file}`);
	endpoints.set(endpoint.data.name, endpoint);
}

// API Endpoint Map
const apiEndpoints = new Map();
const apiEndpointFiles = fs
	.readdirSync("./api")
	.filter((file) => file.endsWith(".js"));

for (const file of apiEndpointFiles) {
	const endpoint = require(`./api/${file}`);
	apiEndpoints.set(
		`${endpoint.data.category}/${endpoint.data.name}`,
		endpoint
	);
}

// API Documentaton Map
const apiDocs = new Map();
const apiDocFiles = fs
	.readdirSync("./docs")
	.filter((file) => file.endsWith(".md"));

for (const file of apiDocFiles) {
	const contents = fs.readFileSync(`${__dirname}/docs/${file}`, "utf8");
	const result = metadataParser.parse(contents);

	const results = {
		metadata: result.metadata,
		content: purify.sanitize(marked.parse(result.content)),
	};

	apiDocs.set(file.split(".")[0], results);
}

// Endpoints
app.get("/", async (req, res) => {
	const page = endpoints.get("root");

	if (!page)
		return res.status(404).json({
			error: "This endpoint does not exist.",
		});

	try {
		page.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		logger.error(`Page (${page.data.name})`, error);

		return res.status(500).json({
			error: error,
		});
	}
});

app.get("/page/:page", (req, res) => {
	const page = endpoints.get(req.params["page"]);

	if (!page)
		return res.status(404).json({
			error: "This page does not exist.",
		});

	try {
		page.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		logger.error(`Page (${page.data.name})`, error);

		return res.status(500).json({
			error: error,
		});
	}
});

// API Endpoints
app.all("/api", (req, res) => {
	return res.status(404).json({
		error: "This endpoint does not exist!",
	});
});

app.all("/api/:category/:endpoint", (req, res) => {
	const endpoint = apiEndpoints.get(
		`${req.params["category"]}/${req.params["endpoint"]}`
	);

	if (!endpoint)
		return res.status(404).json({
			error: "This endpoint does not exist.",
		});

	try {
		if (endpoint.data.method != req.method)
			return res.status(405).json({
				error: `Method \`${req.method}\` is not allowed for this endpoint.`,
			});

		endpoint.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		logger.error(
			`API Endpoint (${endpoint.data.category}/${endpoint.data.name})`,
			error
		);

		return res.status(500).json({
			error: error,
		});
	}
});

// API Documentation Endpoints
app.get("/docs", async (req, res) => {
	let data = [];

	apiDocs.forEach((content) => {
		data.push({
			metadata: content.metadata,
			content: content.content,
		});
	});

	res.render("all_docs", {
		data: data,
	});
});

app.get("/docs/:title", async (req, res) => {
	const document = apiDocs.get(req.params["title"] || "null");

	if (!document)
		return res
			.status(404)
			.send(
				"It seems the documentation page that you are looking for does not exist."
			);
	else
		return res.render("doc_page", {
			metadata: document.metadata,
			content: document.content,
		});
});

// Page not Found
app.all("*", (req, res) => {
	return res.status(404).json({
		error: "This endpoint does not exist.",
	});
});

// Start Server
app.listen(process.env.PORT, () => {
	logger.info("Express", `Server started on port ${process.env.PORT.green}`);
});

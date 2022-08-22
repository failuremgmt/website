// Packages
const express = require("express"),
	app = express();
const fs = require("node:fs");
const logger = require("./logger");
require("dotenv").config();

// Middleware
app.use(express.json());
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
	apiEndpoints.set(endpoint.data.name, endpoint);
}

// API Documentaton Map
const apiDocs = new Map();
const apiDocFiles = fs
	.readdirSync("./docs")
	.filter((file) => file.endsWith(".md"));

for (const file of apiDocFiles) {
	// I don't even know how the fuck i am going to get this to work.
}

// Endpoints
app.get("/", async (req, res) => {
	const endpoint = endpoints.get("root");

	if (!endpoint)
		res.status(404).json({
			error: "This endpoint does not exist.",
		});

	try {
		endpoint.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		res.status(500).json({
			error: error,
		});

		logger.error(`Endpoint (${endpoint.data.name})`, error);
	}
});

app.get("/:query", (req, res) => {
	const endpoint = endpoints.get(req.params["query"]);

	if (!endpoint)
		res.status(404).json({
			error: "This endpoint does not exist.",
		});

	try {
		endpoint.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		res.status(500).json({
			error: error,
		});

		logger.error(`Endpoint (${endpoint.data.name})`, error);
	}
});

// API Endpoints
app.all("/api", (req, res) => {
	res.status(404).json({
		error: "This endpoint does not exist!",
	});
});

app.all("/api/:query", (req, res) => {
	const endpoint = apiEndpoints.get(req.params["query"]);

	if (!endpoint)
		res.status(404).json({
			error: "This endpoint does not exist.",
		});

	try {
		if (endpoint.data.type != req.method)
			res.status(405).json({
				error: `This endpoint does not allow the "${req.method.toUpperCase()}" method.`,
			});

		endpoint.execute({
			request: req,
			response: res,
		});
	} catch (error) {
		res.status(500).json({
			error: error,
		});

		logger.error(`Endpoint (${endpoint.data.name})`, error);
	}
});

// Page not Found
app.all("*", (res, req) => {
	req.status(404).send("404 - Page not Found!");
});

// Start Server
app.listen(process.env.PORT, () => {
	console.log(`Server started on port: ${process.env.PORT}`);
});

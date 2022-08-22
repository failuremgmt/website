// Packages
const express = require('express'), app = express();
require("dotenv").config();

// PORT
const PORT = 7478;

// Middleware
app.use(express.json());
app.use(express.static("static", {
	root: __dirname
}));

// Endpoints
app.get('/', (req, res) => {
	res.send("Coming Soon!");
});

// API Endpoints
app.all("/api", (req, res) => {
	res.json({
		error: "This endpoint does not exist!"
	});
});

// Start Server
app.listen(PORT, () => {
	console.log('server started');
});

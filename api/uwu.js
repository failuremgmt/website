module.exports = {
	data: {
		name: "uwu",
		category: "users",
		method: "GET",
	},
	execute: async (context) => {
		return context.response.send("uwu >3");
	},
};

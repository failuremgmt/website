module.exports = {
	data: {
		name: "root",
	},
	execute: async (context) => {
		return context.response.send("Coming Soon!");
	},
};

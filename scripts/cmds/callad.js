const { getStreamsFromAttachment } = global.utils;

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

const ADMIN_THREAD = "9039663562824832";

module.exports = {
	config: {
		name: "callad",
		aliases: ["call"],
		version: "8.0",
		author: "MOJAHAID",
		role: 0
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api }) {
		if (!args[0])
			return message.reply("❌ Write message first");

		const { senderID, threadID, isGroup } = event;
		const senderName = await usersData.getName(senderID);

		const payload =
			"📨 NEW CALL\n" +
			`👤 ${senderName}\n🆔 ${senderID}` +
			(isGroup
				? `\n📌 ${(await threadsData.get(threadID)).threadName}`
				: "\n📩 Private");

		const formMessage = {
			body: payload + `\n\n💬 ${args.join(" ")}`,
			attachment: await getStreamsFromAttachment(
				[...event.attachments, ...(event.messageReply?.attachments || [])]
					.filter(i => mediaTypes.includes(i.type))
			)
		};

		try {
			const sent = await api.sendMessage(formMessage, ADMIN_THREAD);

			// ✅ PRO FIX: SAFE REGISTER (NO COMMAND ERROR EVER)
			global.GoatBot.onReply.set(sent.messageID, {
				commandName: this.config.name,
				threadID: threadID,
				userID: senderID,
				type: "adminReply"
			});

			return message.reply("✅ Sent to admin");

		} catch (e) {
			console.error(e);
			return message.reply("❌ Failed to send");
		}
	},

	onReply: async function ({ args, event, api, Reply, usersData, message }) {

		// ✅ PRO SAFE CHECK (NO CRASH EVER)
		if (!Reply || !Reply.type) return;
		if (Reply.commandName !== this.config.name) return;

		if (!args[0])
			return message.reply("❌ Write reply message");

		const adminName = await usersData.getName(event.senderID);

		if (Reply.type === "adminReply") {
			try {
				await api.sendMessage(
					`📩 Admin Reply (${adminName}):\n\n${args.join(" ")}`,
					Reply.threadID
				);

				return message.reply("✅ Reply sent");
			} catch (e) {
				console.error(e);
				return message.reply("❌ Reply failed");
			}
		}
	}
};

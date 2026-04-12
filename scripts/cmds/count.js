const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://video09:Ayan553@sayem50.pqzsqng.mongodb.net/mydbname?retryWrites=true&w=majority";

// connect mongo
if (!global._mongoConnected) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  global._mongoConnected = true;
}

const userSchema = new mongoose.Schema({
  userID: String,
  threadID: String,
  name: String,
  count: { type: Number, default: 0 }
});

const User = mongoose.models.topmsg || mongoose.model("topmsg", userSchema);

module.exports = {
  config: {
    name: "topmsg",
    version: "3.4",
    role: 0,
    author: "ARIFUL",
    category: "group"
  },

  onChat: async function ({ event, usersData }) {
    if (!event.senderID || event.isGroup == false) return;

    const name = await usersData.getName(event.senderID);

    await User.findOneAndUpdate(
      { userID: event.senderID },
      {
        $inc: { count: 1 },
        name: name || "Unknown"
      },
      { upsert: true }
    );
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const fontPath = path.join(__dirname, "noto-bengali.ttf");

      if (!fs.existsSync(fontPath)) {
        const fontUrl = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Bold.ttf";
        const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(fontPath, Buffer.from(response.data));
      }

      registerFont(fontPath, { family: "BengaliFont" });
      const mainFont = "BengaliFont";

      const members = await User.find({})
        .sort({ count: -1 })
        .limit(15);

      if (!members.length)
        return api.sendMessage("⚠ No message data.", event.threadID);

      const width = 1400;
      const height = 2600; // 🔥 height increase
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 250; i++) {
        ctx.fillStyle = "white";
        ctx.globalAlpha = Math.random();
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.shadowColor = "#00f2ff";
      ctx.shadowBlur = 40;
      ctx.fillStyle = "#00f2ff";
      ctx.font = `70px ${mainFont}`;
      ctx.fillText("❄ TOP MESSAGE DASHBOARD❄", width / 2, 100);

      ctx.font = `40px ${mainFont}`;
      ctx.fillText("TOP MESSAGE", width / 2, 160);
      ctx.shadowBlur = 0;

      const maxCount = members[0].count;

      const positions = [
        { x: width / 2, y: 340, size: 130, color: "#FFD700", label: "👑 1ST" },
        { x: width / 2 - 350, y: 430, size: 110, color: "#C0C0C0", label: "🥈 2ND" },
        { x: width / 2 + 350, y: 430, size: 110, color: "#CD7F32", label: "🥉 3RD" }
      ];

      for (let i = 0; i < 3 && i < members.length; i++) {
        const user = members[i];
        const pos = positions[i];

        let avatar = null;
        try {
          const url = await usersData.getAvatarUrl(user.userID);
          avatar = await loadImage(url);
        } catch {}

        if (avatar) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pos.size, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatar, pos.x - pos.size, pos.y - pos.size, pos.size * 2, pos.size * 2);
          ctx.restore();
        }

        ctx.strokeStyle = pos.color;
        ctx.shadowColor = pos.color;
        ctx.shadowBlur = 25;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = pos.color;
        ctx.font = `34px ${mainFont}`;
        ctx.fillText(pos.label, pos.x, pos.y - pos.size - 30);

        ctx.fillStyle = "#ffffff";
        ctx.font = `28px ${mainFont}`;
        ctx.fillText(user.name || "Unknown", pos.x, pos.y + pos.size + 45);

        ctx.fillStyle = "#00f2ff";
        ctx.font = `26px ${mainFont}`;
        ctx.fillText(user.count + " msgs", pos.x, pos.y + pos.size + 75);
      }

      let y = 720;

      for (let i = 3; i < members.length; i++) {
        const user = members[i];
        const percent = user.count / maxCount;

        ctx.strokeStyle = "#00f2ff";
        ctx.shadowColor = "#00f2ff";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        roundRect(ctx, 100, y - 40, 1200, 100, 25);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = `32px ${mainFont}`;
        ctx.fillText(`#${i + 1} ${user.name}`, 160, y);

        ctx.textAlign = "right";
        ctx.fillStyle = "#00f2ff";
        ctx.fillText(u

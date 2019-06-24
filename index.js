const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({disableEveryone: true});

bot.login(botconfig.token)

bot.on("ready", async () => {
    console.log(`${bot.user.username} is online!`)
})
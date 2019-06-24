const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({ disableEveryone: true });
const fs = require("fs")

bot.games = new Discord.Collection();
class Player {
    constructor() {

    }
}
class Game {
    constructor(message) {
        this.Leader = message.author.id;
        this.Players = new Discord.Collection()
        this.Players.set(message.author.id, new Player())
        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game`);
    }

    NewPlayer(message) {
        if (this.Players.has(message.author.id)) return message.channel.send("You are already in this game!")
        if (this.Players.length > 8) return message.channel.send("The game is full!")
        this.Players.set(message.author.id, new Player())
        message.reply("Welcome to the game!")
    }

    PlayerLeave(message) {
        if (!this.Players.has(message.author.id)) return message.reply("You aren't in this game!")
        this.Players.set(message.channel.id, new Player())
    }

    Start(message) {
        if (message.author.id != this.Leader) return message.reply(`Only <@${this.Leader}> can start this game!`)
        if (this.Players.size < 2) return message.reply("Can't start a game with less than 2 players")
    }
}

bot.login(botconfig.token)

bot.on("ready", async () => {
    console.log(`${bot.user.username} is online!`)
})

bot.on("message", async (message) => {
    if (message.content == "shutdown" && message.author.id == "330000865215643658") {
        bot.destroy()
        return;
    }

    if (!botconfig.prefixes[message.guild.id]) botconfig.prefixes[message.guild.id] = { "prefix": "!" }
    const prefix = botconfig.prefixes[message.guild.id].prefix;

    if (message.content.startsWith(prefix)) {
        const messageArray = message.content.split(' '); //splits the message into an array for every space into an array
        const cmd = messageArray[0].toLowerCase().slice(prefix.length); //command is first word in lowercase
        const args = messageArray.slice(1); //args is everything after the first word

        switch (cmd) {
            case "create": 
                if (!bot.games.has(message.channel.id)) {
                    bot.games.set(message.channel.id, new Game(message))
                } else {
                    message.channel.send("Theres already a game in this channel")
                }
                break;
            case "end":
                if (bot.games.has(message.channel.id)) {
                    bot.games.delete(message.channel.id)
                } else {
                    message.channel.send(`There is no game in this channel. Do ${prefix}create to make a game`)
                }
                break;
            case "join":
                if (!bot.games.has(message.channel.id)) {
                    message.channel.send(`There is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).NewPlayer(message)
                }
                break;
            case "leave":
                if (!bot.games.has(message.channel.id)) {
                    message.channel.send(`There is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).PlayerLeave(message)
                }
                break;
            case "start":
                if (!bot.games.has(message.channel.id)) {
                    message.channel.send(`There is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Start(message)
                }
                break;
        }
    }
    })

bot.on("disconnect", async () => {
    fs.writeFile("./botconfig.json", JSON.stringify(botconfig), (err) => {
        if (err) console.log(err)
    })
})
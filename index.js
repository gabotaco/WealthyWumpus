const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({ disableEveryone: true });
const fs = require("fs")

bot.games = new Discord.Collection();

class Property {
    constructor(Name, Rent, Color, Price, Mortgage, Building) {
        this.Name = Name;
        this.Rent = Rent,
        this.Color = Color;
        this.Price = Price;
        this.Mortgage = Mortgage;
        this.Building = Building;
        this.Mortgaged = false;
        this.Owner = null;
    }
}

class Player {
    constructor() {
        this.Position = 0;
        this.Money = 1500;
        this.RR = 0;
    }
}
class Game {
    constructor(message) {
        this.InProgress = false;
        this.Leader = message.author.id;
        this.Players = new Discord.Collection();
        this.Players.set(message.author.id, new Player())
        this.Properties = [
            new Property("GO", -200, "GO"),
            new Property("Mediterranean Avenue", [2, 10, 30, 90, 160, 250], "Brown", 60, 30, 50),
            new Property("Community Chest", 0, "Chest"),
            new Property("Baltic Avenue", [4, 20, 60, 180, 320, 450], "Brown", 60, 30, 50),
            new Property("Income Tax", 200, "Tax"),
            new Property("Reading Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Oriental Avenue", [6, 30, 90, 270, 400, 550], "Light Blue", 100, 50, 50),
            new Property("Chance", 0, "Chance"),
            new Property("Vermont Avenue", [6, 30, 90, 270, 400, 550], "Light Blue", 100, 50, 50),
            new Property("Connecticut Avenue", [8, 40, 100, 300, 450, 600], "Light Blue", 120, 60, 50),
            new Property("Jail", 0, "Jail"),
            new Property("St. Charles Place", [10, 50, 150, 450, 625, 750], "Pink", 140, 70, 100),
            new Property("Electric Company", [4, 10], "Utility", 150, 75, 0),
            new Property("States Avenue", [10, 50, 150, 450, 625, 750], "Pink", 140, 70, 100),
            new Property("Virginia Avenue", [12, 60, 180, 500, 700, 900], "Pink", 160, 80, 100),
            new Property("Pennsylvania Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("St. James Place", [14, 70, 200, 550, 750, 950], "Orange", 180, 90, 100),
            new Property("Community Chest", 0, "Chest"),
            new Property("Tennessee Avenue", [14, 70, 200, 550, 750, 950], "Orange", 180, 90, 100),
            new Property("New York Avenue", [16, 80, 220, 600, 800, 1000], "Orange", 200, 100, 100),
            new Property("Free Parking", 0, "Parking"),
            new Property("Kentucky Avenue", [18, 90, 250, 700, 875, 1050], "Red", 220, 110, 150),
            new Property("Chance", 0, "Chance"),
            new Property("Indiana Avenue", [18, 90, 250, 700, 875, 1050], "Red", 220, 110, 150),
            new Property("Illinois Avenue", [20, 100, 300, 750, 925, 1100], "Red", 240, 120, 150),
            new Property("B. & O. Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Atlantic Avenue", [22, 110, 330, 800, 975, 1150], "Yellow", 260, 130, 150),
            new Property("Ventnor Avenue", [22, 110, 330, 800, 975, 1150], "Yellow", 260, 130, 150),
            new Property("Water Works", [4, 10], "Utility", 150, 75, 0),
            new Property("Marvin Gardens", [24, 120, 360, 850, 1025, 1200], "Yellow", 280, 140, 150),
            new Property("Go To Jail", 0, "Go To Jail"),
            new Property("Pacific Avenue", [26, 130, 390, 900, 1100, 1275], "Green", 300, 150, 200),
            new Property("North Carolina Avenue", [26, 130, 390, 900, 1100, 1275], "Green", 300, 150, 200),
            new Property("Community Chest", 0, "Chest"),
            new Property("Pennsylvania Avenue", [28, 150, 450, 1000, 1200, 1400], "Green", 320, 160, 200),
            new Property("Short Line", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Chance", 0, "Chance"),
            new Property("Park Place", [35, 175, 500, 1100, 1300, 1500], "Dark Blue", 350, 175, 200),
            new Property("Luxury Tax", 100, "Tax"),
            new Property("Boardwalk", [50, 200, 600, 1400, 1700, 2000], "Dark Blue", 400, 200, 200)
        ]
        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game`);
    }

    NewPlayer(message) {
        if (this.Players.has(message.author.id)) return message.reply("you are already in this game!")
        if (this.Players.length > 8) return message.reply("the game is full!")
        this.Players.set(message.author.id, new Player())
        message.reply("Welcome to the game!")
    }

    PlayerLeave(message) {
        if (!this.Players.has(message.author.id)) return message.reply("You aren't in this game!")
        if (message.author.id == this.Leader) return message.reply(`the leader can't leave! Do ${botconfig.prefixes[message.guild.id].prefix}leader to change the leader!`)
        this.Players.set(message.channel.id, new Player())
    }

    ChangeLeader(message) {
        if (this.Leader != message.author.id) return message.reply(`Only the leader can change the leader`)
        const NewLeader = message.mentions.members.first() || message.guild.members.get(message.content.split(" ")[1])
        if (NewLeader) {
            this.Leader = NewLeader.id
            message.reply(`Changed leader to <@${this.Leader}>!`)
        } else {
            message.reply("Couldn't find that member")
        }
    }
    Start(message) {
        if (message.author.id != this.Leader) return message.reply(`Only <@${this.Leader}> can start this game!`)
        if (this.Players.size < 2) return message.reply("I can't start a game with less than 2 players")
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
            case "prefix":
                if (args[0]) {
                    botconfig.prefixes[message.guild.id].prefix = args[0]
                    message.reply(`Prefix set to ${args[0]}`)
                } else {
                    message.reply("I can't set the prefix to nothing!")
                }
                break;
            case "create":
                if (!bot.games.has(message.channel.id)) {
                    bot.games.set(message.channel.id, new Game(message))
                } else {
                    message.reply("theres already a game in this channel!")
                }
                break;
            case "end":
                if (bot.games.has(message.channel.id)) {
                    if (bot.games.get(message.channel.id).Leader == message.author.id) {
                        bot.games.delete(message.channel.id)
                        message.message.send("Game is over")
                    } else {
                        message.reply("only the leader can end this game.")
                    }
                } else {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                }
                break;
            case "join":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).NewPlayer(message)
                }
                break;
            case "leave":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).PlayerLeave(message)
                }
                break;
            case "start":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Start(message)
                }
                break;
            case "leader":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).ChangeLeader(message)
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
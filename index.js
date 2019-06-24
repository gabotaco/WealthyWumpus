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
    constructor(ID) {
        this.Position = 0;
        this.Money = 1500;
        this.RR = 0;
        this.Jailed = false;
        this.ID = ID
        this.Brown = 0;
        this.LightBlue = 0;
        this.Pink = 0;
        this.Utility = 0;
        this.Orange = 0;
        this.Red = 0;
        this.Yellow = 0;
        this.Green = 0;
        this.DarkBlue = 0;
    }
}
class Game {
    constructor(message) {
        this.InProgress = false;
        this.Leader = message.author.id;
        this.Players = new Discord.Collection();
        this.Players.set(message.author.id, new Player(message.author.id))
        this.CurrentPlayer = null;
        this.Properties = [
            new Property("GO", -200, "GO"),
            new Property("Mediterranean Avenue (Brown)", [2, 10, 30, 90, 160, 250], "DARK_ORANGE", 60, 30, 50),
            new Property("Community Chest", 0, "Chest"),
            new Property("Baltic Avenue (Brown)", [4, 20, 60, 180, 320, 450], "DARK_ORANGE", 60, 30, 50),
            new Property("Income Tax", 200, "Tax"),
            new Property("Reading Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Oriental Avenue (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50),
            new Property("Chance", 0, "Chance"),
            new Property("Vermont Avenue (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50),
            new Property("Connecticut Avenue (Light Blue)", [8, 40, 100, 300, 450, 600], "BLUE", 120, 60, 50),
            new Property("Jail", 0, "Jail"),
            new Property("St. Charles Place (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100),
            new Property("Electric Company", [0, 4, 10], "Utility", 150, 75, 0),
            new Property("States Avenue (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100),
            new Property("Virginia Avenue (Pink)", [12, 60, 180, 500, 700, 900], "LUMINOUS_VIVID_PINK", 160, 80, 100),
            new Property("Pennsylvania Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("St. James Place (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100),
            new Property("Community Chest", 0, "Chest"),
            new Property("Tennessee Avenue (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100),
            new Property("New York Avenue (Orange)", [16, 80, 220, 600, 800, 1000], "ORANGE", 200, 100, 100),
            new Property("Free Parking", 0, "Parking"),
            new Property("Kentucky Avenue (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150),
            new Property("Chance", 0, "Chance"),
            new Property("Indiana Avenue (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150),
            new Property("Illinois Avenue (Red)", [20, 100, 300, 750, 925, 1100], "DARK_RED", 240, 120, 150),
            new Property("B. & O. Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Atlantic Avenue (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150),
            new Property("Ventnor Avenue (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150),
            new Property("Water Works", [0, 4, 10], "Utility", 150, 75, 0),
            new Property("Marvin Gardens (Yellow)", [24, 120, 360, 850, 1025, 1200], "GOLD", 280, 140, 150),
            new Property("Go To Jail", 0, "Go To Jail"),
            new Property("Pacific Avenue (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200),
            new Property("North Carolina Avenue (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200),
            new Property("Community Chest", 0, "Chest"),
            new Property("Pennsylvania Avenue (Green)", [28, 150, 450, 1000, 1200, 1400], "DARK_GREEN", 320, 160, 200),
            new Property("Short Line", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            new Property("Chance", 0, "Chance"),
            new Property("Park Place (Dark Blue)", [35, 175, 500, 1100, 1300, 1500], "DARK_BLUE", 350, 175, 200),
            new Property("Luxury Tax", 100, "Tax"),
            new Property("Boardwalk (Dark Blue)", [50, 200, 600, 1400, 1700, 2000], "DARK_BLUE", 400, 200, 200)
        ]
        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game`);
    }

    NewPlayer(message) {
        if (this.Players.has(message.author.id)) return message.reply("you are already in this game!")
        if (this.Players.length > 8) return message.reply("the game is full!")
        this.Players.set(message.author.id, new Player(message.author.id))
        message.reply("Welcome to the game!")
    }

    PlayerLeave(message) {
        if (!this.Players.has(message.author.id)) return message.reply("You aren't in this game!")
        if (message.author.id == this.Leader) return message.reply(`the leader can't leave! Do ${botconfig.prefixes[message.guild.id].prefix}leader to change the leader!`)
        if (this.InProgress) return message.reply("You can't leave in the middle of a game!")
        this.Players.delete(message.author.id)
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
        if (this.Players.size < 1) return message.reply("I can't start a game with less than 2 players")
        this.InProgress = true;
        this.CurrentPlayerIndex = Math.floor(Math.random() * this.Players.size)
        this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
        message.channel.send(`Lets get the show on the road! <@${this.CurrentPlayer.ID}>, you are going first! Do ${botconfig.prefixes[message.guild.id].prefix}roll to roll!`)
    }

    Roll(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply("it's not your turn!")
        const Dice1 = Math.floor(Math.random() * 6) + 1;
        const Dice2 = Math.floor(Math.random() * 6) + 1;
        let Message = `You rolled a ${Dice1} and a ${Dice2}`
        this.CurrentPlayer.Position += Dice1 + Dice2;
        if (this.CurrentPlayer.Position >= this.Properties.length) {
            Message += " and you passed GO and collected $200."
            this.CurrentPlayer.Money += 200;
            this.CurrentPlayer.Position -= this.Properties.length;
        }
        message.channel.send(Message)

        const CurrentProperty = this.Properties[this.CurrentPlayer.Position]
        const PropertyEmbed = new Discord.RichEmbed()
        .setColor(CurrentProperty.Color)
        .setTitle(CurrentProperty.Name)
        .addField("Price", CurrentProperty.Price, true)
        .addField("Mortgage", CurrentProperty.Mortgage, true)
        .addField("Price per building", CurrentProperty.Building, true)
        if (typeof (CurrentProperty.Rent) != Number) {
            for (let i = 0; i < CurrentProperty.Rent.length; i++) {
                if (i == 5) {
                    PropertyEmbed.addField("1 Hotel", CurrentProperty.Rent[i], true)
                } else {
                    if (CurrentProperty.Color == "RR") {
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"RR":"RR's"}`, CurrentProperty.Rent[i], true)
                    } else if (CurrentProperty.Color == "Utility") 
                    {
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"Utility":"Utilities"}`, CurrentProperty.Rent[i] + " * dice roll", true)

                    }
                    else {
                        PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"House":"Houses"}`, CurrentProperty.Rent[i], true)

                    }
                }
            }
        }

        if (CurrentProperty.Color == "GO") {

        } else if (CurrentProperty.Color == "Chest") {

        } else if (CurrentProperty.Color == "Tax") {

        } else if (CurrentProperty.Color == "RR") {

        } else if (CurrentProperty.Color == "Chance") {

        } else if (CurrentProperty.Color == "Jail") {

        } else if (CurrentProperty.Color == "Utility") {

        } else if (CurrentProperty.Color == "Parking") {

        } else if (CurrentProperty.Color == "Go To Jail") {

        } else {
            if (CurrentProperty.Owner) {
                if (CurrentProperty.Owner.ID == this.CurrentPlayer.ID) message.reply(`You landed on ${this.Properties[this.CurrentPlayer.Position].Name} but you already own it.`)
                else message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>`)

            } else {
                message.channel.send(PropertyEmbed)
            }
        }
        /*if (Dice1 == Dice2) message.reply("you rolled doubles so you get to go again!")
        else {
            this.CurrentPlayerIndex++;
            if (this.CurrentPlayerIndex >= this.Players.size)this.CurrentPlayerIndex = 0;
            this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
            message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`)
        }*/
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
            case "roll":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Roll(message)
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
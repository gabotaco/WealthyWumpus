const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({
    disableEveryone: true
});
const fs = require("fs")

bot.games = new Discord.Collection();

class Card {
    constructor(Text, Money, Jail, MoveTo, CollectFromPlayers) {
        this.Text = Text;
        this.Money = Money;
        this.GetOutOfJail = Jail;
        this.MoveTo = MoveTo
        this.CollectFromPlayers = CollectFromPlayers || false
    }
}
const CommunityChestCards = [
    new Card("Advance to \"Go\"", 200, false, 0),
    new Card("Bank error in your favor. Collect $200", 200, false, null),
    new Card("Doctor's fees", -50, false, null),
    new Card("From sale of stock you get $50", 50, false, null),
    new Card("Get Out of Jail Free", 0, true, null),
    new Card("Go to Jail. Go directly to jail. Do not pass Go, Do not collect $200", 0, false, 10),
    new Card("Grand Opera Night. Collect $50 from every player for opening night seats.", 50, false, null, true),
    new Card("Holiday Fund matures. Receive $100.", 100, false, null, false),
    new Card("Income tax refund. Collect $20", 20, false, null, false),
    new Card("It is your birthday. Collect $10 from every player.", 10, false, null, true),
    new Card("Life insurance matures - Collect $100", 100, false, null, false),
    new Card("Hospital Fees. Pay $50.", -50, false, null, false),
    new Card("School fees. Pay $50.", -50, false, null, false),
    new Card("Receive $25 consultancy fee.", 25, false, null, false),
    new Card("You have won second prize in a beauty contest. Collect $10.", 10, false, null, false),
    new Card("You inherit $100.", 100, false, null, false)
]

const ChanceCards = [
    new Card("Advance to \"Go\"", 200, false, 0, false),
    new Card("Advance to Illinois Ave. If you pass Go, collect $200", 0, false, 24, false),
    new Card("Advance to St. Charles Place. If you pass Go, collect $200", 0, false, 16, false),
    new Card("Bank pays you dividend of $50.", 50, false, null, false),
    new Card("Get out of Jail Free", 0, true, null, false),
    new Card("Go to Jail. Go directly to Jail", 0, false, 10, false),
    new Card("Pay poor tax of $15", -15, false, null, false),
    new Card("Take a trip to Reading Railroad", 0, false, 5, false),
    new Card("Take a walk on Board walk", 0, false, 39, false),
    new Card("You have been elected Chairman of the Board. Pay each player $50", -50, false, null, true),
    new Card("Your building loan matures. Receive $150.", 150, false, null, false),
    new Card("You have won a crossword competition. Collect $100", 100, false, null, false)
]

class Property {
    constructor(Name, Rent, Color, Price, Mortgage, Building) {
        this.Name = Name;
        this.Rent = Rent;
        this.Color = Color;
        this.Price = Price;
        this.Mortgage = Mortgage;
        this.Building = Building;
        this.Mortgaged = false;
        this.Owner = null;
        this.Houses = 0;
    }

    Buy(NewOwner) {
        this.Owner = NewOwner;
        if (!this.Mortgaged) {
            switch (this.Color) {
                case "DARK_ORANGE":
                    NewOwner.Brown++;
                    break;
                case "BLUE":
                    NewOwner.LightBlue++;
                    break;
                case "LUMINOUS_VIVID_PINK":
                    NewOwner.Pink++;
                    break;
                case "Utility":
                    NewOwner.Utility++;
                    break;
                case "RR":
                    NewOwner.RR++;
                    break;
                case "ORANGE":
                    NewOwner.Orange++;
                    break;
                case "DARK_RED":
                    NewOwner.Red++;
                    break;
                case "GOLD":
                    NewOwner.Yellow++;
                    break;
                case "DARK_GREEN":
                    NewOwner.Green++;
                    break;
                case "DARK_BLUE":
                    NewOwner.DarkBlue++;
                    break;
            }
        }
    }

    Info() {
        const PropertyEmbed = new Discord.RichEmbed()
            .setColor(this.Color)
            .setTitle(this.Name)
            .addField("Price", this.Price, true)
            .addField("Mortgage", this.Mortgage, true)
            .addField("Price per building", this.Building, true)
        if (typeof (this.Rent) != Number) {
            for (let i = 0; i < this.Rent.length; i++) {
                if (i == 5) {
                    PropertyEmbed.addField("1 Hotel", this.Rent[i], true)
                } else {
                    if (this.Color == "RR") {
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"RR":"RR's"}`, this.Rent[i], true)
                    } else if (this.Color == "Utility") {
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"Utility":"Utilities"}`, this.Rent[i] + " * dice roll", true)

                    } else {
                        PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"House":"Houses"}`, this.Rent[i], true)

                    }
                }
            }
        }
        return PropertyEmbed;
    }
}

class Offer {
    constructor(PropertyIndex, Price, OriginalOwner) {
        this.PropertyIndex = PropertyIndex;
        this.Price = Price;
        this.OriginalOwner = OriginalOwner;
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
        this.GetOutOfJail = 0;
        this.Doubles = false;
        this.Rolled = false;
        this.DoublesStreak = 0;
        this.Worth = 0;
        this.JailTime = 0;
        this.CurrentOffer = null;
        this.PaidPlayer = null;
    }

    RemoveMoney(message, num, OtherPlayer) {
        this.Money -= parseInt(num)
        if (this.Money < 0) {
            message.channel.send(`<@${this.ID}> you are in debt!! If you are still in debt when you end your turn you will lose!`)
            this.PaidPlayer = OtherPlayer

            Game.Players.delete(this.ID)
        }
    }

    AddMoney(message, num) {
        this.Money += parseInt(num);
    }

    Move(message, spaces, Properties) {
        this.Position += spaces;
        if (this.Position >= Properties.length) {
            this.AddMoney(message, 200);
            this.Position -= Properties.length;
            message.reply("you passed go!")
        }
    }
}

class Game {
    constructor(message) {
        this.HighestBid = 0;
        this.Bidders = []
        this.Bidding = false;
        this.BiddersIndex = 0;

        this.InProgress = false;

        this.Leader = message.author.id;

        this.Players = new Discord.Collection();
        this.Players.set(message.author.id, new Player(message.author.id))

        this.CurrentPlayer = null;

        this.Properties = [
            /* 0 */
            new Property("GO", 0, "GO"),
            /* 1 */
            new Property("Mediterranean Avenue (Brown)", [2, 10, 30, 90, 160, 250], "DARK_ORANGE", 60, 30, 50),
            /* 2 */
            new Property("Community Chest", 0, "Chest"),
            /* 3 */
            new Property("Baltic Avenue (Brown)", [4, 20, 60, 180, 320, 450], "DARK_ORANGE", 60, 30, 50),
            /* 4 */
            new Property("Income Tax", 200, "Tax"),
            /* 5 */
            new Property("Reading Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            /* 6 */
            new Property("Oriental Avenue (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50),
            /* 7 */
            new Property("Chance", 0, "Chance"),
            /* 8 */
            new Property("Vermont Avenue (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50),
            /* 9 */
            new Property("Connecticut Avenue (Light Blue)", [8, 40, 100, 300, 450, 600], "BLUE", 120, 60, 50),
            /* 10 */
            new Property("Jail", 0, "Jail"),
            /* 11 */
            new Property("St. Charles Place (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100),
            /* 12 */
            new Property("Electric Company", [0, 4, 10], "Utility", 150, 75, 0),
            /* 13 */
            new Property("States Avenue (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100),
            /* 14 */
            new Property("Virginia Avenue (Pink)", [12, 60, 180, 500, 700, 900], "LUMINOUS_VIVID_PINK", 160, 80, 100),
            /* 15 */
            new Property("Pennsylvania Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            /* 16 */
            new Property("St. James Place (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100),
            /* 17 */
            new Property("Community Chest", 0, "Chest"),
            /* 18 */
            new Property("Tennessee Avenue (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100),
            /* 19 */
            new Property("New York Avenue (Orange)", [16, 80, 220, 600, 800, 1000], "ORANGE", 200, 100, 100),
            /* 20 */
            new Property("Free Parking", 0, "Parking"),
            /* 21 */
            new Property("Kentucky Avenue (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150),
            /* 22 */
            new Property("Chance", 0, "Chance"),
            /* 23 */
            new Property("Indiana Avenue (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150),
            /* 24 */
            new Property("Illinois Avenue (Red)", [20, 100, 300, 750, 925, 1100], "DARK_RED", 240, 120, 150),
            /* 25 */
            new Property("B. & O. Railroad", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            /* 26 */
            new Property("Atlantic Avenue (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150),
            /* 27 */
            new Property("Ventnor Avenue (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150),
            /* 28 */
            new Property("Water Works", [0, 4, 10], "Utility", 150, 75, 0),
            /* 29 */
            new Property("Marvin Gardens (Yellow)", [24, 120, 360, 850, 1025, 1200], "GOLD", 280, 140, 150),
            /* 30 */
            new Property("Go To Jail", 0, "Go To Jail"),
            /* 31 */
            new Property("Pacific Avenue (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200),
            /* 32 */
            new Property("North Carolina Avenue (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200),
            /* 33 */
            new Property("Community Chest", 0, "Chest"),
            /* 34 */
            new Property("Pennsylvania Avenue (Green)", [28, 150, 450, 1000, 1200, 1400], "DARK_GREEN", 320, 160, 200),
            /* 35 */
            new Property("Short Line", [0, 25, 50, 100, 200], "RR", 200, 100, 0),
            /* 36 */
            new Property("Chance", 0, "Chance"),
            /* 37 */
            new Property("Park Place (Dark Blue)", [35, 175, 500, 1100, 1300, 1500], "DARK_BLUE", 350, 175, 200),
            /* 38 */
            new Property("Luxury Tax", 100, "Tax"),
            /* 39 */
            new Property("Boardwalk (Dark Blue)", [50, 200, 600, 1400, 1700, 2000], "DARK_BLUE", 400, 200, 200)
        ]

        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game`);
    }

    NewPlayer(message) {
        if (this.Players.has(message.author.id)) return message.reply("you are already in this game!")
        if (this.Players.length == 8) return message.reply("the game is full!")
        if (this.InProgress) return message.reply("you can't join a game thats already started!")

        this.Players.set(message.author.id, new Player(message.author.id))
        message.reply(`welcome to the game! We currently have ${this.Players.size} players!`)
    }

    PlayerLeave(message) {
        if (!this.Players.has(message.author.id)) return message.reply("You aren't in this game!")
        if (message.author.id == this.Leader) return message.reply(`the leader can't leave! Do ${botconfig.prefixes[message.guild.id].prefix}leader to change the leader!`)
        if (this.InProgress) return message.reply("You can't leave in the middle of a game!")

        this.Players.delete(message.author.id)
        message.reply(`sorry to see you leave :(`)
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
        if (this.InProgress) return message.reply(`the game has already started! It is <@${this.CurrentPlayer.ID}>'s turn!`)

        this.InProgress = true;
        this.CurrentPlayerIndex = Math.floor(Math.random() * this.Players.size)
        this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]

        message.channel.send(`Lets get the show on the road! <@${this.CurrentPlayer.ID}>, you are going first! Do ${botconfig.prefixes[message.guild.id].prefix}roll to roll!`)
    }

    Roll(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply("it's not your turn!")
        if (this.CurrentPlayer.Rolled) return message.reply("you already rolled")

        this.CurrentPlayer.Rolled = true

        const Dice1 = Math.floor(Math.random() * 6) + 1;
        const Dice2 = Math.floor(Math.random() * 6) + 1;

        message.reply(`you rolled a ${Dice1} and a ${Dice2}`)

        if (this.CurrentPlayer.Jailed) {
            this.CurrentPlayer.JailTime++;
            if (Dice1 == Dice2) {
                message.reply("You rolled doubles and got out of jail free!")
                this.CurrentPlayer.JailTime = 0;
                this.CurrentPlayer.Jailed = false;
                this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties)
            } else {
                if (this.CurrentPlayer.GetOutOfJail > 0) {
                    this.CurrentPlayer.GetOutOfJail--;
                    this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties)
                    this.CurrentPlayer.Jailed = false;
                    this.CurrentPlayer.JailTime = 0;
                    message.reply("Used one of your get out of jail free cards and got out of jail!")
                } else {
                    if (this.CurrentPlayer.JailTime == 3) {
                        this.CurrentPlayer.RemoveMoney(message, 50, null);
                        this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties)
                        this.CurrentPlayer.Jailed = false;
                        message.reply("Payed 50 dollars and got out of jail.")
                        this.CurrentPlayer.JailTime = 0;
                    } else {
                        message.reply("You are in jail and cannot move!")
                    }

                }
            }
        } else {
            this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties)
        }

        const CurrentProperty = this.Properties[this.CurrentPlayer.Position]
        const PropertyEmbed = CurrentProperty.Info();

        if (CurrentProperty.Color == "GO") {
            message.reply("You landed on go and collected $200. You now have $" + this.CurrentPlayer.Money)
        } else if (CurrentProperty.Color == "Chest" || CurrentProperty.Color == "Chance") {
            if (CurrentProperty.Color == "Chest") {
                var card = CommunityChestCards[Math.floor(Math.random() * CommunityChestCards.length)]
            } else if (CurrentProperty.Color == "Chance") {
                var card = ChanceCards[Math.floor(Math.random() * ChanceCards.length)]
            }

            let Message = `you landed on a ${CurrentProperty.Color.toLowerCase()} card and it says "${card.Text}".`
            if (card.MoveTo == 10) {
                this.CurrentPlayer.Position = 10
                this.CurrentPlayer.Jailed = true;
            } else if (card.GetOutOfJail) {
                this.CurrentPlayer.GetOutOfJail++;
            } else if (card.MoveTo != null) {
                if (card.MoveTo < this.CurrentPlayer.Position) {
                    this.CurrentPlayer.AddMoney(message, 200)
                    Message += ` You passed go and collected $200! You now have $${this.CurrentPlayer.Money}`
                    this.CurrentPlayer.Position = card.MoveTo
                } else {
                    this.CurrentPlayer.Position = card.MoveTo
                }
            } else if (card.CollectFromPlayers) {
                if (card.Money < 0) {
                    this.CurrentPlayer.RemoveMoney(message, (this.Players.size * card.Money) * -1, null)
                    Message += ` You lost $${this.Players.size * card.Money * -1} and now have $${this.CurrentPlayer.Money}`
                    this.Players.array().forEach(player => {
                        if (player.ID != this.CurrentPlayer.ID) {
                            player.AddMoney(message, card.Money * -1)
                        }
                    });
                } else {
                    this.CurrentPlayer.AddMoney(message, this.Players.size * card.Money)
                    Message += ` You collected $${this.Players.size * card.Money} and now have $${this.CurrentPlayer.Money}`
                    this.Players.array().forEach(player => {
                        if (player.ID != this.CurrentPlayer.ID) {
                            player.RemoveMoney(message, card.Money, null)
                        }
                    });
                }

            } else {
                if (card.Money < 0) {
                    this.CurrentPlayer.RemoveMoney(message, card.Money * -1, null)
                } else {
                    this.CurrentPlayer.AddMoney(message, card.Money)
                }
                Message += ` You now have $${this.CurrentPlayer.Money}`
            }
            message.reply(Message)
        } else if (CurrentProperty.Color == "Tax") {
            if ((this.CurrentPlayer.Money + this.CurrentPlayer.Worth) * 0.1 < 200) {
                this.CurrentPlayer.RemoveMoney(message, (this.CurrentPlayer.Money + this.CurrentPlayer.Worth) * 0.1, null)
                message.reply(`you landed on ${CurrentProperty.Name} and payed $${(this.CurrentPlayer.Money + this.CurrentPlayer.Worth) * 0.1} (10%). You now have $${this.CurrentPlayer.Money}`)

            } else {
                this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent, null)
                message.reply(`you landed on ${CurrentProperty.Name} and payed $${CurrentProperty.Rent}. You now have $${this.CurrentPlayer.Money}`)
            }
        } else if (CurrentProperty.Color == "Jail") {
            if (!this.CurrentPlayer.Jailed) message.reply("you are just visiting jail.")

        } else if (CurrentProperty.Color == "Utility") {
            if (CurrentProperty.Owner) {
                if (CurrentProperty.Owner.ID != this.CurrentPlayer.ID) {
                    if (CurrentProperty.Mortgaged) {
                        message.reply(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`)
                    } else {
                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.Utility], CurrentProperty.Owner)
                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.Utility])
                        message.reply(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and paid him $${CurrentProperty.Rent[CurrentProperty.Owner.Utility]}. You now have ${this.CurrentPlayer.Money}`)
                    }
                } else {
                    message.reply(`You landed on your own ${CurrentProperty.Name}...`)
                }
            } else {
                message.reply(`You landed on ${CurrentProperty.Name} and it costs $${CurrentProperty.Price}. Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it!`)
            }
        } else if (CurrentProperty.Color == "Parking") {
            message.reply("You landed on free parking.")
        } else if (CurrentProperty.Color == "Go To Jail") {
            message.reply("You landed on go to jail!")
            this.CurrentPlayer.Position = 10;
            this.CurrentPlayer.Jailed = true;

        } else if (CurrentProperty.Color == "RR") {
            if (CurrentProperty.Owner) {
                if (CurrentProperty.Mortgaged) {
                    message.reply(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`)
                } else {
                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.RR], CurrentProperty.Owner)
                    CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.RR])
                    message.reply(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and payed him $${CurrentProperty.Rent[CurrentProperty.Owner.RR]}`)
                }
            } else {
                message.reply(`You landed on ${CurrentProperty.Name} and it costs $${CurrentProperty.Price}. Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it!`)
            }
        } else {
            if (CurrentProperty.Owner) {
                if (CurrentProperty.Owner.ID == this.CurrentPlayer.ID) message.reply(`You landed on ${this.Properties[this.CurrentPlayer.Position].Name} but you already own it...`)
                else {
                    if (CurrentProperty.Mortgaged) {
                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}> but it is mortgaged...`)
                    } else {
                        if (CurrentProperty.Houses > 0) {
                            message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                            this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                            CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                        } else {
                            switch (CurrentProperty.Color) {
                                case "DARK_ORANGE":
                                    if (CurrentProperty.Owner.Brown < 2) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)
                                    }
                                    break;
                                case "BLUE":
                                    if (CurrentProperty.Owner.LightBlue < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)
                                    }
                                    break;
                                case "LUMINOUS_VIVID_PINK":
                                    if (CurrentProperty.Owner.Pink < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }
                                    break;
                                case "ORANGE":
                                    if (CurrentProperty.Owner.Orange < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }
                                    break;
                                case "DARK_RED":
                                    if (CurrentProperty.Owner.Red < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }
                                    break;
                                case "GOLD":
                                    if (CurrentProperty.Owner.Yellow < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }

                                    break;
                                case "DARK_GREEN":
                                    if (CurrentProperty.Owner.Green < 3) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }
                                    break;
                                case "DARK_BLUE":
                                    if (CurrentProperty.Owner.DarkBlue < 2) {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`)
                                    } else {
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        message.reply(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`)

                                    }
                                    break;
                            }
                        }
                    }
                }
            } else {
                message.channel.send(PropertyEmbed)
                message.channel.send(`Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy the property or do ${botconfig.prefixes[message.guild.id].prefix}end to end your turn`)
            }
        }

        if (Dice1 == Dice2) {
            this.CurrentPlayer.Doubles = true;
            this.CurrentPlayer.DoublesStreak++;
            if (this.CurrentPlayer.DoublesStreak == 3) {
                this.CurrentPlayer.DoublesStreak = 0;
                this.CurrentPlayer.Position = 10;
                this.CurrentPlayer.Jailed = true;
                this.CurrentPlayer.Doubles = false;
                message.reply("you rolled doubles 3 times in a row and are now in jail!")
            } else {
                message.reply("you rolled doubles so you get to go again!")
            }
        } else {
            this.CurrentPlayer.Doubles = false;
            this.CurrentPlayer.DoublesStreak = 0;
        }

    }

    Stats(message) {
        if (!this.Players.has(message.author.id)) return message.reply("you aren't in this game")
        const player = this.Players.get(message.author.id)
        const PlayerEmbed = new Discord.RichEmbed()
            .setTitle(`Stats for ${message.member.displayName}`)
            .setColor("DEFAULT")
            .addField("Position", this.Properties[player.Position].Name, true)
            .addField("Money", player.Money, true)
            .addField("Get out of jail cards", player.GetOutOfJail, true)
            .addField("Currently Jailed?", player.Jailed, true)
            .addField("Rail roads", player.RR, true)
            .addField("Utilities", player.Utility, true)
            .addField("Brown Properties", player.Brown, true)
            .addField("Light blue properties", player.LightBlue, true)
            .addField("Pink properties", player.Pink, true)
            .addField("Orange Properties", player.Orange, true)
            .addField("Red properties", player.Red, true)
            .addField("Yellow properties", player.Yellow, true)
            .addField("Green properties", player.Green, true)
            .addField("Dark blue properties", player.DarkBlue, true)
        message.channel.send(PlayerEmbed)
    }

    Buy(message) {
        if (!this.Players.has(message.author.id)) return message.reply("you aren't in this game.")
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply("it's not your turn!")

        const CurrentProperty = this.Properties[this.CurrentPlayer.Position]
        if (!CurrentProperty.Price) return message.reply("you can't buy this!")
        if (CurrentProperty.Owner) return message.reply(`<@${CurrentProperty.Owner.ID}> already owns this!`)
        if (CurrentProperty.Price > this.CurrentPlayer.Money) return message.reply("you don't have enough money to buy this!")
        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Price, null);
        CurrentProperty.Buy(this.CurrentPlayer)
        this.CurrentPlayer.Worth += CurrentProperty.Price;
        message.reply(`you bought ${CurrentProperty.Name}!`)
    }

    End(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply('its not your turn')
        if (!this.CurrentPlayer.Rolled) return message.reply("you haven't rolled yet")

        if (this.CurrentPlayer.Money <= 0) {
            this.Players.delete(this.CurrentPlayer.ID)
            message.channel.send(`<@${this.CurrentPlayer.ID}> went bankrupt!`)
            if (this.CurrentPlayer.PaidPlayer) {
                let MoneyForNewPlayer = 0;
                for (let i = 0; i < this.Properties.length; i++) {
                    const CurrentProperty = this.Properties[i]
                    if (CurrentProperty.Owner && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                        for (let j = CurrentProperty.Houses; j > 0; j--) {
                            CurrentProperty.Houses--;
                            MoneyForNewPlayer += Math.round(CurrentProperty.Building / 2)
                        }
                        CurrentProperty.Buy(MoneyForNewPlayer)
                    }
                }
                this.CurrentPlayer.PaidPlayer.AddMoney(message, MoneyForNewPlayer)
            } else {
                this.CurrentPlayerIndex--;
                for (let i = 0; i < this.Properties.length; i++) {
                    const CurrentProperty = this.Properties[i]
                    if (CurrentProperty.Owner && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                        CurrentProperty.Houses = 0;
                        CurrentProperty.Owner = null
                        CurrentProperty.Mortgaged = false;
                    }
                }

            }

            if (this.Players.size == 1) {
                message.channel.send(`CONGRATS <@${this.Players[0].ID}> YOU HAVE WON!`)
                bot.games.delete(message.channel.id)
            }
        }

        if (!this.Properties[this.CurrentPlayer.Position].Owner && this.Properties.Price) {
            this.Bidding = true;
            this.HighestBid = 0
            this.Bidders = this.Players.concat().array()
            this.BiddersIndex = this.CurrentPlayerIndex;
            message.channel.send(`Let the bidding begin! <@${this.Bidders[this.BiddersIndex].ID}> type !bid [amount] to place a bid or type !bid quit to back out.`)
        } else {
            this.CurrentPlayer.Rolled = false;
            if (this.CurrentPlayer.Doubles && this.CurrentPlayer.Money > 0) {
                message.reply("roll again!")
            } else {
                this.CurrentPlayerIndex++;
                if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0;
                this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
                message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`)
            }
        }
    }

    Auction(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (!this.Bidding) return message.reply("not currently bidding")
        if (this.Bidders[this.BiddersIndex].ID != message.author.id) return message.reply(`the current bidder is <@${Bidders[this.BiddersIndex].ID}>!`)

        let amount = message.content.split(" ")[1]
        if (amount.toLowerCase() == "quit") {
            this.Bidders.splice(this.BiddersIndex, 1)
            message.reply("removed you from the bidders")
            if (this.Bidders.length == 1) {
                this.Bidding = false;
                const winner = this.Players.get(this.Bidders[0].ID)
                const CurrentProperty = this.Properties[this.CurrentPlayer.Position]
                message.channel.send(`<@${winner.ID}> congrats you won ${this.Properties[this.CurrentPlayer.Position].Name} for $${this.HighestBid}`)
                winner.RemoveMoney(message, this.HighestBid, null);
                CurrentProperty.Buy(winner)
                this.CurrentPlayer.Rolled = false;
                if (this.CurrentPlayer.Doubles) {
                    message.channel.send(`<@${this.CurrentPlayer.ID}> roll again!`)
                } else {
                    this.CurrentPlayerIndex++;
                    if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0;
                    this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
                    message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`)
                }
            } else {
                if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0;
                message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid!`)
            }
        } else {
            amount = parseInt(amount)
            if (!amount) return message.reply("you must specify a valid amount or say !bid quit")
            if (amount <= this.HighestBid) return message.reply(`you must bid higher than $${this.HighestBid} or say !bid quit`)
            this.HighestBid = amount;
            this.BiddersIndex++;
            if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0;
            message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid!`)
        }
    }

    BuyProperty(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply('its not your turn')

        let LeastHouses = 10;
        let PropertyIndex;
        for (let i = 0; i < this.Properties.length; i++) {
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Houses < LeastHouses && CurrentProperty.Owner.ID == this.CurrentPlayer.ID && CurrentProperty.Building <= this.CurrentPlayer.Money && CurrentProperty.Houses < 5) {
                switch (CurrentProperty.Color) {
                    case "DARK_ORANGE":
                        if (CurrentProperty.Owner.Brown == 2) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "BLUE":
                        if (CurrentProperty.Owner.LightBlue == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "LUMINOUS_VIVID_PINK":
                        if (CurrentProperty.Owner.Pink == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "ORANGE":
                        if (CurrentProperty.Owner.Orange == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "DARK_RED":
                        if (CurrentProperty.Owner.Red == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "GOLD":
                        if (CurrentProperty.Owner.Yellow == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "DARK_GREEN":
                        if (CurrentProperty.Owner.Green == 3) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                    case "DARK_BLUE":
                        if (CurrentProperty.Owner.DarkBlue == 2) {
                            LeastHouses = CurrentProperty.Houses;
                            PropertyIndex = i;
                        }
                        break;
                }
            }
        }
        if (!PropertyIndex) return message.reply("you can't buy a house on anything!")
        this.CurrentPlayer.RemoveMoney(message, this.Properties[PropertyIndex].Building, null)
        this.Properties[PropertyIndex].Houses++;
        message.reply(`you spent $${this.Properties[PropertyIndex].Building} and now have ${this.Properties[PropertyIndex].Houses} ${(this.Properties[PropertyIndex].Houses == 1)?"house":"houses"} on it!`)
    }

    Sell(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply('its not your turn')

        let Arg = message.content.split(" ")[1]
        let Money = parseInt(message.content.split(" ")[3])
        const reciever = this.Players.get(message.mentions.members.first().id);
        if (!reciever || !Arg || !Money) return message.reply(".sell [property] [reciever] [cost]")
        if (reciever == this.Players.get(message.author.id)) return message.channel.send("You can't ")
        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) {
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                if (FoundHouseIndex) {
                    return message.reply("you have to be more specific with the property name")
                } else {
                    FoundHouseIndex = i
                }
            }
        }
        if (!FoundHouseIndex) return message.reply("couldn't find that property")
        if (this.Properties[FoundHouseIndex].Houses > 0) {
            this.CurrentPlayer.AddMoney(message, Math.round(this.Properties[FoundHouseIndex].Building / 2));
            this.Properties[FoundHouseIndex].Houses--;
            message.reply(`you sold 1 house for $${Math.round(this.Properties[FoundHouseIndex].Building / 2)} and now have ${this.Properties[FoundHouseIndex].Houses} ${(this.Properties[FoundHouseIndex].Houses == 1)?"house":"houses"} on it!`)
        } else {
            switch (this.Properties[FoundHouseIndex].Color) {
                case "DARK_ORANGE":
                    if (this.Properties[1].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                    } else if (this.Properties[3].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                    }
                    break;
                case "BLUE":
                    if (this.Properties[6].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                    } else if (this.Properties[8].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                    } else if (this.Properties[9].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                    }
                    break;
                case "LUMINOUS_VIVID_PINK":
                    if (this.Properties[11].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                    } else if (this.Properties[13].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                    } else if (this.Properties[14].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                    }
                    break;
                case "ORANGE":
                    if (this.Properties[16].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                    } else if (this.Properties[18].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                    } else if (this.Properties[19].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                    }
                    break;
                case "DARK_RED":
                    if (this.Properties[21].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                    } else if (this.Properties[23].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                    } else if (this.Properties[24].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                    }
                    break;
                case "GOLD":
                    if (this.Properties[26].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                    } else if (this.Properties[27].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                    } else if (this.Properties[29].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                    }
                    break;
                case "DARK_GREEN":
                    if (this.Properties[31].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                    } else if (this.Properties[32].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                    } else if (this.Properties[34].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                    }
                    break;
                case "DARK_BLUE":
                    if (this.Properties[37].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                    } else if (this.Properties[39].Houses > 0) {
                        return message.reply(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                    }
                    break;
            }
            if (reciever.CurrentOffer) return message.reply("they have a pending offer already!")
            reciever.CurrentOffer = new Offer(FoundHouseIndex, Money, this.CurrentPlayer)
            message.channel.send(`<@${reciever.ID}>, <@${message.author.id}> has offered you ${this.Properties[FoundHouseIndex].Name} for $${Money}`)
        }
    }

    Offer(message) {
        if (!this.InProgress) return message.reply(`the game hasen't started yet!`)
        if (!this.Players.has(message.author.id)) return message.reply("you aren't in the game!")
        const Player = this.Players.get(message.author.id);
        if (!Player.CurrentOffer) return message.reply("you don't have a pending offer")
        const Property = this.Properties[Player.CurrentOffer.PropertyIndex]
        if (Player.CurrentOffer.OriginalOwner.ID != Property.Owner.ID) {
            Player.CurrentOffer = null;
            return message.reply("someone already bought it!")
        }
        let answer = message.content.split(" ")[1].toLowerCase();
        let amount = parseInt(message.content.split(" ")[2]);
        if ((!answer) || (answer != "deny" && !amount)) return message.reply(".offer [confirm|deny] [amount]")
        if (answer == "confirm") {
            if (amount == Player.CurrentOffer.Price) {
                Property.Buy(Player)
                Player.RemoveMoney(message, Player.CurrentOffer.Price, this.Players.get(PLayer.CurrentOffer.OriginalOwner.ID))
                this.Players.get(Player.CurrentOffer.OriginalOwner.ID).AddMoney(message, Player.CurrentOffer.Price)
                Player.CurrentOffer = null;
                return message.reply(`you bought ${Property.Name} for $${Player.CurrentOffer.Price}`);
            } else {
                return message.reply(`the price is $${Player.CurrentOffer.Price}. Either .offer confirm ${Player.CurrentOffer.Price} or .offer deny`)
            }
        } else if (answer == "deny") {
            Player.CurrentOffer = null;
            return message.reply(`denied.`)
        } else {
            return message.reply(`.offer [confirm|deny] {amount}`)
        }
    }

    Mortgage(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply('its not your turn')

        let Arg = message.content.split(" ")[1]
        if (!Arg) return message.reply("You must specify what property you want to mortgage!")

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) {
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                if (FoundHouseIndex) {
                    return message.reply("you have to be more specific with the property name")
                } else {
                    FoundHouseIndex = i
                }
            }
        }
        if (!FoundHouseIndex) return message.reply("couldn't find that property")
        const FoundHouse = this.Properties[FoundHouseIndex]

        switch (FoundHouse.Color) {
            case "DARK_ORANGE":
                if (this.Properties[1].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                } else if (this.Properties[3].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                }
                FoundHouse.Owner.Orange--;
                break;
            case "BLUE":
                if (this.Properties[6].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                } else if (this.Properties[8].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                } else if (this.Properties[9].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                }
                FoundHouse.Owner.LightBlue--;
                break;
            case "LUMINOUS_VIVID_PINK":
                if (this.Properties[11].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                } else if (this.Properties[13].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                } else if (this.Properties[14].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                }
                FoundHouse.Owner.Pink--;
                break;
            case "ORANGE":
                if (this.Properties[16].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                } else if (this.Properties[18].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                } else if (this.Properties[19].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                }
                FoundHouse.Owner.Orange--;
                break;
            case "DARK_RED":
                if (this.Properties[21].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                } else if (this.Properties[23].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                } else if (this.Properties[24].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                }
                FoundHouse.Owner.Red--;
                break;
            case "GOLD":
                if (this.Properties[26].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                } else if (this.Properties[27].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                } else if (this.Properties[29].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                }
                FoundHouse.Owner.Yellow--;
                break;
            case "DARK_GREEN":
                if (this.Properties[31].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                } else if (this.Properties[32].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                } else if (this.Properties[34].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                }
                FoundHouse.Owner.Green--;
                break;
            case "DARK_BLUE":
                if (this.Properties[37].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                } else if (this.Properties[39].Houses > 0) {
                    return message.reply(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                }
                FoundHouse.Owner.DarkBlue--;
                break;
        }

        FoundHouse.Mortgaged = true;
        FoundHouse.Owner.AddMoney(message, FoundHouse.Mortgage)
    }

    Unmortgage(message) {
        if (!this.InProgress) return message.reply("the game hasen't started yet!")
        if (message.author.id != this.CurrentPlayer.ID) return message.reply('its not your turn')

        let Arg = message.content.split(" ")[1]
        if (!Arg) return message.reply("You must specify what property you want to unmortgage!")

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) {
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID && CurrentProperty.Mortgaged) {
                if (FoundHouseIndex) {
                    return message.reply("you have to be more specific with the property name")
                } else {
                    FoundHouseIndex = i
                }
            }
        }
        if (!FoundHouseIndex) return message.reply("couldn't find that property")
        const FoundHouse = this.Properties[FoundHouseIndex]

        const Price = FoundHouse.Mortgage * 1.10;

        if (Price > this.CurrentPlayer.Money) return message.reply(`you don't have enough money to unmortgage it for $${Price}.`)

        switch (FoundHouse.Color) {
            case "DARK_ORANGE":
                FoundHouse.Owner.Orange++;
                break;
            case "BLUE":
                FoundHouse.Owner.LightBlue++;
                break;
            case "LUMINOUS_VIVID_PINK":
                FoundHouse.Owner.Pink++;
                break;
            case "ORANGE":
                FoundHouse.Owner.Orange++;
                break;
            case "DARK_RED":
                FoundHouse.Owner.Red++;
                break;
            case "GOLD":
                FoundHouse.Owner.Yellow++;
                break;
            case "DARK_GREEN":
                FoundHouse.Owner.Green++;
                break;
            case "DARK_BLUE":
                FoundHouse.Owner.DarkBlue++;
                break;
        }

        this.CurrentPlayer.RemoveMoney(message, Price, null)

        FoundHouse.Mortgaged = false;
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

    if (!botconfig.prefixes[message.guild.id]) botconfig.prefixes[message.guild.id] = {
        "prefix": "!"
    }
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
            case "stop":
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
            case "stats":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Stats(message)
                }
                break;
            case "buy":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Buy(message)
                }
                break;
            case "end":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).End(message)
                }
                break;
            case "bid":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Auction(message)
                }
                break;
            case "property":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).BuyProperty(message)
                }
                break;
            case "sell":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Sell(message)
                }
                break;
            case "offer":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Offer(message)
                }
                break;
            case "mortgage":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Mortgage(message)
                }
                break;
            case "unmortgage":
                if (!bot.games.has(message.channel.id)) {
                    message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {
                    bot.games.get(message.channel.id).Unmortgage(message)
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
const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({
    disableEveryone: true
});
const fs = require("fs")

bot.games = new Discord.Collection(); //stores all games

class Card {
    constructor(Text, Money, GetOutOfJail, MoveTo, CollectFromPlayers) {
        this.Text = Text; //what it says on the card
        this.Money = Money; //change in money
        this.GetOutOfJail = GetOutOfJail; //if its get out of jail
        this.MoveTo = MoveTo //what space to move to
        this.CollectFromPlayers = CollectFromPlayers || false //if you collect from players (default is false)
    }
}

const ChanceCards = [ //Chance cards
    new Card("Get out of jail free", 0, true, null, false),
    new Card("Advance to Go", 0, false, 0, false),
    new Card("Go to jail. Do not pass Go, do not collect $200", 0, false, 10, false),
    new Card("You got a lucky loot crate! Collect $50 from every other player", 50, false, null, true),
    new Card("Advance to Hell. If you pass go, collect $200", 0, false, 24, false),
    new Card("Advance to Hypesquad Balance", 0, false, 35, false),
    new Card("Advance to Hypesquad Bravery", 0, false, 15, false),
    new Card("Advance to Hypsquad Brilliance", 0, false, 25, false),
    new Card("Advance to Wumpus’ Wonderful Rail", 0, false, 5, false),
    new Card("Advance to Final Destination", 0, false, 39, false),
    new Card("Your game saves all got corrupted. Pay $30 to each player", -30, false, null, true),
    new Card("You bought Nitro on a second account, just to get another server boost. Pay $15", -15, false, null, false),
    new Card("You decided to gift a year’s worth of Nitro to all of your closest friends. Pay each player $50", -50, false, null, true),
    new Card("You got the new Call of Duty, but decided to return it. Receive $50", 15, false, null, false),
    new Card("Advance to Go, and collect $200", 0, false, 0, false),
    new Card("Your mom sent a check in the mail. Receive $150", 150, false, null, false),
    new Card("You won the lottery! Kinda. Receive $100", 100, false, null, false),
    new Card("Advance to the Server Room", 0, false, 12, false)
]

const CommunityChestCards = [ //Community Chest cards
    new Card("You got a victory royale as John Wick! Collect $150", 150, false, null, false),
    new Card("Go to jail. Do not pass Go, do not collect $200", 0, false, 10, false),
    new Card("Get out of jail free", 0, true, null, false),
    new Card("Advance to Summoner’s Rift. If you pass Go, collect $200", 0, false, 11, false),
    new Card("You sold your PS4. Receive $200", 200, false, null, false),
    new Card("You install your graphics card without grounding yourself, pay $200", -200, false, null, false),
    new Card("You beat the elite four on your first try collect $50", 50, false, null, false),
    new Card("You spilled coffee on your keyboard lose $100", -100, false, null, false),
    new Card("Your switch gets stolen lose $300", -300, false, null, false),
    new Card("You found your mothers credit card and bought some sick skins from loot crates, win $50", 50, false, null, false),
    new Card("You win a free headset out of a giveaway, win $100", 100, false, null, false),
    new Card("You realize you are addicted to collecting amiibo, lose $100", -100, false, null, false),
    new Card("Save money on GFUEL, collect $50", 50, false, null, false),
    new Card("Reach elite smash, win $50", 50, false, null, false),
    new Card("Get caught using discord during class, you lose $400", -400, false, null, false),
    new Card("Successfully reboot a game, win $50", 50, false, null, false),
    new Card("Pay for a year of spotify premium, lose $50", -50, false, null, false )
]

class Property { //Make a property
    constructor(Name, Rent, Color, Price, Mortgage, Building, Image) {
        this.Name = Name; //Name of the property
        this.Rent = Rent; //Array of prices based on how many houses they have [no house rent, 1 house rent, 2 house rent...]
        this.Color = Color; //The color of it (discord color or type)
        this.Price = Price; //Cost to buy
        this.Mortgage = Mortgage; //Money back when you mortgage
        this.Building = Building; //How much to buil a building
        this.Mortgaged = false; //if its mortgaged
        this.Owner = null; //who ownes it
        this.Houses = 0; //How many houses are on it
        this.Image = Image
    }

    Buy(NewOwner) { //Buy the property (doesn't charge)
        this.Owner = NewOwner; //change owner
        NewOwner.Worth += this.Price; //increase their worth
        if (!this.Mortgaged) { //if its not mortgaged
            NewOwner[this.Color]++; //increase amount they owner
        }
    }

    Info() { //gets info about the property
        const PropertyEmbed = new Discord.RichEmbed() //Sets the color, name of embed to property name, price, if its mortgaged, and price per building
            .setTitle(this.Name)
            .addField("Price", "$" + this.Price, true)
        if (this.Color == "Utility" || this.Color == "RR") { //not valid embed color
            PropertyEmbed.setColor("RANDOM")
        } else { //valid color
            PropertyEmbed.setColor(this.Color)
        }

        if (this.Image) PropertyEmbed.setImage(this.Image)

        return PropertyEmbed;
    }
}

const Props = [ //The board
    /* 0 */
    new Property("GO", 0, "GO"),
    /* 1 */
    new Property("Loot Lake (Brown)", [2, 10, 30, 90, 160, 250], "DARK_ORANGE", 60, 30, 50, "https://cdn.discordapp.com/attachments/593554477844529152/593595105651458060/LootLake.png"),
    /* 2 */
    new Property("Community Chest", 0, "Chest"),
    /* 3 */
    new Property("Desert Temple (Brown)", [4, 20, 60, 180, 320, 450], "DARK_ORANGE", 60, 30, 50, "https://cdn.discordapp.com/attachments/593554477844529152/593595602084823058/DesertTemple.png"),
    /* 4 */
    new Property("a Nitro Monthly Subscription", 200, "Tax"),
    /* 5 */
    new Property("Wumpus’ Wonderful Rail", [0, 25, 50, 100, 200], "RR", 200, 100, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593594152441348112/Wumpus_Wonderful_Rail.png"),
    /* 6 */
    new Property("Russian Metro (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50, "https://cdn.discordapp.com/attachments/593554477844529152/593596333214924823/RussianMetro.png"),
    /* 7 */
    new Property("Chance", 0, "Chance"),
    /* 8 */
    new Property("Rapture (Light Blue)", [6, 30, 90, 270, 400, 550], "BLUE", 100, 50, 50, "https://cdn.discordapp.com/attachments/593554477844529152/593597014017703976/Rapture.png"),
    /* 9 */
    new Property("Hoth (Light Blue)", [8, 40, 100, 300, 450, 600], "BLUE", 120, 60, 50, "https://cdn.discordapp.com/attachments/593554477844529152/593597945824280584/Hoth.png"),
    /* 10 */
    new Property("Jail", 0, "Jail"),
    /* 11 */
    new Property("Summoners Rift (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593598475942232074/SummonersRift.png"),
    /* 12 */
    new Property("Server Room", [0, 4, 10], "Utility", 150, 75, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593842980247568386/ServerRoom.png"),
    /* 13 */
    new Property("Peaches Castle (Pink)", [10, 50, 150, 450, 625, 750], "LUMINOUS_VIVID_PINK", 140, 70, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593599035978547204/PeachsCastle.png"),
    /* 14 */
    new Property("Vanilla Unicorn (Pink)", [12, 60, 180, 500, 700, 900], "LUMINOUS_VIVID_PINK", 160, 80, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593599604847673350/VanillaUnicorn.png"),
    /* 15 */
    new Property("Hypesquad Bravery", [0, 25, 50, 100, 200], "RR", 200, 100, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593592893718003726/HypesquadBravery.png"),
    /* 16 */
    new Property("Rockport (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593600200044576788/Rockport.png"),
    /* 17 */
    new Property("Community Chest", 0, "Chest"),
    /* 18 */
    new Property("San Andreas (Orange)", [14, 70, 200, 550, 750, 950], "ORANGE", 180, 90, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593600645768937483/SanAndreas.png"),
    /* 19 */
    new Property("Dust 2 (Orange)", [16, 80, 220, 600, 800, 1000], "ORANGE", 200, 100, 100, "https://cdn.discordapp.com/attachments/593554477844529152/593601895017218049/Dust2.png"),
    /* 20 */
    new Property("Free Parking", 0, "Parking"),
    /* 21 */
    new Property("Sanctuary (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593602679708581926/Sanctuary.png"),
    /* 22 */
    new Property("Chance", 0, "Chance"),
    /* 23 */
    new Property("Lethal Lava Land (Red)", [18, 90, 250, 700, 875, 1050], "DARK_RED", 220, 110, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593839802978140170/LethalLavaLand.png"),
    /* 24 */
    new Property("Hell (Red)", [20, 100, 300, 750, 925, 1100], "DARK_RED", 240, 120, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593603708009447444/Hell.png"),
    /* 25 */
    new Property("Hypesquad Brilliance", [0, 25, 50, 100, 200], "RR", 200, 100, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593591813781061699/HypesquadBrilliance.png"),
    /* 26 */
    new Property("Dustbowl (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593605130323099658/Dustbowl.png"),
    /* 27 */
    new Property("Victory Road (Yellow)", [22, 110, 330, 800, 975, 1150], "GOLD", 260, 130, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593605935872737290/VictoryRoad.png"),
    /* 28 */
    new Property("Service Provider", [0, 4, 10], "Utility", 150, 75, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593843119427026953/ServiceProvider.png"),
    /* 29 */
    new Property("Nuketown (Yellow)", [24, 120, 360, 850, 1025, 1200], "GOLD", 280, 140, 150, "https://cdn.discordapp.com/attachments/593554477844529152/593606660174512138/Nuketown.png"),
    /* 30 */
    new Property("Go To Jail", 0, "Go To Jail"),
    /* 31 */
    new Property("Green Hill Zone (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200, "https://cdn.discordapp.com/attachments/593554477844529152/593607156188577800/GreenHillZone.png"),
    /* 32 */
    new Property("Monkey Island (Green)", [26, 130, 390, 900, 1100, 1275], "DARK_GREEN", 300, 150, 200, "https://cdn.discordapp.com/attachments/593554477844529152/593607562478354435/MonkeyIsland.png"),
    /* 33 */
    new Property("Community Chest", 0, "Chest"),
    /* 34 */
    new Property("Sokrovenno (Green)", [28, 150, 450, 1000, 1200, 1400], "DARK_GREEN", 320, 160, 200, "https://cdn.discordapp.com/attachments/593554477844529152/593608397006569472/Sokrovenno.png"),
    /* 35 */
    new Property("Hypesquad Balance", [0, 25, 50, 100, 200], "RR", 200, 100, 0, "https://cdn.discordapp.com/attachments/593554477844529152/593592388803493888/HypesquadBalance.png"),
    /* 36 */
    new Property("Chance", 0, "Chance"),
    /* 37 */
    new Property("The End (Dark Blue)", [35, 175, 500, 1100, 1300, 1500], "DARK_BLUE", 350, 175, 200, "https://cdn.discordapp.com/attachments/593554477844529152/593609561231851521/TheEnd.png"),
    /* 38 */
    new Property("Nitro Boost", 100, "Tax"),
    /* 39 */
    new Property("Final Destination (Dark Blue)", [50, 200, 600, 1400, 1700, 2000], "DARK_BLUE", 400, 200, 200, "https://cdn.discordapp.com/attachments/593554477844529152/593610136950407178/FinalDestination.png")
]

class Offer { //contains info about an offer
    constructor(PropertyIndex, Price, OriginalOwner) {
        this.PropertyIndex = PropertyIndex; //Where the property is on the board
        this.Price = Price; //How much they are offering it for
        this.OriginalOwner = OriginalOwner; //Who the original owner is
    }
}

class Player {
    constructor(ID) {
        this.Position = 0; //What position they are
        this.Money = 1500; //How much money
        this.RR = 0; //How many RRs
        this.Jailed = false; //If they are jailed
        this.ID = ID //What their discord ID is
        this.DARK_ORANGE = 0; //How many brown houses
        this.BLUE = 0; //How many light blue houses
        this.LUMINOUS_VIVID_PINK = 0; //how many pink houses
        this.Utility = 0; //How many utilitys
        this.ORANGE = 0; //How many orange houses
        this.DARK_RED = 0; //How many red houses
        this.GOLD = 0; //How many yellow houses
        this.DARK_GREEN = 0; //How many green houses
        this.DARK_BLUE = 0; //How many dark blue houses
        this.GetOutOfJail = 0; //How many get out of jail cards they have
        this.Doubles = false; //If they just rolled doubles
        this.Rolled = false; //If they have roled yet
        this.DoublesStreak = 0; //How many times they've rolled doubles
        this.Worth = 0; //How much all their properties are worth
        this.JailTime = 0; //How long they have been in jail
        this.CurrentOffer = null; //If they have a current offer
        this.PaidPlayer = null; //Last player they paid
    }

    async RemoveMoney(message, num, OtherPlayer) { //remove money
        this.Money -= parseInt(num) //remove
        if (this.Money < 0) { //if they are bankrupt
            await message.channel.send(`<@${this.ID}>, you are in debt!! If you are still in debt when you end your turn you will lose!`) //notify
            this.PaidPlayer = OtherPlayer //set who made them bankrupt (can be null if bank)
        }
    }

    AddMoney(num) { //add money
        this.Money += parseInt(num);
    }

    Move(message, spaces, Properties) { //Move them
        return new Promise(async (resolve, reject) => {
            this.Position += spaces; //Move them num of spaces
            if (this.Position >= Properties.length) { //if they went around the board
                this.AddMoney(200); //add 200
                this.Position -= Properties.length; //move them back onto the board
                await message.channel.send("You passed go and collected $200!") //inform
            }
            resolve();
        })
    }

    Free() {
        this.JailTime = 0; //remove jail time
        this.Jailed = false; //unjail
    }

    Jail() {
        this.Position = 10;
        this.Jailed = true;
        this.JailTime = 0;
    }
}

class Game {
    constructor(message) {
        this.HighestBid = 0; //Current highest bid
        this.Bidders = [] //Who is bidding
        this.Bidding = false; //if we are bidding
        this.BiddersIndex = 0; //who is currently bidding

        this.InProgress = false; //if the game is in progress

        this.Leader = message.author.id; //Leader is who made the game

        this.Players = new Discord.Collection(); //make a collection of players
        this.Players.set(message.author.id, new Player(message.author.id)) //add the leader to players

        this.CurrentPlayer = null; //Currently player

        this.Properties = Props;

        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game or react with the hand below!`).then(async msg => await msg.react("🖐"));
    }

    async NewPlayer(message, user) { //new player
        if (!user) {
            var userID = message.author.id;
            if (this.Players.has(userID)) return await message.channel.send(`<@${userID}>, you are already in this game!`) //Already in the game
            if (this.InProgress) return await message.channel.send(`<@${userID}>, you can't join a game that's already started!`) //If the game is in progress    
            if (this.Players.length == 8) return await message.channel.send(`<@${userID}>, the game is full!`) //game can't be over 8 people because rules of monopoly
        } else {
            var userID = user.id;
            if (this.Players.has(userID)) return;
            if (this.InProgress) return;
            if (this.Players.length == 8) return await message.channel.send(`<@${userID}>, the game is full!`) //game can't be over 8 people because rules of monopoly
        }

        this.Players.set(userID, new Player(userID)) //Add them to the game
        await message.channel.send(`<@${userID}>, welcome to the game! We currently have ${this.Players.size} players!`).then(async msg => await msg.react("☑")) //Inform
    }

    async PlayerLeave(message) { //Player leaves
        if (!this.Players.has(message.author.id)) return await message.channel.send("You aren't in this game!") //can't leave if you aren't in it
        if (message.author.id == this.Leader) return await message.channel.send(`The leader can't leave! Do ${botconfig.prefixes[message.guild.id].prefix}leader to change the leader!`) //Leader can't leave
        if (this.InProgress) { //If the game is in progress
            this.Players.get(message.author.id).Money = -1 //set money to -1
            this.CheckAndHandleBankrupt(message, this.Players.get(message.author.id)) //Check for bankrupt and then distribute property
        } else { //Game isn't in progress
            this.Players.delete(message.author.id) //delete from players
            await message.channel.send(`Sorry to see you leave :(`) //Inform
        }
    }

    async ChangeLeader(message) { //change the game leader
        if (this.Leader != message.author.id) return await message.channel.send(`Only the leader can change the leader!`) //only game leader

        const NewLeader = message.mentions.members.first() //new leader is first mention
        if (NewLeader) { //if theres a new leader
            if (this.Players.has(NewLeader.id)) return await message.channel.send("The new leader has to be in this game!")
            this.Leader = NewLeader.id //set to new leader
            await message.channel.send(`Changed the leader to <@${this.Leader}>!`) //inform
        } else { //not a new leader
            await message.channel.send(".leader [new leader]")
        }
    }

    async Start(message, user) { //start the game
        if (!user) {
            var userID = message.author.id;
            if (userID != this.Leader) return await message.channel.send(`Only <@${this.Leader}> can start the game!`) //only leader can start
            if (this.Players.size < 2) return await message.channel.send("I can't start a game with less than 2 players...") //only can start with 2 or more players
            if (this.InProgress) return await message.channel.send(`<@${userID}>, the game has already started!`) //can't start again
        } else {
            var userID = user.id;
            if (userID != this.Leader) return; //only leader can start
            if (this.Players.size < 2) return await message.channel.send("I can't start a game with less than 2 players...") //only can start with 2 or more players
            if (this.InProgress) return; //can't start again    
        }

        this.InProgress = true; //set in progress
        this.CurrentPlayerIndex = Math.floor(Math.random() * this.Players.size) //pick random starting player
        this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex] //set currentplayer

        await message.channel.send(`Lets get the show on the road! <@${this.CurrentPlayer.ID}>, you are going first! Do ${botconfig.prefixes[message.guild.id].prefix}roll to roll or just react with the dice!`).then(async msg => {
            await msg.react("🎲");
            await msg.react("🏠")
        }) //inform
    }

    async HandlePosition(message, userID, Dice1, Dice2) { //handle them being in a position
        return new Promise(async (resolve, reject) => {
            const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //Get current property
            if (CurrentProperty.Color == "GO") { //Currently on GO
                await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on go.`).then(async msg => await msg.react("🛑")) //inform
            } else if (CurrentProperty.Color == "Chest" || CurrentProperty.Color == "Chance") { //Currently on Chest or Chance
                if (CurrentProperty.Color == "Chest") { //If its chest
                    var card = CommunityChestCards[Math.floor(Math.random() * CommunityChestCards.length)] //random chest card
                } else if (CurrentProperty.Color == "Chance") { //if its chance
                    var card = ChanceCards[Math.floor(Math.random() * ChanceCards.length)] //random chance card
                }

                let Message = `<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on a ${CurrentProperty.Color.toLowerCase()} card that says, "${card.Text}".` //Inform about card
                if (card.MoveTo == 10) { //if move to jail
                    this.CurrentPlayer.Jail();
                    await message.channel.send(Message).then(async msg => await msg.react("🛑")) //send message
                } else if (card.GetOutOfJail) { //if its get out of jail
                    this.CurrentPlayer.GetOutOfJail++; //increase get out of jail
                    await message.channel.send(Message).then(async msg => await msg.react("🛑")) //send message
                } else if (card.MoveTo != null) { //if there is a move to
                    if (card.MoveTo < this.CurrentPlayer.Position) { //if its behind the player
                        this.CurrentPlayer.AddMoney(200) //add 200
                        Message += ` You passed go and collected $200!` //Passed go
                    }
                    this.CurrentPlayer.Position = card.MoveTo //Move
                    await message.channel.send(Message).then(async msg => await msg.react("🛑")) //send message
                    await this.HandlePosition(message, userID, Dice1, Dice2)
                } else if (card.CollectFromPlayers) { //If you collect money from others
                    if (card.Money < 0) { //if money is below 0
                        this.CurrentPlayer.RemoveMoney(message, ((this.Players.size - 1) * card.Money) * -1, null) //remove money for each player
                        Message += ` You lost $${(this.Players.size - 1) * card.Money * -1}!`
                        this.Players.array().forEach(player => { //loop through each player
                            if (player.ID != this.CurrentPlayer.ID) { //if the player isn't the current player
                                player.AddMoney(card.Money * -1) //add money
                            }
                        });
                    } else { //If money is 0 or above
                        this.CurrentPlayer.AddMoney((this.Players.size - 1) * card.Money) //Add money
                        Message += ` You collected $${(this.Players.size - 1) * card.Money}!`
                        this.Players.array().forEach(player => { //Loop through each player
                            if (player.ID != this.CurrentPlayer.ID) { //If the player isn't the current one
                                player.RemoveMoney(message, card.Money, null) //remove money
                            }
                        });
                    }
                    await message.channel.send(Message).then(async msg => await msg.react("🛑")) //send message
                } else { //if the card is just money
                    if (card.Money < 0) { //if its below 0
                        this.CurrentPlayer.RemoveMoney(message, card.Money * -1, null) //Remove the money
                    } else { //if its 0 or above
                        this.CurrentPlayer.AddMoney(card.Money) //Add money
                    }
                    await message.channel.send(Message).then(async msg => await msg.react("🛑")) //send message
                }
            } else if (CurrentProperty.Color == "Tax") { //if they landed on tax
                const TenPercent = Math.round((this.CurrentPlayer.Money + this.CurrentPlayer.Worth) * 0.1) //get 10 percent of total worth
                if (TenPercent < CurrentProperty.Rent) { //If ten percent is less than the tax
                    this.CurrentPlayer.RemoveMoney(message, TenPercent, null) //remove 10 percent
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} and payed $${TenPercent} (10%).`).then(async msg => await msg.react("🛑")) //inform
                } else { //if its = or more
                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent, null) //remove tax
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} and payed $${CurrentProperty.Rent}.`).then(async msg => await msg.react("🛑")) //inform
                }
            } else if (CurrentProperty.Color == "Jail") { //if they land on jail
                if (!this.CurrentPlayer.Jailed) await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2}. You are just visiting jail.`).then(async msg => await msg.react("🛑"))
            } else if (CurrentProperty.Color == "Utility") { //if they land on utility
                if (CurrentProperty.Owner) { //if its owned
                    if (CurrentProperty.Owner.ID != this.CurrentPlayer.ID) { //if its owned by someone else
                        if (CurrentProperty.Mortgaged) { //if its mortgaged
                            await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`).then(async msg => await msg.react("🛑"))
                        } else { //if its not mortgaged
                            const Price = (Dice1 + Dice2) * CurrentProperty.Rent[CurrentProperty.Owner.Utility] //price is dice roll * rent
                            this.CurrentPlayer.RemoveMoney(message, Price, CurrentProperty.Owner) //remove amount
                            CurrentProperty.Owner.AddMoney(Price) //add to owner
                            await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2}. You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and paid them $${Price}.`).then(async msg => await msg.react("🛑"))
                        }
                    } else { //if you land on your own utility
                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on your own ${CurrentProperty.Name}...`).then(async msg => await msg.react("🛑"))
                    }
                } else { //if its not owned
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name}. It costs $${CurrentProperty.Price}. React with the check mark or do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it or react with the stop sign or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it! You currently have $${this.CurrentPlayer.Money} and ${this.CurrentPlayer[CurrentProperty.Color]} properties with this color.`, CurrentProperty.Info()).then(async msg => {
                        await msg.react("✅");
                        await msg.react("🛑");
                    })
                }
            } else if (CurrentProperty.Color == "Parking") { //if its parking
                await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on free parking.`).then(async msg => await msg.react("🛑"))
            } else if (CurrentProperty.Color == "Go To Jail") { //if its go to jail
                await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on go to jail!`).then(async msg => await msg.react("🛑"))
                this.CurrentPlayer.Jail()
            } else if (CurrentProperty.Color == "RR") { //if its a rail road
                if (CurrentProperty.Owner) { //if its owned
                    if (CurrentProperty.Mortgaged) { //if its mortgaged
                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2}. You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`).then(async msg => await msg.react("🛑"))
                    } else { //not mortgaged
                        if (CurrentProperty.Owner.ID != this.CurrentPlayer.ID) { //if its not owned by you
                            this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.RR], CurrentProperty.Owner) //remove money
                            CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Owner.RR]) //add money to owner
                            await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and payed them $${CurrentProperty.Rent[CurrentProperty.Owner.RR]}`).then(async msg => await msg.react("🛑"))
                        } else { //if its owned by you
                            await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} but you already own it!`).then(async msg => await msg.react("🛑"))
                        }
                    }
                } else { //not owned
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name}. It costs $${CurrentProperty.Price}. React with the check mark or do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it or react with the stop sign or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it! You currently have $${this.CurrentPlayer.Money} and ${this.CurrentPlayer[CurrentProperty.Color]} properties with this color.`, CurrentProperty.Info()).then(async msg => {
                        await msg.react("✅");
                        await msg.react("🛑");
                    })
                }
            } else { //regular property
                if (CurrentProperty.Owner) { //if theres an owner
                    if (CurrentProperty.Owner.ID == this.CurrentPlayer.ID) message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} but you already own it...`).then(async msg => await msg.react("🛑")) //landed on your own
                    else { //you don't own it
                        if (CurrentProperty.Mortgaged) { //if its mortgaged
                            await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}> but it is mortgaged...`).then(async msg => await msg.react("🛑"))
                        } else { //not mortgaged
                            if (CurrentProperty.Houses > 0) { //more than 0 house
                                await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed them $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(async msg => await msg.react("🛑"))
                                this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner) //remove money
                                CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Houses]) //add money
                            } else { //0 houses
                                if (CurrentProperty.Color == "DARK_ORANGE" || CurrentProperty.Color == "DARK_BLUE") { //if its orange or blue
                                    if (CurrentProperty.Owner[CurrentProperty.Color] < 2) { //doesn't own all 2
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Houses])
                                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed them $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(async msg => await msg.react("🛑"))
                                    } else { //owns all 2
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner) //multiply rent by 2
                                        CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed them $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`).then(async msg => await msg.react("🛑"))
                                    }
                                } else { //any other color
                                    if (CurrentProperty.Owner[CurrentProperty.Color] < 3) { //doesn't own all 3
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                        CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Houses])
                                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed them $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(async msg => await msg.react("🛑"))
                                    } else { //does own all 3
                                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner) //multiply rent by 2
                                        CurrentProperty.Owner.AddMoney(CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed them $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`).then(async msg => await msg.react("🛑"))
                                    }
                                }
                            }
                        }
                    }
                } else { //nobody owns it
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and landed on ${CurrentProperty.Name}. React with the check mark or do ${botconfig.prefixes[message.guild.id].prefix}buy to buy the property or react with the stop sign or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it! You currently have $${this.CurrentPlayer.Money} and ${this.CurrentPlayer[CurrentProperty.Color]} properties with this color.`, CurrentProperty.Info()).then(async msg => {
                        await msg.react("✅");
                        await msg.react("🛑");
                    })
                }
            }
            resolve();
        })
    }

    async Roll(message, user) { //roll
        if (!user) {
            var userID = message.author.id;
            if (!this.InProgress) return await message.channel.send(`<@${userID}>, the game hasen't started yet!`) //if its not in progress
            if (message.author.id != this.CurrentPlayer.ID) return await message.channel.send(`<@${userID}>, it's not your turn!`) //current player can only roll
            if (this.CurrentPlayer.Rolled) return await message.channel.send(`<@${userID}>, you already rolled`) //if they have already rolled    
        } else {
            var userID = user.id;
            if (!this.InProgress) return;
            if (user.id != this.CurrentPlayer.ID) return;
            if (this.CurrentPlayer.Rolled) return;
        }

        this.CurrentPlayer.Rolled = true //set to rolled

        const Dice1 = Math.floor(Math.random() * 6) + 1; //roll 2 dice
        const Dice2 = Math.floor(Math.random() * 6) + 1;

        if (this.CurrentPlayer.Jailed) { //if the player is in jail
            this.CurrentPlayer.JailTime++; //increase jail time
            if (Dice1 == Dice2) { //If they rolled doubles
                await message.channel.send(`<@${userID}>, you rolled doubles (${Dice1} and a ${Dice2}) and got out of jail for free!`)
                this.CurrentPlayer.Free() //free from jail
                await this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
            } else { //didn't roll doubles
                if (this.CurrentPlayer.GetOutOfJail > 0) { //if they have at least 1 get out of jail card
                    await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and used one of your get out of jail free cards!`)
                    this.CurrentPlayer.GetOutOfJail--; //remove the card
                    this.CurrentPlayer.Free() //Free them from jail
                    await this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
                } else { //no get out of jail cards
                    if (this.CurrentPlayer.JailTime == 3) { //been in jail for 3 turns
                        this.CurrentPlayer.RemoveMoney(message, 50, null); //pay 50
                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} and payed 50 dollars and got out of jail.`) //Inform
                        this.CurrentPlayer.Free(); //free
                        await this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
                    } else { //been in jail for less than 3 turns
                        await message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2} but you are in jail and cannot move!`).then(async msg => await msg.react("🛑")) //can't move
                    }

                }
            }
        } else { //not jailed
            await this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
        }

        await this.HandlePosition(message, userID, Dice1, Dice2)

        if (Dice1 == Dice2) { //doubles
            this.CurrentPlayer.Doubles = true; //rolled doubles
            this.CurrentPlayer.DoublesStreak++; //increase streak
            if (this.CurrentPlayer.DoublesStreak == 3) { //third time
                this.CurrentPlayer.DoublesStreak = 0; //remove streak
                this.CurrentPlayer.Doubles = false; //remove doubles
                this.CurrentPlayer.Jail(); //jail them
            }
        } else { //not doubles
            this.CurrentPlayer.Doubles = false;
            this.CurrentPlayer.DoublesStreak = 0;
        }
    }

    async Stats(message) { //get stats for player
        if (!this.Players.has(message.author.id)) return message.reply(`you aren't in this game`)
        const player = this.Players.get(message.author.id)
        const PlayerEmbed = new Discord.RichEmbed()
            .setTitle(`Stats for ${message.member.displayName}`)
            .setColor("DEFAULT")
            .addField("Position", this.Properties[player.Position].Name, true)
            .addField("Money", player.Money, true)
            .addField("Get out of jail cards", player.GetOutOfJail, true)
            .addField("Currently Jailed?", player.Jailed, true)
            .addField("Rail roads (4)", player.RR, true)
            .addField("Utilities (2)", player.Utility, true)
            .addField("Brown Properties (2)", player.DARK_ORANGE, true)
            .addField("Light blue properties (3)", player.BLUE, true)
            .addField("Pink properties (3)", player.LUMINOUS_VIVID_PINK, true)
            .addField("Orange Properties (3)", player.ORANGE, true)
            .addField("Red properties (3)", player.DARK_RED, true)
            .addField("Yellow properties (3)", player.GOLD, true)
            .addField("Green properties (3)", player.DARK_GREEN, true)
            .addField("Dark blue properties (2)", player.DARK_BLUE, true)
        await message.channel.send(PlayerEmbed)
    }

    async Buy(message, user) { //Buy current property
        if (!user) {
            var userID = message.author.id
            if (!this.Players.has(userID)) return await message.reply("you aren't in this game.") //must be in game
            if (!this.InProgress) return await message.reply("the game hasen't started yet!") //game has to be in progress
            if (userID != this.CurrentPlayer.ID) return await message.reply("it's not your turn!") //has to be their turn    
        } else {
            var userID = user.id
            if (!this.Players.has(userID)) return;
            if (!this.InProgress) return;
            if (userID != this.CurrentPlayer.ID) return;
        }

        const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //Get property they are on
        if (!CurrentProperty.Price) return await message.channel.send(`<@${userID}>, you can't buy this!`).then(async msg => await msg.react("🛑")) //if there isn't a price
        if (CurrentProperty.Owner) return await message.channel.send(`<@${CurrentProperty.Owner.ID}> already owns this!`).then(async msg => await msg.react("🛑")) //if theres an owner
        if (CurrentProperty.Price > this.CurrentPlayer.Money) return await message.channel.send(`<@${userID}>, you don't have enough money to buy this!`).then(async msg => await msg.react("🛑")) //if its over their price 
        else { //if they can afford it
            this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Price, null); //remove money
            CurrentProperty.Buy(this.CurrentPlayer) //buy it
            await message.channel.send(`<@${userID}>, you bought ${CurrentProperty.Name}!`).then(async msg => await msg.react("🛑"))
        }

    }

    async CheckAndHandleBankrupt(message, Player) { //check if they are bankrupt
        if (Player.Money < 0) { //if they have less than 0 money
            this.Players.delete(Player.ID) //remove player
            await message.channel.send(`<@${Player.ID}> went bankrupt!`) //inform
            if (Player.PaidPlayer) { //if there is a paid player
                let MoneyForNewPlayer = 0; //track money to give to new player
                for (let i = 0; i < this.Properties.length; i++) { //go through all properties
                    const CurrentProperty = this.Properties[i]
                    if (CurrentProperty.Owner && CurrentProperty.Owner.ID == Player.ID) { //if there is an owner and its the bankrupt player
                        for (let j = CurrentProperty.Houses; j > 0; j--) { //go through all houses
                            CurrentProperty.Houses--; //remove house
                            MoneyForNewPlayer += Math.round(CurrentProperty.Building / 2) //add half house worth to money for new player
                        }
                        CurrentProperty.Buy(Player.PaidPlayer) //change the property over to the new player
                    }
                }
                if (MoneyForNewPlayer > 0) { //if the money for the new player is more than 0
                    Player.PaidPlayer.AddMoney(MoneyForNewPlayer) //pay the player
                }
            } else { //no paid player
                this.CurrentPlayerIndex--; //go back to previous player (so that when we increase it again it goes to the real next player and doesn't skip)
                for (let i = 0; i < this.Properties.length; i++) { //go through all propertys
                    const CurrentProperty = this.Properties[i]
                    if (CurrentProperty.Owner && CurrentProperty.Owner.ID == Player.ID) { //if owner and is the bankrupt player
                        CurrentProperty.Houses = 0; //remove houses
                        CurrentProperty.Owner = null //remove owner
                        CurrentProperty.Mortgaged = false; //unmortgage
                    }
                }

            }

            if (this.Players.size == 1) { //if last player
                await message.channel.send(`CONGRATS <@${this.Players.array()[0].ID}> YOU HAVE WON!`) //won
                bot.games.delete(message.channel.id) //delete game
            }
        }
    }

    async End(message, user) { //end turn
        if (!user) {
            var userID = message.author.id
            if (!this.InProgress) return await message.reply("the game hasen't started yet!") //if not in progress
            if (userID != this.CurrentPlayer.ID) return await message.reply('its not your turn') //if not their turn
            if (!this.CurrentPlayer.Rolled) return await message.reply("you haven't rolled yet") //if haven't rolled
        } else {
            var userID = user.id;
            if (!this.InProgress) return;
            if (userID != this.CurrentPlayer.ID) return; //if not their turn
            if (!this.CurrentPlayer.Rolled) return await message.channel.send(`<@${userID}>, you haven't rolled yet`) //if haven't rolled
        }

        await this.CheckAndHandleBankrupt(message, this.CurrentPlayer) //check for bankruptcy

        if (this.Properties[this.CurrentPlayer.Position].Owner == null && this.Properties[this.CurrentPlayer.Position].Price > 0) { //if the current property doesn't have an owner and can be bought
            this.Bidding = true; //start bid
            this.HighestBid = 0 //highest bid of 0
            this.Bidders = this.Players.concat().array() //put all players into an array that copys the players
            this.BiddersIndex = this.CurrentPlayerIndex; //Start off with the current player
            await message.channel.send(`Let the bidding begin! <@${this.Bidders[this.BiddersIndex].ID}> type !bid [amount] to place a bid or use the emojis. ❌ to quit, ⬆ raise by $10, or ⏫ to raise by $100. Current bid is $${this.HighestBid}`).then(async msg => {
                await msg.react("❌");
                await msg.react("⬆");
                await msg.react("⏫")
            }) //start bid
        } else if (this.Players.size > 1) { //if bought or can't be bought
            this.CurrentPlayer.Rolled = false; //reset rolled
            if (this.CurrentPlayer.Doubles && this.CurrentPlayer.Money >= 0) { //if its doubles and they didn't go bankrupt
                await message.channel.send(`<@${userID}>, roll again!`).then(async msg => {
                    await msg.react("🎲");
                    await msg.react("🏠")
                })
            } else { //if it wasn't doubles or they went bankrupt
                this.CurrentPlayerIndex++; //next player
                if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0; //if past the last player reset to first
                this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex] //get current player
                await message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn! You have $${this.CurrentPlayer.Money}`).then(async msg => {
                    await msg.react("🎲");
                    await msg.react("🏠")
                })
            }
        }
    }

    async Auction(message, args, user) { //bidding
        if (!user) {
            var userID = message.author.id;
            if (!this.InProgress) return await message.reply("the game hasen't started yet!") //must be in progress
            if (!this.Bidding) return await message.reply("we aren't currently bidding") //must be bidding
            if (this.Bidders[this.BiddersIndex].ID != userID) return await message.reply(`the current bidder is <@${Bidders[this.BiddersIndex].ID}>!`) //must be current bidder    
        } else {
            var userID = user.id;
            if (!this.InProgress) return; //must be in progress
            if (!this.Bidding) return; //must be bidding
            if (this.Bidders[this.BiddersIndex].ID != userID) return; //must be current bidder    
        }

        let amount = args[0];
        if (!amount) return await message.channel.send(".bid [amount] or .bid quit")
        if (amount.toLowerCase() == "quit") { //if they quit
            this.Bidders.splice(this.BiddersIndex, 1) //remove the bidder
            await message.channel.send(`<@${userID}>, removed you from the bidders`)
            if (this.Bidders.length == 1) { //if only 1 bidder
                this.Bidding = false; //stop bidding
                const winner = this.Players.get(this.Bidders[0].ID) //winner as a player
                const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //get the property they won
                await message.channel.send(`<@${winner.ID}> congrats you won ${this.Properties[this.CurrentPlayer.Position].Name} for $${this.HighestBid}!`) //inform
                winner.RemoveMoney(message, this.HighestBid, null); //remove money
                CurrentProperty.Buy(winner) //buy it
                this.CurrentPlayer.Rolled = false; //set rolled to false
                if (this.CurrentPlayer.Doubles) { //if they rolled doubles
                    await message.channel.send(`<@${this.CurrentPlayer.ID}>, you rolled doubles so you get to roll again!`).then(async msg => {
                        await msg.react("🎲");
                        await msg.react("🏠")
                    })
                } else { //didn't roll doubles
                    this.CurrentPlayerIndex++;
                    if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0; //reset to 0
                    this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
                    await message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`).then(async msg => {
                        await msg.react("🎲");
                        await msg.react("🏠")
                    })
                }
            } else { //still more than 1 bidder
                if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0; //go to next bidder
                await message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid! ❌ to quit bidding, ⬆ to raise by $10, and ⏫ to raise by $100 (Current bid is $${this.HighestBid})`).then(async msg => {
                    await msg.react("❌");
                    await msg.react("⬆");
                    await msg.react("⏫")
                })
            }
        } else { //didn't quit
            amount = parseInt(amount) //convert to int
            if (!amount) return await message.channel.send(`<@${userID}>, you must specify a valid amount or say !bid quit`)
            if (amount <= this.HighestBid) return await message.channel.send(`${userID}, you must bid higher than $${this.HighestBid} or say !bid quit`) //has to be higher
            if (amount > this.Bidders[this.BiddersIndex].Money) return await message.channel.send(`<@${userID}>, thats above the amount of money you have!`)
            this.HighestBid = amount; //set highest bid
            this.BiddersIndex++; //next bidder
            if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0;
            await message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid! ❌ to quit bidding, ⬆ to raise by $10, and ⏫ to raise by $100 (Current bid is $${this.HighestBid})`).then(async msg => {
                await msg.react("❌");
                await msg.react("⬆");
                await msg.react("⏫")
            })
        }
    }

    async BuyProperty(message, user) { //Buy a house
        if (!user) {
            var userID = message.author.id
            if (!this.InProgress) return await message.reply("the game hasen't started yet!") //has to have started
            if (userID != this.CurrentPlayer.ID) return await message.reply('its not your turn') //gotta be your turn    
        } else {
            var userID = user.id
            if (!this.InProgress) return; //has to have started
            if (userID != this.CurrentPlayer.ID) return; //gotta be your turn    
        }

        let LeastHouses = 10; //least house is 10 (just has to be more than 5)
        let PropertyIndex; //null at first
        for (let i = 0; i < this.Properties.length; i++) { //go through all propertys
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Owner && CurrentProperty.Houses < LeastHouses && CurrentProperty.Owner.ID == this.CurrentPlayer.ID && CurrentProperty.Color != "RR" && CurrentProperty.Color != "Utility") { //if there is an owner, it has the least num of houses and the owner is the player
                if (CurrentProperty.Color == "DARK_ORANGE" || CurrentProperty.Color == "DARK_BLUE") {
                    if (CurrentProperty.Owner[CurrentProperty.Color] == 2) { //owns all 2
                        LeastHouses = CurrentProperty.Houses; //set least houses
                        PropertyIndex = i; //set property to current house
                    }
                } else { //not orange or blue
                    if (CurrentProperty.Owner[CurrentProperty.Color] == 3) { //owns all 3
                        LeastHouses = CurrentProperty.Houses;
                        PropertyIndex = i;
                    }
                }
            }
        }
        if (!PropertyIndex) return await message.channel.send(`<@${userID}>, you can't buy a house on anything!`).then(async msg => await msg.react("🛑")) //If there isn't a property index
        const CurrentProperty = this.Properties[PropertyIndex]
        if (CurrentProperty.Houses == 5) return await message.channel.send(`<@${userID}>, you can't build anymore houses`).then(async msg => await msg.react("🛑")) //if theres already 5 houses
        if (CurrentProperty.Building > this.CurrentPlayer.Money) return await message.channel.send(`<@${userID}>, you don't have enough money to build a house`).then(async msg => await msg.react("🛑")) //if they can't afford it
        this.CurrentPlayer.RemoveMoney(message, this.Properties[PropertyIndex].Building, null) //remove money for the building cost
        this.Properties[PropertyIndex].Houses++; //increase houses
        await message.channel.send(`<@${userID}>, you spent $${this.Properties[PropertyIndex].Building} and now have ${this.Properties[PropertyIndex].Houses} ${(this.Properties[PropertyIndex].Houses == 1)?"house":"houses"} on ${this.Properties[PropertyIndex].Name}!`).then(async msg => await msg.react("🛑"))
    }

    async Sell(message) { //sell a property
        if (!this.InProgress) return await message.reply("the game hasen't started yet!") //if not in progress
        if (message.author.id != this.CurrentPlayer.ID) return await message.reply('its not your turn') //if its not their turn

        let Arg = message.content.split(" ")[1] //property arg
        let Money = parseInt(message.content.split(" ")[message.content.split(" ").length - 1]) //get last arg
        let reciever = message.mentions.members.first(); //first mention
        if (!Arg) return await message.channel.send("!sell [property] [reciever] [cost]") //if there isn't a first arg
        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //go through all properties
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Owner && CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) { //if theres an owner and name includes what was typed and the owner is the current player
                if (FoundHouseIndex) { //if already found a house
                    return await message.reply("you have to be more specific with the property name") //have to be more specific
                } else {
                    FoundHouseIndex = i //set found house index
                }
            }
        }
        if (!FoundHouseIndex) return await message.reply("couldn't find that property") //if haven't found a house
        if (this.Properties[FoundHouseIndex].Houses > 0) { //if theres more than one house on it
            this.CurrentPlayer.AddMoney(Math.round(this.Properties[FoundHouseIndex].Building / 2)); //sell the house for half the house cost
            this.Properties[FoundHouseIndex].Houses--; //remove house
            await message.reply(`you sold 1 house for $${Math.round(this.Properties[FoundHouseIndex].Building / 2)} and now have ${this.Properties[FoundHouseIndex].Houses} ${(this.Properties[FoundHouseIndex].Houses == 1)?"house":"houses"} on it!`).then(async msg => await msg.react("🛑"))
        } else { //no houses
            if (!reciever) return await message.channel.send("!sell [property] [reciever] [amount]")
            reciever = this.Players.get(reciever.id) //get the player
            if (!reciever) return await message.reply("invalid reciever!")
            if (reciever == this.Players.get(message.author.id)) return await message.reply("you can't sell to yourself") //can't sell to yourself
            switch (this.Properties[FoundHouseIndex].Color) { //get all the houses in the color and make sure there are no houses
                case "DARK_ORANGE":
                    if (this.Properties[1].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                    } else if (this.Properties[3].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                    }
                    break;
                case "BLUE":
                    if (this.Properties[6].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                    } else if (this.Properties[8].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                    } else if (this.Properties[9].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                    }
                    break;
                case "LUMINOUS_VIVID_PINK":
                    if (this.Properties[11].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                    } else if (this.Properties[13].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                    } else if (this.Properties[14].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                    }
                    break;
                case "ORANGE":
                    if (this.Properties[16].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                    } else if (this.Properties[18].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                    } else if (this.Properties[19].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                    }
                    break;
                case "DARK_RED":
                    if (this.Properties[21].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                    } else if (this.Properties[23].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                    } else if (this.Properties[24].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                    }
                    break;
                case "GOLD":
                    if (this.Properties[26].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                    } else if (this.Properties[27].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                    } else if (this.Properties[29].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                    }
                    break;
                case "DARK_GREEN":
                    if (this.Properties[31].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                    } else if (this.Properties[32].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                    } else if (this.Properties[34].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                    }
                    break;
                case "DARK_BLUE":
                    if (this.Properties[37].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                    } else if (this.Properties[39].Houses > 0) {
                        return await message.reply(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                    }
                    break;
            }
            if (reciever.CurrentOffer) return await message.reply("they have a pending offer already!") //if the reciever already has an offer
            reciever.CurrentOffer = new Offer(FoundHouseIndex, Money, this.CurrentPlayer) //set offer to the new offer
            await message.channel.send(`<@${reciever.ID}>, <@${message.author.id}> has offered you ${this.Properties[FoundHouseIndex].Name} for $${Money}`).then(async msg => {
                await msg.react("✔")
                await msg.react("✖")
            })
        }
    }

    async Offer(message, args, user) { //accept or deny offers
        if (!user) {
            var userID = message.author.id
            if (!this.InProgress) return await message.channel.send(`<@${userID}>, the game hasen't started yet!`) //if not in progress
            if (!this.Players.has(userID)) return await message.channel.send(`<@${userID}>, you aren't in the game!`) //if they aren't in the game
            var Player = this.Players.get(userID); //get the player
            if (!Player.CurrentOffer) return await message.channel.send(`<@${userID}>, you don't have a pending offer`) //if they don't have a current offer

        } else {
            var userID = user.id
            if (!this.InProgress) return;
            if (!this.Players.has(userID)) return;
            var Player = this.Players.get(userID); //get the player
            if (!Player.CurrentOffer) return;

        }
        const Property = this.Properties[Player.CurrentOffer.PropertyIndex] //get the property offered
        if (Player.CurrentOffer.OriginalOwner.ID != Property.Owner.ID) { //If the property is no longer owned by the offerer
            Player.CurrentOffer = null; //remove offer
            return await message.channel.send(`<@${userID}>, someone already bought it!`).then(async msg => await msg.react("🛑"))
        }
        let answer = args[0]; //get the first arg
        if (!answer) return await message.channel.send(".offer [confirm|deny]") //if theres no answer or the answer isn't deny and there isn't an amount
        answer = answer.toLowerCase(); //change to lower case
        if (answer == "confirm") { //if they confirm
            Property.Buy(Player) //buy
            Player.RemoveMoney(message, Player.CurrentOffer.Price, this.Players.get(Player.CurrentOffer.OriginalOwner.ID)) //remove money
            this.Players.get(Player.CurrentOffer.OriginalOwner.ID).AddMoney(Player.CurrentOffer.Price) //add money
            await message.channel.send(`<@${userID}>, you bought ${Property.Name} for $${Player.CurrentOffer.Price}`).then(async msg => await msg.react("🛑"));
            Player.CurrentOffer = null; //remove offer
            return;
        } else if (answer == "deny") { //deny
            Player.CurrentOffer = null; //remove offer
            return await message.channel.send(`Denied.`)
        } else { //neither comfirm or deny
            return await message.channel.send(`.offer [confirm|deny] {amount}`)
        }
    }

    async Mortgage(message) { //mortgage a property
        if (!this.InProgress) return await message.reply("the game hasen't started yet!") //not in progress
        if (message.author.id != this.CurrentPlayer.ID) return await message.reply('its not your turn') //not their turn

        let Arg = message.content.split(" ")[1] //first arg
        if (!Arg) return await message.reply("you must specify what property you want to mortgage!") //no first arg

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //go through all properties
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) { //if property name includes arg and is owned
                if (FoundHouseIndex) { //if already found house
                    return await message.reply("you have to be more specific with the property name") //stop
                } else { //not found one
                    FoundHouseIndex = i //set it to current index
                }
            }
        }

        if (!FoundHouseIndex) return await message.reply("couldn't find that property") //no index
        const FoundHouse = this.Properties[FoundHouseIndex] //get found house
        if (FoundHouse.Mortgaged) return await message.reply("that is already mortgaged").then(async msg => await msg.react("🛑")) //if its already mortgaged

        switch (FoundHouse.Color) { //have to sell houses on all properties of same color to mortgage
            case "DARK_ORANGE":
                if (this.Properties[1].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                } else if (this.Properties[3].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                }
                FoundHouse.Owner.DARK_ORANGE--;
                break;
            case "BLUE":
                if (this.Properties[6].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                } else if (this.Properties[8].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                } else if (this.Properties[9].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                }
                FoundHouse.Owner.BLUE--;
                break;
            case "LUMINOUS_VIVID_PINK":
                if (this.Properties[11].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                } else if (this.Properties[13].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                } else if (this.Properties[14].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                }
                FoundHouse.Owner.LUMINOUS_VIVID_PINK--;
                break;
            case "ORANGE":
                if (this.Properties[16].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                } else if (this.Properties[18].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                } else if (this.Properties[19].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                }
                FoundHouse.Owner.ORANGE--;
                break;
            case "DARK_RED":
                if (this.Properties[21].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                } else if (this.Properties[23].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                } else if (this.Properties[24].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                }
                FoundHouse.Owner.DARK_RED--;
                break;
            case "GOLD":
                if (this.Properties[26].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                } else if (this.Properties[27].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                } else if (this.Properties[29].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                }
                FoundHouse.Owner.GOLD--;
                break;
            case "DARK_GREEN":
                if (this.Properties[31].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                } else if (this.Properties[32].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                } else if (this.Properties[34].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                }
                FoundHouse.Owner.DARK_GREEN--;
                break;
            case "DARK_BLUE":
                if (this.Properties[37].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                } else if (this.Properties[39].Houses > 0) {
                    return await message.reply(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                }
                FoundHouse.Owner.DARK_BLUE--;
                break;
        }

        FoundHouse.Mortgaged = true; //mortgage
        FoundHouse.Owner.AddMoney(FoundHouse.Mortgage) //add money
        await message.reply(`you mortgaged ${FoundHouse.Name} for $${FoundHouse.Mortgage}`).then(async msg => await msg.react("🛑"))
    }

    async Unmortgage(message) { //unmortage a house
        if (!this.InProgress) return await message.reply("the game hasen't started yet!") //has to be in progress
        if (message.author.id != this.CurrentPlayer.ID) return await message.reply('its not your turn') //if its not their turn

        let Arg = message.content.split(" ")[1] //get property
        if (!Arg) return await message.reply("you must specify what property you want to unmortgage!")

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //find it
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                if (FoundHouseIndex) {
                    return await message.reply("you have to be more specific with the property name")
                } else {
                    FoundHouseIndex = i
                }
            }
        }
        if (!FoundHouseIndex) return await message.reply("couldn't find that property")
        const FoundHouse = this.Properties[FoundHouseIndex]
        if (!FoundHouse.Mortgaged) return await message.reply("that isn't mortgaged") //if it isn't mortgaged
        const Price = FoundHouse.Mortgage * 1.10; //the price to unmortgage is 110% the mortgage cost

        if (Price > this.CurrentPlayer.Money) return await message.reply(`you don't have enough money to unmortgage it for $${Price}.`).then(async msg => await msg.react("🛑")) //if its over their price
        FoundHouse.Owner[FoundHouse.Color]++; //increase amount for color

        this.CurrentPlayer.RemoveMoney(message, Price, null) //pay for it

        FoundHouse.Mortgaged = false; //unmortgage

        await message.reply(`you bought back ${FoundHouse.Name} for $${Price}`).then(async msg => await msg.react("🛑"))
    }

    async GetProperty(message) { //get properties owned
        if (!this.InProgress) return await message.reply("the game hasen't started yet!")
        if (!this.Players.has(message.author.id)) return await message.reply("you aren't in this game")

        const Player = this.Players.get(message.author.id)
        const PropertyEmbed = new Discord.RichEmbed()
            .setTitle("Property you own")
            .setColor("RANDOM")
        for (let i = 0; i < this.Properties.length; i++) {
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Owner && CurrentProperty.Owner.ID == Player.ID) { //if owned
                PropertyEmbed.addField(CurrentProperty.Name, `${CurrentProperty.Houses} ${(CurrentProperty.Houses == 1)?"house":"houses"}`, true) //add
            }
        }
        await message.channel.send(PropertyEmbed)
    }
}

bot.login(botconfig.token) //login bot

bot.on("ready", async () => {
    await bot.user.setActivity("Monopoly {!help}", { //playing monopoly
        type: "PLAYING"
    })

    console.log(`${bot.user.username} is online!`)
})

bot.on("message", async (message) => {
    if (message.author.bot) return; //if from a bot
    if (message.channel.type == "dm") return;
    if (message.content == "shutdown" && message.author.id == "330000865215643658") { //if it says shutdown and from owner
        await bot.destroy()
        return;
    }
    if (!botconfig.prefixes[message.guild.id]) botconfig.prefixes[message.guild.id] = { //if there isn't a prefix set it to !
        "prefix": "!"
    }
    const prefix = botconfig.prefixes[message.guild.id].prefix; //get prefix
    if (message.mentions.members.first() && message.mentions.members.first().id == "592761354021109801") return await message.channel.send(`${prefix}help`) //if the first @'d member is the bot

    if (message.content.startsWith(prefix)) { //if message starts with prefix
        const messageArray = message.content.split(' '); //splits the message into an array for every space into an array
        const cmd = messageArray[0].toLowerCase().slice(prefix.length); //command is first word in lowercase
        const args = messageArray.slice(1); //args is everything after the first word

        switch (cmd) { //get command
            case "help": //help
                const HelpEmbed = new Discord.RichEmbed()
                    .setTitle("Help")
                    .setColor("RANDOM")
                    .addField(`${prefix}prefix [new prefix]`, "Change the server prefix to whatever", true)
                    .addField(`${prefix}create`, "Makes a new monopoly game inside the channel")
                    .addField(`${prefix}start`, "Starts the game")
                    .addField(`${prefix}stop`, "Ends the game inside of the channel", true)
                    .addField(`${prefix}join`, "Join the game", true)
                    .addField(`${prefix}leave`, "Leave a game", true)
                    .addField(`${prefix}leader [new leader]`, "Change the leader of the game", true)
                    .addField(`${prefix}roll`, "Roll the dice!", true)
                    .addField(`${prefix}stats`, "Get information about yourself", true)
                    .addField(`${prefix}buy`, "Buy the property you are currently on", true)
                    .addField(`${prefix}end`, "Ends your turn", true)
                    .addField(`${prefix}bid [amount|quit]`, "Bid for the auction", true)
                    .addField(`${prefix}house`, "Buy houses", true)
                    .addField(`${prefix}sell [property] {reciever} {cost}`, "Sell property and houses (if theres a house no need to provide a reciever)", true)
                    .addField(`${prefix}offer [confirm|deny]`, "Accept or deny an offer from another player", true)
                    .addField(`${prefix}mortgage [property]`, "Put property up for mortgage", true)
                    .addField(`${prefix}unmortgage [property]`, "Rebuy property", true)
                    .addField(`${prefix}property`, "View all your owned properties and how many houses are on them", true)
                await message.channel.send(HelpEmbed)
                break;
            case "prefix": //change prefix
                if (args[0]) { //if args
                    botconfig.prefixes[message.guild.id].prefix = args[0] //set prefix to arg
                    await message.channel.send(`Prefix set to ${args[0]}`)
                } else { //no args
                    await message.channel.send("I can't set the prefix to nothing!")
                }
                break;
            case "create": //create game
                if (!bot.games.has(message.channel.id)) { //if there isn't a game
                    await bot.games.set(message.channel.id, new Game(message)) //make a new game
                } else { //there is a game
                    await message.reply("theres already a game in this channel!")
                }
                break;
            case "stop": //stop
                if (bot.games.has(message.channel.id)) { //if there is a game
                    if (bot.games.get(message.channel.id).Leader == message.author.id) { //if its the leader
                        await bot.games.delete(message.channel.id) //delete
                        await message.channel.send("Game is over") //games done
                    } else { //not the leader
                        await message.reply("only the leader can end this game.")
                    }
                } else { //no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                }
                break;
            case "join": //join game
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //there is a game
                    bot.games.get(message.channel.id).NewPlayer(message)
                }
                break;
            case "leave": //leave game
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { // there is a game
                    bot.games.get(message.channel.id).PlayerLeave(message)
                }
                break;
            case "start": //start game
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Start(message)
                }
                break;
            case "leader": //change leader
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).ChangeLeader(message)
                }
                break;
            case "roll": //roll the dice
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Roll(message)
                }
                break;
            case "stats": //get player stats
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Stats(message)
                }
                break;
            case "buy": //buy property
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Buy(message)
                }
                break;
            case "end": //end your turn
                if (!bot.games.has(message.channel.id)) { //if there is no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).End(message) //end
                }
                break;
            case "bid": //bid
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Auction(message, args)
                }
                break;
            case "house": //buy a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).BuyProperty(message)
                }
                break;
            case "sell": //sell houses or property to other players
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Sell(message)
                }
                break;
            case "offer": //accept or deny an offer
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Offer(message, args)
                }
                break;
            case "mortgage": //mortgage a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Mortgage(message)
                }
                break;
            case "unmortgage": //unmortgage a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Unmortgage(message)
                }
                break;
            case "property": //view purchased property
                if (!bot.games.has(message.channel.id)) { //if no game
                    await message.reply(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).GetProperty(message)
                }
                break;
        }
    }
})

bot.on("disconnect", async () => { //on disconnect
    fs.writeFile("./botconfig.json", JSON.stringify(botconfig), (err) => { //write new prefix's to file
        if (err) console.log(err)
    })
})

bot.on("messageReactionAdd", async (messageReaction, user) => {
    if (user.bot) return;
    switch (messageReaction.emoji.name) {
        case "🎲":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Roll(messageReaction.message, user)
            break;
        case "🖐":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).NewPlayer(messageReaction.message, user)
            break;
        case "🛑":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).End(messageReaction.message, user)
            break;
        case "✅":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Buy(messageReaction.message, user)
            break;
        case "☑":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Start(messageReaction.message, user)
            break;
        case "❌":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Auction(messageReaction.message, ["quit"], user)
            break;
        case "⬆":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Auction(messageReaction.message, [(bot.games.get(messageReaction.message.channel.id).HighestBid + 10).toString()], user)
            break;
        case "⏫":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Auction(messageReaction.message, [(bot.games.get(messageReaction.message.channel.id).HighestBid + 100).toString()], user)
            break;
        case "🏠":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).BuyProperty(messageReaction.message, user);
            break;
        case "✔":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Offer(messageReaction.message, ["confirm"], user)
            break;
        case "✖":
            if (bot.games.has(messageReaction.message.channel.id)) bot.games.get(messageReaction.message.channel.id).Offer(messageReaction.message, ["deny"], user)
            break;
    }
})
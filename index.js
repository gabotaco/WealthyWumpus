const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const bot = new Discord.Client({
    disableEveryone: true
});
const fs = require("fs")

bot.games = new Discord.Collection(); //stores all games

class Card {
    constructor(Text, Money, Jail, MoveTo, CollectFromPlayers) {
        this.Text = Text; //what it says on the card
        this.Money = Money; //change in money
        this.GetOutOfJail = Jail; //if its get out of jail
        this.MoveTo = MoveTo //what space to move to
        this.CollectFromPlayers = CollectFromPlayers || false //if you collect from players (default is false)
    }
}

const CommunityChestCards = [ //Community chest cards
    new Card("Advance to \"Go\"", 200, false, 0),
    new Card("Bank error in your favor. Collect $200", 200, false, null),
    new Card("Doctor's fees. Pay $50", -50, false, null),
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

const ChanceCards = [ //chance cards
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

class Property { //Make a property
    constructor(Name, Rent, Color, Price, Mortgage, Building) {
        this.Name = Name; //Name of the property
        this.Rent = Rent; //Array of prices based on how many houses they have [no house rent, 1 house rent, 2 house rent...]
        this.Color = Color; //The color of it (discord color or type)
        this.Price = Price; //Cost to buy
        this.Mortgage = Mortgage; //Money back when you mortgage
        this.Building = Building; //How much to buil a building
        this.Mortgaged = false; //if its mortgaged
        this.Owner = null; //who ownes it
        this.Houses = 0; //How many houses are on it
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
            .setColor(this.Color)
            .setTitle(this.Name)
            .addField("Price", this.Price, true)
            .addField("Mortgage", this.Mortgage, true)
            if (this.Color != "Utility" && this.Color != "RR") {
                PropertyEmbed.addField("Price per building", this.Building, true)
            }
        if (typeof (this.Rent) != Number) { //If the rent is an array and not a Number (0)
            for (let i = 0; i < this.Rent.length; i++) { //go through all the rent
                if (i == 5) { //if theres 5 then its a property with hotels
                    PropertyEmbed.addField("1 Hotel", this.Rent[i], true) 
                } else { //not 5
                    if (this.Color == "RR") { //railroad
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"RR":"RR's"}`, this.Rent[i], true) //Rent with _ railroads
                    } else if (this.Color == "Utility") { //Utility
                        if (i != 0) PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"Utility":"Utilities"}`, this.Rent[i] + " * dice roll", true) //rent with _ utility * dice roll
                    } else {
                        PropertyEmbed.addField("Rent with " + i + ` ${(i == 1)?"House":"Houses"}`, this.Rent[i], true) //Then its a house and add the house
                    }
                }
            }
        }
        return PropertyEmbed;
    }
}

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

    RemoveMoney(message, num, OtherPlayer) { //remove money
        this.Money -= parseInt(num) //remove
        if (this.Money < 0) { //if they are bankrupt
            message.channel.send(`<@${this.ID}> you are in debt!! If you are still in debt when you end your turn you will lose!`) //notify
            this.PaidPlayer = OtherPlayer //set who made them bankrupt (can be null if bank)
        }
        message.channel.send(`<@${this.ID}> you have $${this.Money}`) //Inform how much money
    }

    AddMoney(message, num) { //add money
        this.Money += parseInt(num);
        message.channel.send(`<@${this.ID}> you have $${this.Money}`) //inform
    }

    Move(message, spaces, Properties) { //Move them
        this.Position += spaces; //Move them num of spaces
        if (this.Position >= Properties.length) { //if they went around the board
            this.AddMoney(message, 200); //add 200
            this.Position -= Properties.length; //move them back onto the board
            message.channel.send("you passed go!") //inform
        }
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

        this.Properties = [ //The board
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

        message.channel.send(`Welcome to Discord Monopoly! Get your friends to type ${botconfig.prefixes[message.guild.id].prefix}join to join the game`).then(msg => msg.react("🖐"));
    }

    NewPlayer(message, user) { //new player
        if (!user) {
            var userID = message.author.id;
            if (this.Players.has(userID)) return message.channel.send(`<@${userID}>, you are already in this game!`) //Already in the game
            if (this.InProgress) return message.channel.send(`<@${userID}>, you can't join a game thats already started!`) //If the game is in progress    
            if (this.Players.length == 8) return message.channel.send(`<@${userID}> the game is full!`) //game can't be over 8 people because rules of monopoly
        } else {
            var userID = user.id;
            if (this.Players.has(userID)) return;
            if (this.InProgress) return;    
            if (this.Players.length == 8) return message.channel.send(`<@${userID}> the game is full!`) //game can't be over 8 people because rules of monopoly
        }

        this.Players.set(userID, new Player(userID)) //Add them to the game
        message.channel.send(`<@${userID}> welcome to the game! We currently have ${this.Players.size} players!`).then(msg => msg.react("☑")) //Inform
    }

    PlayerLeave(message) { //Player leaves
        if (!this.Players.has(message.author.id)) return message.channel.send("You aren't in this game!") //can't leave if you aren't in it
        if (message.author.id == this.Leader) return message.channel.send(`the leader can't leave! Do ${botconfig.prefixes[message.guild.id].prefix}leader to change the leader!`) //Leader can't leave
        if (this.InProgress) { //If the game is in progress
            this.Players.get(message.author.id).Money = -1 //set money to -1
            this.CheckAndHandleBankrupt(message, this.Players.get(message.author.id)) //Check for bankrupt and then distribute property
        } else { //Game isn't in progress
            this.Players.delete(message.author.id) //delete from players
            message.channel.send(`sorry to see you leave :(`) //Inform
        }
    }

    ChangeLeader(message) { //change the game leader
        if (this.Leader != message.author.id) return message.channel.send(`Only the leader can change the leader`) //only game leader

        const NewLeader = message.mentions.members.first() //new leader is first mention
        if (NewLeader) { //if theres a new leader
            if (this.Players.has(NewLeader.id)) return message.channel.send("the new leader has to be in this game!")
            this.Leader = NewLeader.id //set to new leader
            message.channel.send(`Changed leader to <@${this.Leader}>!`) //inform
        } else { //not a new leader
            message.channel.send(".leader [new leader]") 
        }
    }

    Start(message, user) { //start the game
        if (!user) {
            var userID = message.author.id;
            if (userID != this.Leader) return message.channel.send(`Only <@${this.Leader}> can start this game!`) //only leader can start
            if (this.Players.size < 2) return message.channel.send("I can't start a game with less than 2 players") //only can start with 2 or more players
            if (this.InProgress) return message.channel.send(`the game has already started! It is <@${this.CurrentPlayer.ID}>'s turn!`) //can't start again
        } else {
            var userID = user.id;
            if (userID != this.Leader) return; //only leader can start
            if (this.Players.size < 2) return; message.channel.send("I can't start a game with less than 2 players") //only can start with 2 or more players
            if (this.InProgress) return; //can't start again    
        }

        this.InProgress = true; //set in progress
        this.CurrentPlayerIndex = Math.floor(Math.random() * this.Players.size) //pick random starting player
        this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex] //set currentplayer

        message.channel.send(`Lets get the show on the road! <@${this.CurrentPlayer.ID}>, you are going first! Do ${botconfig.prefixes[message.guild.id].prefix}roll to roll!`).then(msg => msg.react("🎲")) //inform
    }

    HandlePosition(message, userID) { //handle them being in a position
        const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //Get current property
        const PropertyEmbed = CurrentProperty.Info(); //Get info

        if (CurrentProperty.Color == "GO") { //Currently on GO
            message.channel.send("You landed on go and collected $200.").then(msg => msg.react("🛑")) //inform
        } else if (CurrentProperty.Color == "Chest" || CurrentProperty.Color == "Chance") { //Currently on Chest or Chance
            if (CurrentProperty.Color == "Chest") { //If its chest
                var card = CommunityChestCards[Math.floor(Math.random() * CommunityChestCards.length)] //random chest card
            } else if (CurrentProperty.Color == "Chance") { //if its chance
                var card = ChanceCards[Math.floor(Math.random() * ChanceCards.length)] //random chance card
            }

            let Message = `you landed on a ${CurrentProperty.Color.toLowerCase()} card and it says "${card.Text}".` //Inform about card
            if (card.MoveTo == 10) { //if move to jail
                this.CurrentPlayer.Jail();
            } else if (card.GetOutOfJail) { //if its get out of jail
                this.CurrentPlayer.GetOutOfJail++; //increase get out of jail
            } else if (card.MoveTo != null) { //if there is a move to
                if (card.MoveTo < this.CurrentPlayer.Position) { //if its behind the player
                    this.CurrentPlayer.AddMoney(message, 200) //add 200
                    Message += ` You passed go and collected $200!` //Passed go
                }
                this.CurrentPlayer.Position = card.MoveTo //Move
                this.HandlePosition(message, userID)
            } else if (card.CollectFromPlayers) { //If you collect money from others
                if (card.Money < 0) { //if money is below 0
                    this.CurrentPlayer.RemoveMoney(message, ((this.Players.size - 1) * card.Money) * -1, null) //remove money for each player
                    Message += ` You lost $${(this.Players.size - 1) * card.Money * -1}!`
                    this.Players.array().forEach(player => { //loop through each player
                        if (player.ID != this.CurrentPlayer.ID) { //if the player isn't the current player
                            player.AddMoney(message, card.Money * -1) //add money
                        }
                    });
                } else { //If money is 0 or above
                    this.CurrentPlayer.AddMoney(message, (this.Players.size - 1) * card.Money) //Add money
                    Message += ` You collected $${(this.Players.size - 1) * card.Money}!`
                    this.Players.array().forEach(player => { //Loop through each player
                        if (player.ID != this.CurrentPlayer.ID) { //If the player isn't the current one
                            player.RemoveMoney(message, card.Money, null) //remove money
                        }
                    });
                }
            } else { //if the card is just money
                if (card.Money < 0) { //if its below 0
                    this.CurrentPlayer.RemoveMoney(message, card.Money * -1, null) //Remove the money
                } else { //if its 0 or above
                    this.CurrentPlayer.AddMoney(message, card.Money) //Add money
                }
            }
            message.channel.send(Message).then(msg => msg.react("🛑")) //send message
        } else if (CurrentProperty.Color == "Tax") { //if they landed on tax
            const TenPercent = Math.round((this.CurrentPlayer.Money + this.CurrentPlayer.Worth) * 0.1) //get 10 percent of total worth
            if (TenPercent < CurrentProperty.Rent) { //If ten percent is less than the tax
                this.CurrentPlayer.RemoveMoney(message, TenPercent, null) //remove 10 percent
                message.channel.send(`you landed on ${CurrentProperty.Name} and payed $${TenPercent} (10%).`).then(msg => msg.react("🛑")) //inform
            } else { //if its = or more
                this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent, null) //remove tax
                message.channel.send(`you landed on ${CurrentProperty.Name} and payed $${CurrentProperty.Rent}.`).then(msg => msg.react("🛑")) //inform
            }
        } else if (CurrentProperty.Color == "Jail") { //if they land on jail
            if (!this.CurrentPlayer.Jailed) message.channel.send("you are just visiting jail.").then(msg => msg.react("🛑"))
        } else if (CurrentProperty.Color == "Utility") { //if they land on utility
            if (CurrentProperty.Owner) { //if its owned
                if (CurrentProperty.Owner.ID != this.CurrentPlayer.ID) { //if its owned by someone else
                    if (CurrentProperty.Mortgaged) { //if its mortgaged
                        message.channel.send(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`).then(msg => msg.react("🛑"))
                    } else { //if its not mortgaged
                        const Price = (Dice1 + Dice2) * CurrentProperty.Rent[CurrentProperty.Owner.Utility] //price is dice roll * rent
                        this.CurrentPlayer.RemoveMoney(message, Price, CurrentProperty.Owner) //remove amount
                        CurrentProperty.Owner.AddMoney(message, Price) //add to owner
                        message.channel.send(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and paid them $${Price}.`).then(msg => msg.react("🛑"))
                    }
                } else { //if you land on your own utility
                    message.channel.send(`You landed on your own ${CurrentProperty.Name}...`).then(msg => msg.react("🛑"))
                }
            } else { //if its not owned
                message.channel.send(`You landed on ${CurrentProperty.Name} and it costs $${CurrentProperty.Price}. Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it! (You have $${this.CurrentPlayer.Money})`).then(async msg => {await msg.react("✅"); await msg.react("🛑"); })
                message.channel.send(CurrentProperty.Info())
            }
        } else if (CurrentProperty.Color == "Parking") { //if its parking
            message.channel.send("You landed on free parking.").then(msg => msg.react("🛑"))
        } else if (CurrentProperty.Color == "Go To Jail") { //if its go to jail
            message.channel.send("You landed on go to jail!").then(msg => msg.react("🛑"))
            this.CurrentPlayer.Jail()
        } else if (CurrentProperty.Color == "RR") { //if its a rail road
            if (CurrentProperty.Owner) { //if its owned
                if (CurrentProperty.Mortgaged) { //if its mortgaged
                    message.channel.send(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} but its mortgaged...`).then(msg => msg.react("🛑"))
                } else { //not mortgaged
                    if (CurrentProperty.Owner.ID != this.CurrentPlayer.ID) { //if its not owned by you
                        this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.RR], CurrentProperty.Owner) //remove money
                        CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Owner.RR]) //add money to owner
                        message.channel.send(`You landed on <@${CurrentProperty.Owner.ID}>'s ${CurrentProperty.Name} and payed them $${CurrentProperty.Rent[CurrentProperty.Owner.RR]}`).then(msg => msg.react("🛑"))
                    } else { //if its owned by you
                        message.channel.send(`You landed on ${CurrentProperty.Name} but you already own it!`).then(msg => msg.react("🛑"))
                    }
                }
            } else { //not owned
                message.channel.send(`You landed on ${CurrentProperty.Name} and it costs $${CurrentProperty.Price}. Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy it or ${botconfig.prefixes[message.guild.id].prefix}end to auction it! (You have $${this.CurrentPlayer.Money})`).then(async msg => {await msg.react("✅"); await msg.react("🛑"); })
                message.channel.send(CurrentProperty.Info())
            }
        } else { //regular property
            if (CurrentProperty.Owner) { //if theres an owner
                if (CurrentProperty.Owner.ID == this.CurrentPlayer.ID) message.channel.send(`You landed on ${CurrentProperty.Name} but you already own it...`).then(msg => msg.react("🛑")) //landed on your own
                else { //you don't own it
                    if (CurrentProperty.Mortgaged) { //if its mortgaged
                        message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}> but it is mortgaged...`).then(msg => msg.react("🛑"))
                    } else { //not mortgaged
                        if (CurrentProperty.Houses > 0) { //more than 0 house
                            message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(msg => msg.react("🛑"))
                            this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner) //remove money
                            CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses]) //add money
                        } else { //0 houses
                            if (CurrentProperty.Color == "DARK_ORANGE" || CurrentProperty.Color == "DARK_BLUE") { //if its orange or blue
                                if (CurrentProperty.Owner[CurrentProperty.Color] < 2) { //doesn't own all 2
                                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                    CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                    message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(msg => msg.react("🛑"))
                                } else { //owns all 2
                                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner) //multiply rent by 2
                                    CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                    message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`).then(msg => msg.react("🛑"))
                                }
                            } else { //any other color
                                if (CurrentProperty.Owner[CurrentProperty.Color] < 3) { //doesn't own all 3
                                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses], CurrentProperty.Owner)
                                    CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses])
                                    message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses]}!`).then(msg => msg.react("🛑"))
                                } else { //does own all 3
                                    this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2, CurrentProperty.Owner) //multiply rent by 2
                                    CurrentProperty.Owner.AddMoney(message, CurrentProperty.Rent[CurrentProperty.Houses] * 2)
                                    message.channel.send(`You landed on ${CurrentProperty.Name} which is owned by <@${CurrentProperty.Owner.ID}>. You payed him $${CurrentProperty.Rent[CurrentProperty.Houses] * 2}!`).then(msg => msg.react("🛑"))
                                }
                            }
                        }
                    }
                }
            } else { //nobody owns it
                message.channel.send(PropertyEmbed)
                message.channel.send(`Do ${botconfig.prefixes[message.guild.id].prefix}buy to buy the property or do ${botconfig.prefixes[message.guild.id].prefix}end to auction it! (You have $${this.CurrentPlayer.Money})`).then(async msg => {await msg.react("✅"); await msg.react("🛑"); })
            }
        }
    }

    Roll(message, user) { //roll
        if (!user) {
            var userID = message.author.id;
            if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //if its not in progress
            if (message.author.id != this.CurrentPlayer.ID) return message.channel.send("it's not your turn!") //current player can only roll
            if (this.CurrentPlayer.Rolled) return message.channel.send("you already rolled") //if they have already rolled    
        } else {
            var userID = user.id;
            if (!this.InProgress) return;
            if (user.id != this.CurrentPlayer.ID) return;
            if (this.CurrentPlayer.Rolled) return;
        }

        this.CurrentPlayer.Rolled = true //set to rolled

        const Dice1 = Math.floor(Math.random() * 6) + 1; //roll 2 dice
        const Dice2 = Math.floor(Math.random() * 6) + 1;

        message.channel.send(`<@${userID}>, you rolled a ${Dice1} and a ${Dice2}`) //inform

        if (this.CurrentPlayer.Jailed) { //if the player is in jail
            this.CurrentPlayer.JailTime++; //increase jail time
            if (Dice1 == Dice2) { //If they rolled doubles
                message.channel.send("You rolled doubles and got out of jail free!")
                this.CurrentPlayer.Free() //free from jail
                this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
            } else { //didn't roll doubles
                if (this.CurrentPlayer.GetOutOfJail > 0) { //if they have at least 1 get out of jail card
                    message.channel.send("Used one of your get out of jail free cards and got out of jail!")
                    this.CurrentPlayer.GetOutOfJail--; //remove the card
                    this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
                    this.CurrentPlayer.Free() //Free them from jail
                } else { //no get out of jail cards
                    if (this.CurrentPlayer.JailTime == 3) { //been in jail for 3 turns
                        this.CurrentPlayer.RemoveMoney(message, 50, null); //pay 50
                        message.channel.send("Payed 50 dollars and got out of jail.") //Inform
                        this.CurrentPlayer.Free(); //free
                        this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
                    } else { //been in jail for less than 3 turns
                        message.channel.send("You are in jail and cannot move!").then(msg => msg.react("🛑")) //can't move
                    }

                }
            }
        } else { //not jailed
            this.CurrentPlayer.Move(message, Dice1 + Dice2, this.Properties) //move
        }

        this.HandlePosition(message, userID)

        if (Dice1 == Dice2) { //doubles
            this.CurrentPlayer.Doubles = true; //rolled doubles
            this.CurrentPlayer.DoublesStreak++; //increase streak
            if (this.CurrentPlayer.DoublesStreak == 3) { //third time
                this.CurrentPlayer.DoublesStreak = 0; //remove streak
                this.CurrentPlayer.Doubles = false; //remove doubles
                this.CurrentPlayer.Jail(); //jail them
                message.channel.send("you rolled doubles 3 times in a row and are now in jail!").then(msg => msg.react("🛑"))
            } else { //not third time
                message.channel.send("you rolled doubles so you get to go again!").then(msg => msg.react("🛑"))
            }
        } else { //not doubles
            this.CurrentPlayer.Doubles = false;
            this.CurrentPlayer.DoublesStreak = 0;
        }

    }

    Stats(message) { //get stats for player
        if (!this.Players.has(message.author.id)) return message.channel.send("you aren't in this game")
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
        message.channel.send(PlayerEmbed)
    }

    Buy(message, user) { //Buy current property
        if (!user) {
            var userID = message.author.id
            if (!this.Players.has(userID)) return message.channel.send("you aren't in this game.") //must be in game
            if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //game has to be in progress
            if (userID != this.CurrentPlayer.ID) return message.channel.send("it's not your turn!") //has to be their turn    
        } else {
            var userID = user.id
            if (!this.Players.has(userID)) return;
            if (!this.InProgress) return;
            if (userID != this.CurrentPlayer.ID) return;
        }

        const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //Get property they are on
        if (!CurrentProperty.Price) return message.channel.send(`<@${userID}>, you can't buy this!`).then(msg => msg.react("🛑")) //if there isn't a price
        if (CurrentProperty.Owner) return message.channel.send(`<@${CurrentProperty.Owner.ID}> already owns this!`).then(msg => msg.react("🛑")) //if theres an owner
        if (CurrentProperty.Price > this.CurrentPlayer.Money) return message.channel.send(`<@${userID}> you don't have enough money to buy this!`).then(msg => msg.react("🛑")) //if its over their price 
        else { //if they can afford it
            this.CurrentPlayer.RemoveMoney(message, CurrentProperty.Price, null); //remove money
            CurrentProperty.Buy(this.CurrentPlayer) //buy it
            message.channel.send(`<@${userID}>, you bought ${CurrentProperty.Name}!`).then(msg => msg.react("🛑"))
        }

    }

    CheckAndHandleBankrupt(message, Player) { //check if they are bankrupt
        if (Player.Money < 0) { //if they have less than 0 money
            this.Players.delete(Player.ID) //remove player
            message.channel.send(`<@${Player.ID}> went bankrupt!`) //inform
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
                    Player.PaidPlayer.AddMoney(message, MoneyForNewPlayer) //pay the player
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
                message.channel.send(`CONGRATS <@${this.Players.array()[0].ID}> YOU HAVE WON!`) //won
                bot.games.delete(message.channel.id) //delete game
            }
        }
    }

    End(message, user) { //end turn
        if (!user) {
            var userID = message.author.id
            if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //if not in progress
            if (userID != this.CurrentPlayer.ID) return message.channel.send('its not your turn') //if not their turn
            if (!this.CurrentPlayer.Rolled) return message.channel.send("you haven't rolled yet") //if haven't rolled
        } else {
            var userID = user.id;
            if (!this.InProgress) return;
            if (userID != this.CurrentPlayer.ID) return; //if not their turn
            if (!this.CurrentPlayer.Rolled) return message.channel.send("you haven't rolled yet") //if haven't rolled
        }

        this.CheckAndHandleBankrupt(message, this.CurrentPlayer) //check for bankruptcy

        if (this.Properties[this.CurrentPlayer.Position].Owner == null && this.Properties[this.CurrentPlayer.Position].Price > 0) { //if the current property doesn't have an owner and can be bought
            this.Bidding = true; //start bid
            this.HighestBid = 0 //highest bid of 0
            this.Bidders = this.Players.concat().array() //put all players into an array that copys the players
            this.BiddersIndex = this.CurrentPlayerIndex; //Start off with the current player
            message.channel.send(`Let the bidding begin! <@${this.Bidders[this.BiddersIndex].ID}> type !bid [amount] to place a bid or type !bid quit to back out.`) //start bid
        } else { //if bought or can't be bought
            this.CurrentPlayer.Rolled = false; //reset rolled
            if (this.CurrentPlayer.Doubles && this.CurrentPlayer.Money >= 0) { //if its doubles and they didn't go bankrupt
                message.channel.send("roll again!").then(msg => msg.react("🎲"))
            } else { //if it wasn't doubles or they went bankrupt
                this.CurrentPlayerIndex++; //next player
                if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0; //if past the last player reset to first
                this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex] //get current player
                message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`).then(msg => msg.react("🎲"))
            }
        }
    }

    Auction(message) { //bidding
        if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //must be in progress
        if (!this.Bidding) return message.channel.send("not currently bidding") //must be bidding
        if (this.Bidders[this.BiddersIndex].ID != message.author.id) return message.channel.send(`the current bidder is <@${Bidders[this.BiddersIndex].ID}>!`) //must be current bidder

        let amount = message.content.split(" ")[1] //get amount
        if (!amount) return message.channel.send(".bid [amount] or .bid quit")
        if (amount.toLowerCase() == "quit") { //if they quit
            this.Bidders.splice(this.BiddersIndex, 1) //remove the bidder
            message.channel.send("removed you from the bidders")
            if (this.Bidders.length == 1) { //if only 1 bidder
                this.Bidding = false; //stop bidding
                const winner = this.Players.get(this.Bidders[0].ID) //winner as a player
                const CurrentProperty = this.Properties[this.CurrentPlayer.Position] //get the property they won
                message.channel.send(`<@${winner.ID}> congrats you won ${this.Properties[this.CurrentPlayer.Position].Name} for $${this.HighestBid}`) //inform
                winner.RemoveMoney(message, this.HighestBid, null); //remove money
                CurrentProperty.Buy(winner) //buy it
                this.CurrentPlayer.Rolled = false; //set rolled to false
                if (this.CurrentPlayer.Doubles) { //if they rolled doubles
                    message.channel.send(`<@${this.CurrentPlayer.ID}> roll again!`).then(msg => msg.react("🎲"))
                } else { //didn't roll doubles
                    this.CurrentPlayerIndex++;
                    if (this.CurrentPlayerIndex >= this.Players.size) this.CurrentPlayerIndex = 0; //reset to 0
                    this.CurrentPlayer = this.Players.array()[this.CurrentPlayerIndex]
                    message.channel.send(`<@${this.CurrentPlayer.ID}> it's your turn!`).then(msg => msg.react("🎲"))
                }
            } else { //still more than 1 bidder
                if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0; //go to next bidder
                message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid!`)
            }
        } else { //didn't quit
            amount = parseInt(amount) //convert to int
            if (!amount) return message.channel.send("you must specify a valid amount or say !bid quit")
            if (amount <= this.HighestBid) return message.channel.send(`you must bid higher than $${this.HighestBid} or say !bid quit`) //has to be higher
            if (amount > this.Bidders[this.BiddersIndex].Money) return message.channel.send("thats above the amount of money you have!")
            this.HighestBid = amount; //set highest bid
            this.BiddersIndex++; //next bidder
            if (this.BiddersIndex >= this.Bidders.length) this.BiddersIndex = 0;
            message.channel.send(`<@${this.Bidders[this.BiddersIndex].ID}> its your turn to bid!`)
        }
    }

    BuyProperty(message) { //Buy a house
        if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //has to have started
        if (message.author.id != this.CurrentPlayer.ID) return message.channel.send('its not your turn') //gotta be your turn

        let LeastHouses = 10; //least house is 10 (just has to be more than 5)
        let PropertyIndex; //null at first
        for (let i = 0; i < this.Properties.length; i++) { //go through all propertys
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Owner && CurrentProperty.Houses < LeastHouses && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) { //if there is an owner, it has the least num of houses and the owner is the player
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
        if (!PropertyIndex) return message.channel.send("you can't buy a house on anything!").then(msg => msg.react("🛑")) //If there isn't a property index
        const CurrentProperty = this.Properties[PropertyIndex]
        if (CurrentProperty.Houses == 5) return message.channel.send("You can't build anymore houses").then(msg => msg.react("🛑")) //if theres already 5 houses
        if (CurrentProperty.Building > this.CurrentPlayer.Money) return message.channel.send("You don't have enough money to build a house").then(msg => msg.react("🛑")) //if they can't afford it
        this.CurrentPlayer.RemoveMoney(message, this.Properties[PropertyIndex].Building, null) //remove money for the building cost
        this.Properties[PropertyIndex].Houses++; //increase houses
        message.channel.send(`you spent $${this.Properties[PropertyIndex].Building} and now have ${this.Properties[PropertyIndex].Houses} ${(this.Properties[PropertyIndex].Houses == 1)?"house":"houses"} on ${this.Properties[PropertyIndex].Name}!`).then(msg => msg.react("🛑"))
    }

    Sell(message) { //sell a property
        if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //if not in progress
        if (message.author.id != this.CurrentPlayer.ID) return message.channel.send('its not your turn') //if its not their turn

        let Arg = message.content.split(" ")[1] //property arg
        let Money = parseInt(message.content.split(" ")[message.content.split(" ").length - 1]) //get last arg
        let reciever = message.mentions.members.first(); //first mention
        if (!Arg) return message.channel.send("!sell [property] [reciever] [cost]") //if there isn't a first arg
        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //go through all properties
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Owner && CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) { //if theres an owner and name includes what was typed and the owner is the current player
                if (FoundHouseIndex) { //if already found a house
                    return message.channel.send("you have to be more specific with the property name") //have to be more specific
                } else {
                    FoundHouseIndex = i //set found house index
                }
            }
        }
        if (!FoundHouseIndex) return message.channel.send("couldn't find that property") //if haven't found a house
        if (this.Properties[FoundHouseIndex].Houses > 0) { //if theres more than one house on it
            this.CurrentPlayer.AddMoney(message, Math.round(this.Properties[FoundHouseIndex].Building / 2)); //sell the house for half the house cost
            this.Properties[FoundHouseIndex].Houses--; //remove house
            message.channel.send(`you sold 1 house for $${Math.round(this.Properties[FoundHouseIndex].Building / 2)} and now have ${this.Properties[FoundHouseIndex].Houses} ${(this.Properties[FoundHouseIndex].Houses == 1)?"house":"houses"} on it!`).then(msg => msg.react("🛑"))
        } else { //no houses
            if (!reciever) return message.channel.send("!sell [property] [reciever] [amount]")
            reciever = this.Players.get(reciever.id) //get the player
            if (!reciever) return message.channel.send("invalid reciever!")
            if (reciever == this.Players.get(message.author.id)) return message.channel.send("You can't sell to yourself") //can't sell to yourself
            switch (this.Properties[FoundHouseIndex].Color) { //get all the houses in the color and make sure there are no houses
                case "DARK_ORANGE":
                    if (this.Properties[1].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                    } else if (this.Properties[3].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                    }
                    break;
                case "BLUE":
                    if (this.Properties[6].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                    } else if (this.Properties[8].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                    } else if (this.Properties[9].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                    }
                    break;
                case "LUMINOUS_VIVID_PINK":
                    if (this.Properties[11].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                    } else if (this.Properties[13].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                    } else if (this.Properties[14].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                    }
                    break;
                case "ORANGE":
                    if (this.Properties[16].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                    } else if (this.Properties[18].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                    } else if (this.Properties[19].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                    }
                    break;
                case "DARK_RED":
                    if (this.Properties[21].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                    } else if (this.Properties[23].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                    } else if (this.Properties[24].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                    }
                    break;
                case "GOLD":
                    if (this.Properties[26].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                    } else if (this.Properties[27].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                    } else if (this.Properties[29].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                    }
                    break;
                case "DARK_GREEN":
                    if (this.Properties[31].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                    } else if (this.Properties[32].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                    } else if (this.Properties[34].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                    }
                    break;
                case "DARK_BLUE":
                    if (this.Properties[37].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                    } else if (this.Properties[39].Houses > 0) {
                        return message.channel.send(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                    }
                    break;
            }
            if (reciever.CurrentOffer) return message.channel.send("they have a pending offer already!") //if the reciever already has an offer
            reciever.CurrentOffer = new Offer(FoundHouseIndex, Money, this.CurrentPlayer) //set offer to the new offer
            message.channel.send(`<@${reciever.ID}>, <@${message.author.id}> has offered you ${this.Properties[FoundHouseIndex].Name} for $${Money}`)
        }
    }

    Offer(message) { //accept or deny offers
        if (!this.InProgress) return message.channel.send(`the game hasen't started yet!`) //if not in progress
        if (!this.Players.has(message.author.id)) return message.channel.send("you aren't in the game!") //if they aren't in the game
        const Player = this.Players.get(message.author.id); //get the player
        if (!Player.CurrentOffer) return message.channel.send("you don't have a pending offer") //if they don't have a current offer
        const Property = this.Properties[Player.CurrentOffer.PropertyIndex] //get the property offered
        if (Player.CurrentOffer.OriginalOwner.ID != Property.Owner.ID) { //If the property is no longer owned by the offerer
            Player.CurrentOffer = null; //remove offer
            return message.channel.send("someone already bought it!")
        }
        let answer = message.content.split(" ")[1]; //get the first arg
        let amount = parseInt(message.content.split(" ")[2]); //second arg
        if ((!answer) || (answer != "deny" && !amount)) return message.channel.send(".offer [confirm|deny] [amount]") //if theres no answer or the answer isn't deny and there isn't an amount
        answer = answer.toLowerCase(); //change to lower case
        if (answer == "confirm") { //if they confirm
            if (amount == Player.CurrentOffer.Price) { //if the amount is the same as the offered price
                Property.Buy(Player) //buy
                Player.RemoveMoney(message, Player.CurrentOffer.Price, this.Players.get(Player.CurrentOffer.OriginalOwner.ID)) //remove money
                this.Players.get(Player.CurrentOffer.OriginalOwner.ID).AddMoney(message, Player.CurrentOffer.Price) //add money
                message.channel.send(`you bought ${Property.Name} for $${Player.CurrentOffer.Price}`);
                Player.CurrentOffer = null; //remove offer
                return;
            } else { //not the same
                return message.channel.send(`the price is $${Player.CurrentOffer.Price}. Either .offer confirm ${Player.CurrentOffer.Price} or .offer deny`)
            }
        } else if (answer == "deny") { //deny
            Player.CurrentOffer = null; //remove offer
            return message.channel.send(`denied.`)
        } else { //neither comfirm or deny
            return message.channel.send(`.offer [confirm|deny] {amount}`)
        }
    }

    Mortgage(message) { //mortgage a property
        if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //not in progress
        if (message.author.id != this.CurrentPlayer.ID) return message.channel.send('its not your turn') //not their turn

        let Arg = message.content.split(" ")[1] //first arg
        if (!Arg) return message.channel.send("You must specify what property you want to mortgage!") //no first arg

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //go through all properties
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) { //if property name includes arg and is owned
                if (FoundHouseIndex) { //if already found house
                    return message.channel.send("you have to be more specific with the property name") //stop
                } else { //not found one
                    FoundHouseIndex = i //set it to current index
                }
            }
        }

        if (!FoundHouseIndex) return message.channel.send("couldn't find that property") //no index
        const FoundHouse = this.Properties[FoundHouseIndex] //get found house
        if (FoundHouse.Mortgaged) return message.channel.send("that is already mortgaged").then(msg => msg.react("🛑")) //if its already mortgaged

        switch (FoundHouse.Color) { //have to sell houses on all properties of same color to mortgage
            case "DARK_ORANGE":
                if (this.Properties[1].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[1].Name} first!`)
                } else if (this.Properties[3].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[3].Name} first!`)
                }
                FoundHouse.Owner.DARK_ORANGE--;
                break;
            case "BLUE":
                if (this.Properties[6].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[6].Name} first!`)
                } else if (this.Properties[8].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[8].Name} first!`)
                } else if (this.Properties[9].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[9].Name} first!`)
                }
                FoundHouse.Owner.BLUE--;
                break;
            case "LUMINOUS_VIVID_PINK":
                if (this.Properties[11].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[11].Name} first!`)
                } else if (this.Properties[13].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[13].Name} first!`)
                } else if (this.Properties[14].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[14].Name} first!`)
                }
                FoundHouse.Owner.LUMINOUS_VIVID_PINK--;
                break;
            case "ORANGE":
                if (this.Properties[16].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[16].Name} first!`)
                } else if (this.Properties[18].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[18].Name} first!`)
                } else if (this.Properties[19].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[19].Name} first!`)
                }
                FoundHouse.Owner.ORANGE--;
                break;
            case "DARK_RED":
                if (this.Properties[21].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[21].Name} first!`)
                } else if (this.Properties[23].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[23].Name} first!`)
                } else if (this.Properties[24].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[24].Name} first!`)
                }
                FoundHouse.Owner.DARK_RED--;
                break;
            case "GOLD":
                if (this.Properties[26].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[26].Name} first!`)
                } else if (this.Properties[27].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[27].Name} first!`)
                } else if (this.Properties[29].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[29].Name} first!`)
                }
                FoundHouse.Owner.GOLD--;
                break;
            case "DARK_GREEN":
                if (this.Properties[31].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[31].Name} first!`)
                } else if (this.Properties[32].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[32].Name} first!`)
                } else if (this.Properties[34].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[34].Name} first!`)
                }
                FoundHouse.Owner.DARK_GREEN--;
                break;
            case "DARK_BLUE":
                if (this.Properties[37].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[37].Name} first!`)
                } else if (this.Properties[39].Houses > 0) {
                    return message.channel.send(`you have to sell all the houses on ${this.Properties[39].Name} first!`)
                }
                FoundHouse.Owner.DARK_BLUE--;
                break;
        }

        FoundHouse.Mortgaged = true; //mortgage
        FoundHouse.Owner.AddMoney(message, FoundHouse.Mortgage) //add money
        message.channel.send(`you mortgaged ${FoundHouse.Name} for $${FoundHouse.Mortgage}`).then(msg => msg.react("🛑"))
    }

    Unmortgage(message) { //unmortage a house
        if (!this.InProgress) return message.channel.send("the game hasen't started yet!") //has to be in progress
        if (message.author.id != this.CurrentPlayer.ID) return message.channel.send('its not your turn') //if its not their turn

        let Arg = message.content.split(" ")[1] //get property
        if (!Arg) return message.channel.send("You must specify what property you want to unmortgage!")

        let FoundHouseIndex;
        for (let i = 0; i < this.Properties.length; i++) { //find it
            const CurrentProperty = this.Properties[i]
            if (CurrentProperty.Name.toLowerCase().includes(Arg.toLowerCase()) && CurrentProperty.Owner.ID == this.CurrentPlayer.ID) {
                if (FoundHouseIndex) {
                    return message.channel.send("you have to be more specific with the property name")
                } else {
                    FoundHouseIndex = i
                }
            }
        }
        if (!FoundHouseIndex) return message.channel.send("couldn't find that property")
        const FoundHouse = this.Properties[FoundHouseIndex]
        if (!FoundHouse.Mortgaged) return message.channel.send("that isn't mortgaged") //if it isn't mortgaged
        const Price = FoundHouse.Mortgage * 1.10; //the price to unmortgage is 110% the mortgage cost

        if (Price > this.CurrentPlayer.Money) return message.channel.send(`you don't have enough money to unmortgage it for $${Price}.`).then(msg => msg.react("🛑")) //if its over their price
        FoundHouse.Owner[FoundHouse.Color]++; //increase amount for color

        this.CurrentPlayer.RemoveMoney(message, Price, null) //pay for it

        FoundHouse.Mortgaged = false; //unmortgage

        message.channel.send(`bought back ${FoundHouse.Name} for $${Price}`).then(msg => msg.react("🛑"))
    }

    GetProperty(message) { //get properties owned
        if (!this.InProgress) return message.channel.send("The game hasen't started yet!")
        if (!this.Players.has(message.author.id)) return message.channel.send("You aren't in this game")

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
        message.channel.send(PropertyEmbed)
    }
}

bot.login(botconfig.token) //login bot

bot.on("ready", async () => {
    bot.user.setActivity("Monopoly {!help}", { //playing monopoly
        type: "PLAYING"
    })

    console.log(`${bot.user.username} is online!`)
})

bot.on("message", async (message) => {
    if (message.author.bot) return; //if from a bot
    if (message.content == "shutdown" && message.author.id == "330000865215643658") { //if it says shutdown and from owner
        bot.destroy()
        return;
    }
    if (!botconfig.prefixes[message.guild.id]) botconfig.prefixes[message.guild.id] = { //if there isn't a prefix set it to !
        "prefix": "!"
    }
    const prefix = botconfig.prefixes[message.guild.id].prefix; //get prefix
    if (message.mentions.members.first() && message.mentions.members.first().id == "592761354021109801") return message.channel.send(`${prefix}help`) //if the first @'d member is the bot

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
                    .addField(`${prefix}bid`, "Bid for the auction", true)
                    .addField(`${prefix}house`, "Buy houses", true)
                    .addField(`${prefix}sell [property] [reciever] [cost]`, "Sell property and houses (if theres a house no need to provide a reciever)", true)
                    .addField(`${prefix}offer`, "Accept or deny an offer from another player", true)
                    .addField(`${prefix}mortgage`, "Put property up for mortgage", true)
                    .addField(`${prefix}unmortgage`, "Rebuy property", true)
                    .addField(`${prefix}property`, "View all your owned properties and how many houses are on them", true)
                message.channel.send(HelpEmbed)
                break;
            case "prefix": //change prefix
                if (args[0]) { //if args
                    botconfig.prefixes[message.guild.id].prefix = args[0] //set prefix to arg
                    message.channel.send(`Prefix set to ${args[0]}`)
                } else { //no args
                    message.channel.send("I can't set the prefix to nothing!")
                }
                break;
            case "create": //create game
                if (!bot.games.has(message.channel.id)) { //if there isn't a game
                    bot.games.set(message.channel.id, new Game(message)) //make a new game
                } else { //there is a game
                    message.channel.send("theres already a game in this channel!")
                }
                break;
            case "stop": //stop
                if (bot.games.has(message.channel.id)) { //if there is a game
                    if (bot.games.get(message.channel.id).Leader == message.author.id) { //if its the leader
                        bot.games.delete(message.channel.id) //delete
                        message.channel.send("Game is over") //games done
                    } else { //not the leader
                        message.channel.send("only the leader can end this game.")
                    }
                } else { //no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                }
                break;
            case "join": //join game
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //there is a game
                    bot.games.get(message.channel.id).NewPlayer(message)
                }
                break;
            case "leave": //leave game
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else {// there is a game
                    bot.games.get(message.channel.id).PlayerLeave(message)
                }
                break;
            case "start": //start game
                if (!bot.games.has(message.channel.id)) {//if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Start(message)
                }
                break;
            case "leader": //change leader
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).ChangeLeader(message)
                }
                break;
            case "roll": //roll the dice
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Roll(message)
                }
                break;
            case "stats": //get player stats
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Stats(message)
                }
                break;
            case "buy": //buy property
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Buy(message)
                }
                break;
            case "end": //end the game
                if (!bot.games.has(message.channel.id)) { //if there is no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).End(message) //end
                }
                break;
            case "bid": //bid
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Auction(message)
                }
                break;
            case "house": //buy a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).BuyProperty(message)
                }
                break;
            case "sell": //sell houses or property to other players
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Sell(message)
                }
                break;
            case "offer": //accept or deny an offer
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Offer(message)
                }
                break;
            case "mortgage": //mortgage a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Mortgage(message)
                }
                break;
            case "unmortgage": //unmortgage a house
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
                } else { //if game
                    bot.games.get(message.channel.id).Unmortgage(message)
                }
                break;
            case "property": //view purchased property
                if (!bot.games.has(message.channel.id)) { //if no game
                    message.channel.send(`there is no game in this channel. Do ${prefix}create to make a game`)
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
    }
})
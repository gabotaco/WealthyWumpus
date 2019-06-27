<h1 align="center">
    <img src="https://cdn.discordapp.com/attachments/593554477844529152/593819333596151820/Artboard_1.png" alt="Money Man" width="250"></a>
  <br>
  Money Man
  <br>
</h1>

<h4 align="center">
    A Discord bot to play Monopoly in Discord. Made for Discord Hack Week
</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#commands">Commands</a> •
  <a href="#how-to-play">How to Play</a> •
  <a href="#installation">Installation</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

<div align="center"> <img src="https://cdn-images-1.medium.com/max/2600/1*lh6NS8hx0pu5mlZeSqnu5w.jpeg" width="100%"> </div>

# Key Features

* Easily Customizable
  - Add and change properties
  - Add and change Community Chest and Chance cards
* Object Oriented
* Flexible
* Easy to Play
    - Use message reactions instead of typing commands
* Light Weight
* Incorporates 99% of rules from the original game
* Quick and fun to play

# Commands

Some commands have reactions to make it easier to play but here's the list of all commands:

| Command | Description  | Has Reaction |
|---------|--------------|------------- |
|!help  | **Get a list of all supported commands**|❌|
|!prefix [new prefix]  | **Change the server prefix**|❌|
|!create  | **Create a new game in the channel**|❌|
|!stop  | **Ends the game in the channel**|❌|
|!join  | **Join the game**|✅|
|!leave  | **Leave the current game**|❌|
|!start  | **Start the game**|✅|
|!leader [new leader]  | **Change the game leader**|❌|
|!roll  | **Roll the dice**|✅|
|!stats  | **Get a info about yourself**|❌|
|!buy  | **Buy the property you are currently on**|✅|
|!end  | **End your turn**|✅|
|!bid [amount\|quit]  | **Bid on property or back out**|✅|
|!house  | **Buy a house**|✅|
|!sell [property] {player} {amount} | **Sell a house on the property or the property to another player**|❌|
|!offer [confirm\|deny]  | **Accept or deny an offer from another player**|✅|
|!mortgage [property]  | **Mortgage a property**|❌|
|!unmortgage [property]  | **Unmortgage a property**|❌|
|!property  | **Get a list of all owned property's and how many houses are on it**|❌|

# How to Play

The game follows all original Monopoly rules found [here](https://www.hasbro.com/common/instruct/monins.pdf). 

The only change made for this bot is that when the player goes bankrupt to the bank (tax or card) the property is not auctioned off, it is instead put back up on the market for anyone to buy when they land on it.

## Steps

1. To start, invite the bot to your server and make sure it has permission to send messages and read channels.
2. Pick a channel and do `!create` to make a game.
3. Friends can join by doing `!join` in the channel or reacting with 🖐.
  * There is a minimum of 2 players and a maximum of 8 players.
4. Once you have all your players the leader can do `!start` or react with the ballet box with check emoji.
  * It will pick a random person to begin.
5. When its your turn you can react with the 🎲 or the 🏠 (you can do `!roll` or `!house` if you prefer). The die will roll 2 dice and move you to the new position. The house will attempt to buy a house (see <a href="#buying-houses">this</a> for buying a house).
  * If you land on unowned property you can react with the ✅ to buy it or react with the 🛑 to auction it (see <a href="#auctions">auctions</a> for more detail).
  * If you land on a Chance card or a Community Chest card your character will do whatever the card says (get money, lose money, move to new position etc.)
  * If you land on go to jail or get a card that moves you to jail you will be moved to jail and your turn will be over (if you rolled doubles you get to roll again). See <a href="#jail">jail</a> for more info.
6. Before or after rolling, the player can offer property to another player for a specified amount of money, sell houses or mortgage/unmortgage property. These all must be done through commands. To understand selling houses and property read <a href="#selling-property">this</a>. To Mortgage and unmortgage property simply do either `!mortgage [property]` or `!unmortgage [property]`. 
7. After you are finished with your command you can react with 🛑 to move on to the next player.
8. Repeat until someone goes bankrupt.

## Auctions

When property is put up for auction, the player who landed on it begins the auction. Property starts at $0 during an auction and the first player must bid at least $1. You have 4 options for bidding. You can either do `!bid [amount]` to bid a custom amount or you can react with the 3 emojis. ❌ will take you out of the auction, ⬆ will raise the current bid by $10, and ⏫ will raise the current bid by $100. The auction is over when there is only 1 person left.  

## Jail

A player can go to jail in 3 ways. Either by getting a card that sends them to jail, landing on the go to jail tile or by rolling doubles 3 times in a row. While in jail the player can still collect rent and can bid on property and accept offers. There are 3 ways a player can get out of jail. Either by having a get out of jail free card (will be used the first turn if you don't roll doubles), by rolling doubles or if you don't roll doubles after 3 turns you will pay $50 dollars and get out of jail.

## Buying Houses

In order to buy a house, you have to own all properties in a color group. Once that is done houses must be built evenly across all color groups that you own. Reacting with the 🏠 or doing `!house` will find the cheapest eligible property and build a house. 

## Selling Property

To offer property to another player you must sell all houses in that color group (it will tell you if you need to). To sell houses do `!sell [property]` (you don't need to specify a person or amount). Once there are no more houses on that color group you can do `!sell [property] [person] [amount]` to offer it to another player. When you offer to the player the bot will notify them and the player can react with ✔ to accept it and pay you for it or ✖ to deny it. They must deny it before they can receive another offer. 

# Screenshots

<img src="https://cdn.discordapp.com/attachments/593554477844529152/593833508619681809/unknown.png">

<img src="https://cdn.discordapp.com/attachments/593554477844529152/593836054075932685/Capture.PNG">

# Installation

To clone and run this bot, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/Gabolicious/MonopolyBot.git

# Install dependencies
$ npm install discord.js
$ npm install fs
```

Inside the repository create botconfig.json and it should look something like this:

```json
{
    "token": "YOUR-BOT-TOKEN",
    "prefixes": {}
}
```
Note: prefixes will be filled in for you when it joins a new guild.

# Credits
Close friends who made this possible.

|Profile   | Tag           | Role  |
| ------------- |:-------------:| -----:|
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593808300647251978/Capture.png" width="43"> | Gabo#1234 | Programmer |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593824646378553353/Capture.png" width="43">      | spoodermank#7336| Graphic Designer |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593814327153393664/Capture.png" width="43"> | Solid2Hours#0069| Creative Director |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593824317721280513/Capture.png" width="43"> | halleyman7#4111 | Creative Director #2 |

# License

MIT
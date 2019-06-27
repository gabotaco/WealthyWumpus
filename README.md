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

<div align="center"> <img src="https://i.imgur.com/3slzIe4.png" width="100%"> </div>

## Key Features

* Easily Custamizable
  - Add properties
  - Add Community Chest and Chance cards
* Object Oriented
* Flexible
* Easy to Play
    - Use message reactions instead of typing commands
* Light Weight

## Commands

Most of these are not necessary because of message reactions but if you prefer commands here is the list:

| Command | Description  |
|---------|--------------|
|*!help*  | **Get a list of all supported commands**|
|*!prefix [new prefix]*  | **Change the server prefix**|
|*!create*  | **Create a new game in the channel**|
|*!stop*  | **Ends the game in the channel**|
|*!join*  | **Join the game**|
|*!leave*  | **Leave the current game**|
|*!start*  | **Start the game**|
|*!leader [new leader]*  | **Change the game leader**|
|*!roll*  | **Roll the dice**|
|*!stats*  | **Get a info about yourself**|
|*!buy*  | **Buy the property you are currently on**|
|*!end*  | **End your turn**|
|*!bid [amount\|stop]*  | **Bid on property or back out**|
|*!house*  | **Buy a house**|
|*!sell [property]*  | **Sell a house on the property or the property to another player**|
|*!offer [confirm\|deny]*  | **Accept or deny an offer from another player**|
|*!mortgage [property]*  | **Mortgage a property**|
|*!unmortgage [property]*  | **Unmortgage a property**|
|*!property*  | **Get a list of all owned propertys and how many hosues are on it**|


## How to Play

The game follows all original Monopoly rules found [here](https://www.hasbro.com/common/instruct/monins.pdf). 

The only change made for this bot is that when the player goes bankrupt to the bank the property is not auctioned off, it is instead put back up on the 
market for anyone to buy when they land on it.

## Screenshots

<img src="https://cdn.discordapp.com/attachments/593554477844529152/593833508619681809/unknown.png">

<img src="https://cdn.discordapp.com/attachments/593554477844529152/593836054075932685/Capture.PNG">

## Installation

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

## Credits
Close friends who made this possible.

| Profile Pic   | Tag           | Role  |
| ------------- |:-------------:| -----:|
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593808300647251978/Capture.png" width="40"> | Gabo#1234 | Programmer |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593824646378553353/Capture.png" width="40">      | spoodermank#7336| Graphic Designer |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593814327153393664/Capture.png" width="40"> | Solid2Hours#0069| Idea Man |
| <img src="https://cdn.discordapp.com/attachments/593554477844529152/593824317721280513/Capture.png" width="40"> | halleyman7#4111 | Idean Man #2 |

## License

MIT
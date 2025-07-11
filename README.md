# Discord Guard Bot
Anythime bot sees someone is attacking the server, bot detects and prevents it.

![](https://i.imgur.com/GVK7ovh.png)
![](https://i.imgur.com/x4SmMC8.png)

# Guards for attack
- Ban limit (slashCommands/ban-limit.js): Each user has a certain number for ban someone. The number can be changed by the server owner. If a user exceeds the limit, the bot will ban the user except for the user that I told in [whitelisted user topic](#whitelisted-users)

- Kick limit (slashCommands/kick-limit.js): Works the same way as the ban limit, but it tracks the number of kicks instead.

- Bot guard (slashCommands/bot-koruma.js): The bot detects when a suspicious bot is added to the server. It will kick the bot and ban the user who added it — unless the user is whitelisted.

- Channel guard (slashCommands/kanal-koruma.js): The bot detects when someone deletes a channel, creates a channel or edits a channel name. It will restore the channel to its original state and ban the user who did it — unless the user is whitelisted.

- Role guard (slashCommands/rol-koruma.js): The bot detects when someone deletes a role, creates a role or edits a role name. It will restore the role to its original state and ban the user who did it — unless the user is whitelisted.

- Server settings guard (slashCommands/sunucu-koruma.js): The bot detects when someone changes the server name or changes the server icon. It will restore the settings that is done and ban the user who did it — unless the user is whitelisted.

- Profanity filter (slashCommands/küfür-engelleme.js): The bot detects when someone says some bad words on the message. You can change the bad words on bot.js 473th line (I found the turkish bad words on the internet, I didn't write all of it :D). The bot will delete the message — unless the user is whitelisted.

- Ads filter (slashCommands/reklam-engelleme.js): The bot detects when someone types a discord link. The bot will delete the message — unless the user is whitelisted.

- Other guards (slashCommands/diğer-korumalar.js)

  ∘ Spam guard: The bot detects when someone did spams. It will warn and then mute the user — unless the user is whitelisted. You can change the settings on bot.js 398th line.
  
  ∘ Mention spam guard: The bot detects when someone mentions lots of people in the same message. You can change the limit number of mentions on bot.js 553th line. It will ban the user — unless the user is whitelisted.

  ∘ @everyone Permission Protection: The bot detects when someone gives `ADMINISTRATOR`, `KICK_MEMBERS`, `BAN_MEMBERS` permissions to the @everyone. The bot will restore the settings to its original state and ban the user who did it.

# Whitelisted Users

- Whitelisted user (slashCommands/güvenli-kişi.js): You can specify certain users as whitelisted. The bot will ignore any actions or changes made by these users.
- Whitelisted role (slashCommands/güvenli-rol.js): You can specify a role is safe. The bot will ignore any actions or changes made by who has the role. (Note: you can determine just one role)

# Logs

- You can specify a log channels for all guards.

- Change the json keys on `ayarlar.json`

# Installation
Follow the steps below to set up the project:
1. Clone the repository
```
git clone https://github.com/Mali03/discord-guard-bot.git
cd discord-guard-bot
```

2. Install dependencies
Make sure you have [Node js](https://nodejs.org/) installed (recommended: v22.14.0 or higher for Discord.js v13).

Then install the required packages:
```
npm install
```

This will install the following dependencies:
- **`discord.js`** ^13.16.0

- **`@discordjs/rest`** ^1.7.1

- **`discord-api-types`** ^0.37.47

- **`discord-anti-spam`** ^2.8.1

- **`wio.db`** ^4.0.20

- **fs** (built-in module, no installation needed)

# Usage

Commands are on the slashCommands file. You can set the settings in the configuration file (ayarlar.json). If you don't understand what are the keys like `kanallog`, `rollog`, `botlog`, look at [Logs](#logs)

When you write the token and execute the bot.js file, the bot will wake up. Then, you can use the slash comamnds with using like `/ayarlar` command.

To execute the bot.js:
```
node bot.js
```


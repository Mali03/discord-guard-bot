# Discord Guard Bot
Anythime bot sees someone is attacking the server, bot detects and prevents it.

![](https://imgur.com/GVK7ovh)

# Guards for attack
- Ban limit (ban-limit.js): Each user has a certain number for ban someone. The number can be changed by the server owner. If a user exceeds the limit, the bot will ban the user except for the user that I told in [whitelisted user topic](#whitelisted-users)

- Kick limit (kick-limit.js): Works the same way as the ban limit, but it tracks the number of kicks instead.

- Bot guard (bot-koruma.js): The bot detects when a suspicious bot is added to the server. It will kick the bot and ban the user who added it — unless the user is whitelisted.

- Channel guard (kanal-koruma.js): The bot detects when someone deletes a channel, creates a channel or edits a channel name. It will restore the channel to its original state and ban the user who did it — unless the user is whitelisted.

- Role guard (rol-koruma.js): The bot detects when someone deletes a role, creates a role or edits a role name. It will restore the role to its original state and ban the user who did it — unless the user is whitelisted.

- Server settings guard (sunucu-koruma.js): The bot detects when someone changes the server name or changes the server icon. It will restore the settings that is done and ban the user who did it — unless the user is whitelisted.

- Profanity filter (küfür-engelleme.js): The bot detects when someone says some bad words on the message. You can change the bad words on bot.js 473th line (I found the turkish bad words on the internet, I didn't write all of it :D). The bot will delete the message — unless the user is whitelisted.

- Ads filter (reklam-engelleme.js): The bot detects when someone types a discord link. The bot will delete the message — unless the user is whitelisted.

- Other guards (diğer-korumalar.js)

  ∘ Spam guard: The bot detects when someone did spams. It will warn and then mute the user — unless the user is whitelisted. You can change the settings on bot.js 398th line.
  
  ∘ Mention spam guard: The bot detects when someone mentions lots of people in the same message. You can change the limit number of mentions on bot.js 553th line. It will ban the user — unless the user is whitelisted.

  ∘ @everyone Permission Protection: The bot detects when someone gives `ADMINISTRATOR`, `KICK_MEMBERS`, `BAN_MEMBERS` permissions to the @everyone. The bot will restore the settings to its original state and ban the user who did it.

# Whitelisted Users

emoji

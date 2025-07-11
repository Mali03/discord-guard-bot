const Discord = require('discord.js');
const client = global.client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: 200,
    }),
    fetchAllMembers: true,
    cacheEverything: true,
    intents: 98303,
    restRequestTimeout: 9999999,
    retryLimit: 1000
    // ws: { properties: { $browser: "Discord iOS" } }
});
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { prefix, token, kanallog, rollog, botlog, digerlog, kicklimitlog, banlimitlog, sunuculog } = require('./ayarlar.json');
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")
const AntiSpam = require("discord-anti-spam");
const cooldowns = new Map();
client.commands = new Discord.Collection();

// Event yükleyici
fs.readdir("./events", (err, files) => {
    if (err) return console.log(err);
    files.filter(file => file.endsWith(".js")).forEach(file => {
        let prop = require(`./events/${file}`);
        if (!prop.conf) return;
        client.on(prop.conf.name, prop);
    })
})
console.log(`\x1b[32m[📁] - events klasörü yüklendi!\x1b[0m`)

// Slash Komut Yükleyici
let commands = [];
fs.readdir("./slashCommands", (err, files) => {
    if (err) throw err;
    files.forEach(async (f) => {
        try {
            let props = require(`./slashCommands/${f}`);
            commands.push({
                name: props.name,
                description: props.description,
                options: props.options
            });
        } catch (err) {
            console.log(err);
        }
    });
});
console.log(`\x1b[31m[📁] - slashCommands klasörü yüklendi!\x1b[0m`)

const rest = new REST({ version: "9" }).setToken(token);
client.once("ready", () => {
    (async () => {
        try {
            await rest.put(Routes.applicationCommands(client.user.id), {
                body: await commands,
            });
        } catch { };
    })();
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    fs.readdir("./slashCommands", (err, files) => {
        if (err) throw err;
        files.forEach(async (f) => {
            let props = require(`./slashCommands/${f}`);
            if (interaction.commandName.toLowerCase() === props.name.toLowerCase()) {
                return props.execute(client, interaction);
            }
        });
    });
});

client.on('messageCreate', async message => {
    if ((message.channel.type == 'dm' || message.author.bot)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!message.content.startsWith(prefix) || !command) return;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const ts = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown) * 1000 || 0;

    if (ts.has(message.author.id)) {
        const lastTime = ts.get(message.author.id) + cooldownAmount;

        if (Date.now() < lastTime) {
            const time_left = (lastTime - Date.now()) / 1000;
            return message.channel.send(`⏱️ **${message.author.username}** komudu kullanabilmek için **${time_left.toFixed(1)}** saniye bekle.`).then(msg => msg.delete({ timeout: time_left.toFixed(0) * 1000 }));
        }
    }

    ts.set(message.author.id, Date.now());

    setTimeout(() => ts.delete(message.author.id), cooldownAmount);

    try {
        command.execute(client, message, args);
    } catch (e) {
        console.log(e);
    }
})

process.on('unhandledRejection', err => {
    console.log(err);
});
client.on("error", err => {
    console.log(err);
});

client.login(token);

// Kanal koruma
client.on('channelCreate', async channel => {
    if (db.has(`kanalk_${channel.guild.id}`)) {
        const entry = await channel.guild.fetchAuditLogs({ type: "CHANNEL_CREATE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await channel.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = channel.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${channel.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${channel.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${channel.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${channel.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(kanallog)
        await channel.delete()
        try {
            await channel.guild.members.ban(yapan.user.id, { reason: "Kanal oluşturma koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal oluşturuldu!')
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanalı oluşturan kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Oluşturulan kanal__: **#${channel.name}**\n\`•\` __Oluşturan kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı oluşturan kişi banlandı ve kanal silindi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await channel.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal oluşturuldu!')
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanalı oluşturan kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __Oluşturulan kanal__: **#${channel.name}**\n\`•\` __Oluşturan kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı oluşturan kişiyi banlamaya yetkim yetmedi ancak kanal silindi.\``)
            return log.send({ content: `<@${owner}> Kanal oluşturan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})
client.on("channelDelete", async channel => {
    if (db.has(`kanalk_${channel.guild.id}`)) {
        const entry = await channel.guild.fetchAuditLogs({ type: "CHANNEL_DELETE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await channel.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = channel.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${channel.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${channel.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${channel.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${channel.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(kanallog)
        await channel.clone().then(async cha => {
            let kanal = channel.guild.channels.cache.get(cha.id);
            await kanal.setParent(channel.parentId)
            await kanal.setPosition(channel.rawPosition)
        })
        try {
            await channel.guild.members.ban(yapan.user.id, { reason: "Kanal silme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal silindi!')
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanal silen kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Silinen kanal__: **#${channel.name}**\n\`•\` __Silen kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı silen kişi banlandı ve kanal aynı şekilde tekrar oluşturuldu.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await channel.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal silindi!')
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanal silen kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __Silinen kanal__: **#${channel.name}**\n\`•\` __Silen kullanıcı__: ${yapan}- (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı silen kişi banlanamadı ancak kanal aynı şekilde tekrar oluşturuldu.\``)
            log.send({ content: `<@${owner}> Kanalı silen kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})
client.on("channelUpdate", async (oldChannel, newChannel) => {
    if (db.has(`kanalk_${oldChannel.guild.id}`)) {
        if (oldChannel.name == newChannel.name) return;
        const entry = await oldChannel.guild.fetchAuditLogs({ type: "CHANNEL_UPDATE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await oldChannel.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = oldChannel.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${oldChannel.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${oldChannel.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${oldChannel.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${oldChannel.guild.id}`)  || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(kanallog)
        let yenisim = newChannel.name;
        await newChannel.setName(oldChannel.name)
        try {
            await oldChannel.guild.members.ban(yapan.user.id, { reason: "Kanal ismi değiştirme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal ismi değiştirildi!')
                .setThumbnail(oldChannel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanal ismi değiştiren kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __İsmi değiştirilen kanal__: **#${oldChannel.name}**\n\`•\` __Yeni isim__: **${yenisim}**\n\`•\` __İsim değiştiren kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı ismi değiştiren kişi banlandı ve kanal eski haline geri getirildi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await oldChannel.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir kanal ismi değiştirildi!')
                .setThumbnail(oldChannel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kanal ismi değiştiren kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __İsmi değiştirilen kanal__: **#${oldChannel.name}**\n\`•\` __Yeni isim__: **${yenisim}**\n\`•\` __İsim değiştiren kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Kanalı ismi değiştiren kişi banlanamadı ancak kanal eski haline geri getirildi.\``)
            log.send({ content: `<@${owner}> Kanalı ismi değiştiren kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})

// Rol koruma
client.on("roleDelete", async role => {
    if (db.has(`rolk_${role.guild.id}`)) {
        const entry = await role.guild.fetchAuditLogs({ type: "ROLE_DELETE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await role.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = role.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${role.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${role.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${role.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${role.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(rollog)
        await role.guild.roles.create(
            {
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions,
                mentionable: role.mentionable,
                position: role.rawPosition,
                icon: role.icon
            }
        )

        try {
            await role.guild.members.ban(yapan.user.id, { reason: "Rol silme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol silindi!')
                .setThumbnail(role.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rolü silen kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Silinen rol__: **${role.name}**\n\`•\` __Silen kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rolü silen kişi banlandı ve rol aynı şekilde yeniden oluşturuldu.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await role.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol silindi!')
                .setThumbnail(role.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rolü silen kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Silinen rol__: **${role.name}**\n\`•\` __Silen kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rolü silen kişi banlanamadı ancak rol aynı şekilde yeniden oluşturuldu.\``)
            log.send({ content: `<@${owner}> Rolü silen kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})
client.on("roleCreate", async role => {
    if (db.has(`rolk_${role.guild.id}`)) {
        const entry = await role.guild.fetchAuditLogs({ type: "ROLE_CREATE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await role.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = role.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${role.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${role.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${role.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${role.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(rollog)
        await role.delete()

        try {
            await role.guild.members.ban(yapan.user.id, { reason: "Rol oluşturma koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol oluşturuldu!')
                .setThumbnail(role.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rolü oluşturan kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Oluşturulan rol__: **${role.name}**\n\`•\` __Oluşturan kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rolü oluşturan kişi banlandı ve rol silindi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await role.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol oluşturuldu!')
                .setThumbnail(role.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rolü oluşturan kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Oluşturulan rol__: **${role.name}**\n\`•\` __Oluşturan kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rolü oluşturan kişi banlanamadı ancak rol silindi.\``)
            log.send({ content: `<@${owner}> Rolü silen kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})
client.on("roleUpdate", async (oldRole, newRole) => {
    if (db.has(`rolk_${oldRole.guild.id}`)) {
        if (oldRole.name == newRole.name) return;
        const entry = await oldRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await oldRole.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = oldRole.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${oldRole.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${oldRole.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${oldRole.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${oldRole.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(rollog)
        let yeniisim = newRole.name;
        await newRole.setName(oldRole.name)

        try {
            await role.guild.members.ban(yapan.user.id, { reason: "Rol ismi değiştirme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol ismi değiştirildi!')
                .setThumbnail(role.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rol ismi değiştiren kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __İsmi değiştirilen rol__: **${oldRole.name}**\n\`•\` __Yeni isim__: **${yeniisim}**\n\`•\` __İsim değiştiren kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rol ismi değiştiren kişi banlandı ve rol eski haline getirildi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await oldRole.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir rol ismi değiştirildi!')
                .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Rol ismi değiştiren kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __İsmi değiştirilen rol__: **${oldRole.name}**\n\`•\` __Yeni isim__: **${yeniisim}**\n\`•\` __İsim değiştiren kullanıcı__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Rol ismi değiştiren kişi banlanamadı ancak rol eski haline getirildi.\``)
            log.send({ content: `<@${owner}> Rol ismi değiştiren kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})

// Spam koruma
const antiSpam = new AntiSpam({
    warnThreshold: 4, // Amount of messages sent in a row that will cause a warning.
    muteTreshold: 8, // Amount of messages sent in a row that will cause a mute.
    warnMessage: `{@user} Spam yapmayı bırak yoksa susturulacaksın <a:unlem:909136740265099276>`, // Message sent in the channel when a user is warned.
    muteMessage: `{@user} Spam yapmaya devam ettiğin için 3 dakika susturuldun. <:tik:821005646299529236>`, // Message sent in the channel when a user is muted.
    unMuteTime: 3, // Time in minutes before the user will be able to send messages again.
    verbose: false, // Whether or not to log every action in the console.
    removeMessages: true, // Whether or not to remove all messages sent by the user.
});

client.on("messageCreate", (message) => {
    if (!message.guild || message.author.bot) return;
    if (message.member.permissions.has("ADMINISTRATOR")) return;
    if (!db.has(`digerk_${message.guild.id}`)) return;
    if (db.has(`guvenli_${message.guild.id}`)) {
        if (message.member.roles.cache.has(`${db.get(`guvenli_${message.guild.id}`)}`)) return;
    }
    if (db.has(`guvenliKisi_${message.guild.id}`)) {
        let arr = db.get(`guvenliKisi_${message.guild.id}`) || []
        if (arr.includes(message.author.id)) return;
    }
    antiSpam.message(message)
});

// * Reklam Engelleme * \\
client.on("messageCreate", async message => {
    if (!db.has(`reklamk_${message.guild.id}`)) return;
    if (db.has(`guvenli_${message.guild.id}`)) {
        if (message.member.roles.cache.has(`${db.get(`guvenli_${message.guild.id}`)}`)) return;
    }
    if (db.has(`guvenliKisi_${message.guild.id}`)) {
        let arr = db.get(`guvenliKisi_${message.guild.id}`) || []
        if (arr.includes(message.author.id)) return;
    }
    const reklam = ["discord.com", "discord.gg/", "https://", "http://", "www.", "discordapp.com"];
    if (reklam.some(word => message.content.includes(word))) {
        try {
            if (!message.member.permissions.has("ADMINISTRATOR")) {
                await message.delete();
                return await message.channel.send(`${message.member} Reklam engelleme aktif reklam yapma. <a:uyari:822437847495344128>`).then(msg => setTimeout(() => msg.delete(), 3000))
            }
        } catch (err) {
            return;
        }
    }
});
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!db.has(`reklamk_${oldMessage.guild.id}`)) return;
    if (newMessage.author.bot) return;
    if (oldMessage.content === newMessage) return;
    try {
        const reklamlar = ["discord.com", "discord.gg/", "https://", "http://", "www.", "discordapp.com"];
        if (!newMessage.member.permissions.has("ADMINISTRATOR")) {
            if (reklamlar.some(word => newMessage.content.toLowerCase().includes(word))) {
                if (db.has(`guvenli_${oldMessage.guild.id}`)) {
                    if (oldMessage.member.roles.cache.has(`${db.get(`guvenli_${oldMessage.guild.id}`)}`)) return;
                }
                if (db.has(`guvenliKisi_${oldMessage.guild.id}`)) {
                    let arr = db.get(`guvenliKisi_${oldMessage.guild.id}`) || []
                    if (arr.includes(oldMessage.author.id)) return;
                }
                await newMessage.delete()
                return await newMessage.channel.send(`${oldMessage.member} Reklam engelleme aktif reklam yapma. <a:uyari:822437847495344128>`).then(msg => setTimeout(() => msg.delete(), 3000))
            } else {
                return false;
            }
        }
    } catch (err) {
        return;
    }
});

// Küfür engelleme
client.on('messageCreate', async msg => {
    if (db.has(`kufurk_${msg.guild.id}`)) {
        let kufurler = ["allahoc", "allahoç", "allahamk", "allahaq", "0r0spuc0cu", "4n4n1 sk3r1m", "p1c", "@n@nı skrm", "evladi", "orsb", "orsbcogu", "amnskm", "anaskm", "oc", "abaza", "abazan", "ag", "a\u011fz\u0131na s\u0131\u00e7ay\u0131m", "fuck", "shit", "ahmak", "seks", "sex", "allahs\u0131z", "amar\u0131m", "ambiti", "am biti", "amc\u0131\u011f\u0131", "amc\u0131\u011f\u0131n", "amc\u0131\u011f\u0131n\u0131", "amc\u0131\u011f\u0131n\u0131z\u0131", "amc\u0131k", "amc\u0131k ho\u015faf\u0131", "amc\u0131klama", "amc\u0131kland\u0131", "amcik", "amck", "amckl", "amcklama", "amcklaryla", "amckta", "amcktan", "amcuk", "am\u0131k", "am\u0131na", "amına", "am\u0131nako", "am\u0131na koy", "am\u0131na koyar\u0131m", "am\u0131na koyay\u0131m", "am\u0131nakoyim", "am\u0131na koyyim", "am\u0131na s", "am\u0131na sikem", "am\u0131na sokam", "am\u0131n feryad\u0131", "am\u0131n\u0131", "am\u0131n\u0131 s", "am\u0131n oglu", "am\u0131no\u011flu", "am\u0131n o\u011flu", "am\u0131s\u0131na", "am\u0131s\u0131n\u0131", "amina", "amina g", "amina k", "aminako", "aminakoyarim", "amina koyarim", "amina koyay\u0131m", "amina koyayim", "aminakoyim", "aminda", "amindan", "amindayken", "amini", "aminiyarraaniskiim", "aminoglu", "amin oglu", "amiyum", "amk", "amkafa", "amk \u00e7ocu\u011fu", "amlarnzn", "aml\u0131", "amm", "ammak", "ammna", "amn", "amna", "amnda", "amndaki", "amngtn", "amnn", "amona", "amq", "ams\u0131z", "amsiz", "amsz", "amteri", "amugaa", "amu\u011fa", "amuna", "ana", "anaaann", "anal", "analarn", "anam", "anamla", "anan", "anana", "anandan", "anan\u0131", "anan\u0131", "anan\u0131n", "anan\u0131n am", "anan\u0131n am\u0131", "anan\u0131n d\u00f6l\u00fc", "anan\u0131nki", "anan\u0131sikerim", "anan\u0131 sikerim", "anan\u0131sikeyim", "anan\u0131 sikeyim", "anan\u0131z\u0131n", "anan\u0131z\u0131n am", "anani", "ananin", "ananisikerim", "anani sikerim", "ananisikeyim", "anani sikeyim", "anann", "ananz", "anas", "anas\u0131n\u0131", "anas\u0131n\u0131n am", "anas\u0131 orospu", "anasi", "anasinin", "anay", "anayin", "angut", "anneni", "annenin", "annesiz", "anuna", "aq", "a.q", "a.q.", "aq.", "ass", "atkafas\u0131", "atm\u0131k", "att\u0131rd\u0131\u011f\u0131m", "attrrm", "auzlu", "avrat", "ayklarmalrmsikerim", "azd\u0131m", "azd\u0131r", "azd\u0131r\u0131c\u0131", "babaannesi ka\u015far", "baban\u0131", "baban\u0131n", "babani", "babas\u0131 pezevenk", "baca\u011f\u0131na s\u0131\u00e7ay\u0131m", "bac\u0131na", "bac\u0131n\u0131", "bac\u0131n\u0131n", "bacini", "bacn", "bacndan", "bacy", "bastard", "b\u0131z\u0131r", "bitch", "biting", "boner", "bosalmak", "bo\u015falmak", "cenabet", "cibiliyetsiz", "cibilliyetini", "cibilliyetsiz", "cif", "cikar", "cim", "\u00e7\u00fck", "dalaks\u0131z", "dallama", "daltassak", "dalyarak", "dalyarrak", "dangalak", "dassagi", "diktim", "dildo", "dingil", "dingilini", "dinsiz", "dkerim", "domal", "domalan", "domald\u0131", "domald\u0131n", "domal\u0131k", "domal\u0131yor", "domalmak", "domalm\u0131\u015f", "domals\u0131n", "domalt", "domaltarak", "domalt\u0131p", "domalt\u0131r", "domalt\u0131r\u0131m", "domaltip", "domaltmak", "d\u00f6l\u00fc", "d\u00f6nek", "d\u00fcd\u00fck", "eben", "ebeni", "ebenin", "ebeninki", "ebleh", "ecdad\u0131n\u0131", "ecdadini", "embesil", "emi", "fahise", "fahi\u015fe", "feri\u015ftah", "ferre", "fuck", "fucker", "fuckin", "fucking", "gavad", "gavat", "giberim", "giberler", "gibis", "gibi\u015f", "gibmek", "gibtiler", "goddamn", "godo\u015f", "godumun", "gotelek", "gotlalesi", "gotlu", "gotten", "gotundeki", "gotunden", "gotune", "gotunu", "gotveren", "goyiim", "goyum", "goyuyim", "goyyim", "g\u00f6t", "g\u00f6t deli\u011fi", "g\u00f6telek", "g\u00f6t herif", "g\u00f6tlalesi", "g\u00f6tlek", "g\u00f6to\u011flan\u0131", "g\u00f6t o\u011flan\u0131", "g\u00f6to\u015f", "g\u00f6tten", "g\u00f6t\u00fc", "g\u00f6t\u00fcn", "g\u00f6t\u00fcne", "g\u00f6t\u00fcnekoyim", "g\u00f6t\u00fcne koyim", "g\u00f6t\u00fcn\u00fc", "g\u00f6tveren", "g\u00f6t veren", "g\u00f6t verir", "gtelek", "gtn", "gtnde", "gtnden", "gtne", "gtten", "gtveren", "hasiktir", "hassikome", "hassiktir", "has siktir", "hassittir", "haysiyetsiz", "hayvan herif", "ho\u015faf\u0131", "h\u00f6d\u00fck", "hsktr", "huur", "\u0131bnel\u0131k", "ibina", "ibine", "ibinenin", "ibne", "ibnedir", "ibneleri", "ibnelik", "ibnelri", "ibneni", "ibnenin", "ibnerator", "ibnesi", "idiot", "idiyot", "imansz", "ipne", "iserim", "i\u015ferim", "ito\u011flu it", "kafam girsin", "kafas\u0131z", "kafasiz", "kahpe", "kahpenin", "kahpenin feryad\u0131", "kaka", "kaltak", "kanc\u0131k", "kancik", "kappe", "karhane", "ka\u015far", "kavat", "kavatn", "kaypak", "kayyum", "kerane", "kerhane", "kerhanelerde", "kevase", "keva\u015fe", "kevvase", "koca g\u00f6t", "kodu\u011fmun", "kodu\u011fmunun", "kodumun", "kodumunun", "koduumun", "koyarm", "koyay\u0131m", "koyiim", "koyiiym", "koyim", "koyum", "koyyim", "krar", "kukudaym", "laciye boyad\u0131m", "libo\u015f", "madafaka", "malafat", "malak", "mcik", "meme", "memelerini", "mezveleli", "minaamc\u0131k", "mincikliyim", "mna", "monakkoluyum", "motherfucker", "mudik", "oc", "ocuu", "ocuun", "O\u00c7", "o\u00e7", "o. \u00e7ocu\u011fu", "o\u011flan", "o\u011flanc\u0131", "o\u011flu it", "orosbucocuu", "orospu", "orospucocugu", "orospu cocugu", "orospu \u00e7oc", "orospu\u00e7ocu\u011fu", "orospu \u00e7ocu\u011fu", "orospu \u00e7ocu\u011fudur", "orospu \u00e7ocuklar\u0131", "orospudur", "orospular", "orospunun", "orospunun evlad\u0131", "orospuydu", "orospuyuz", "orostoban", "orostopol", "orrospu", "oruspu", "oruspu\u00e7ocu\u011fu", "oruspu \u00e7ocu\u011fu", "osbir", "ossurduum", "ossurmak", "ossuruk", "osur", "osurduu", "osuruk", "osururum", "otuzbir", "\u00f6k\u00fcz", "\u00f6\u015fex", "patlak zar", "penis", "pezevek", "pezeven", "pezeveng", "pezevengi", "pezevengin evlad\u0131", "pezevenk", "pezo", "pic", "pici", "picler", "pi\u00e7", "pi\u00e7in o\u011flu", "pi\u00e7 kurusu", "pi\u00e7ler", "pipi", "pipi\u015f", "pisliktir", "porno", "pussy", "pu\u015ft", "pu\u015fttur", "rahminde", "revizyonist", "s1kerim", "s1kerm", "s1krm", "sakso", "saksofon", "saxo", "sekis", "serefsiz", "sevgi koyar\u0131m", "sevi\u015felim", "sexs", "s\u0131\u00e7ar\u0131m", "s\u0131\u00e7t\u0131\u011f\u0131m", "s\u0131ecem", "sicarsin", "sie", "sik", "sikdi", "sikdi\u011fim", "sike", "sikecem", "sikem", "siken", "sikenin", "siker", "sikerim", "sikerler", "sikersin", "sikertir", "sikertmek", "sikesen", "sikesicenin", "sikey", "sikeydim", "sikeyim", "sikeym", "siki", "sikicem", "sikici", "sikien", "sikienler", "sikiiim", "sikiiimmm", "sikiim", "sikiir", "sikiirken", "sikik", "sikil", "sikildiini", "sikilesice", "sikilmi", "sikilmie", "sikilmis", "sikilmi\u015f", "sikilsin", "sikim", "sikimde", "sikimden", "sikime", "sikimi", "sikimiin", "sikimin", "sikimle", "sikimsonik", "sikimtrak", "sikin", "sikinde", "sikinden", "sikine", "sikini", "sikip", "sikis", "sikisek", "sikisen", "sikish", "sikismis", "siki\u015f", "siki\u015fen", "siki\u015fme", "sikitiin", "sikiyim", "sikiym", "sikiyorum", "sikkim", "sikko", "sikleri", "sikleriii", "sikli", "sikm", "sikmek", "sikmem", "sikmiler", "sikmisligim", "siksem", "sikseydin", "sikseyidin", "siksin", "siksinbaya", "siksinler", "siksiz", "siksok", "siksz", "sikt", "sikti", "siktigimin", "siktigiminin", "sikti\u011fim", "sikti\u011fimin", "sikti\u011fiminin", "siktii", "siktiim", "siktiimin", "siktiiminin", "siktiler", "siktim", "siktim", "siktimin", "siktiminin", "siktir", "siktir et", "siktirgit", "siktir git", "siktirir", "siktiririm", "siktiriyor", "siktir lan", "siktirolgit", "siktir ol git", "sittimin", "sittir", "skcem", "skecem", "skem", "sker", "skerim", "skerm", "skeyim", "skiim", "skik", "skim", "skime", "skmek", "sksin", "sksn", "sksz", "sktiimin", "sktrr", "skyim", "slaleni", "sokam", "sokar\u0131m", "sokarim", "sokarm", "sokarmkoduumun", "sokay\u0131m", "sokaym", "sokiim", "soktu\u011fumunun", "sokuk", "sokum", "soku\u015f", "sokuyum", "soxum", "sulaleni", "s\u00fclaleni", "s\u00fclalenizi", "s\u00fcrt\u00fck", "\u015ferefsiz", "\u015f\u0131ll\u0131k", "taaklarn", "taaklarna", "tarrakimin", "tasak", "tassak", "ta\u015fak", "ta\u015f\u015fak", "tipini s.k", "tipinizi s.keyim", "tiyniyat", "toplarm", "topsun", "toto\u015f", "vajina", "vajinan\u0131", "veled", "veledizina", "veled i zina", "verdiimin", "weled", "weledizina", "whore", "xikeyim", "yaaraaa", "yalama", "yalar\u0131m", "yalarun", "yaraaam", "yarak", "yaraks\u0131z", "yaraktr", "yaram", "yaraminbasi", "yaramn", "yararmorospunun", "yarra", "yarraaaa", "yarraak", "yarraam", "yarraam\u0131", "yarragi", "yarragimi", "yarragina", "yarragindan", "yarragm", "yarra\u011f", "yarra\u011f\u0131m", "yarra\u011f\u0131m\u0131", "yarraimin", "yarrak", "yarram", "yarramin", "yarraminba\u015f\u0131", "yarramn", "yarran", "yarrana", "yarrrak", "yavak", "yav\u015f", "yav\u015fak", "yav\u015fakt\u0131r", "yavu\u015fak", "y\u0131l\u0131\u015f\u0131k", "yilisik", "yogurtlayam", "yo\u011furtlayam", "yrrak", "z\u0131kk\u0131m\u0131m", "zibidi", "zigsin", "zikeyim", "zikiiim", "zikiim", "zikik", "zikim", "ziksiiin", "ziksiin", "zulliyetini", "zviyetini"];
        let kelimeler = msg.content.split(' ');
        if (msg.member.permissions.has("ADMINISTRATOR")) return;
        if (db.has(`guvenli_${msg.guild.id}`)) {
            if (msg.member.roles.cache.has(`${db.get(`guvenli_${msg.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${msg.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${msg.guild.id}`) || []
            if (arr.includes(msg.author.id)) return;
        }
        kelimeler.forEach(async kelime => {
            if (kufurler.some(küfür => küfür === kelime)) {
                try {
                    await msg.delete();
                    return await msg.channel.send(`${msg.member} Küfür engelleme aktif küfür etme. <a:uyari:822437847495344128>`).then(msg => setTimeout(() => msg.delete(), 3000))
                } catch (err) {
                    console.log(err);
                }
            }
        })
    }
})

// Bot koruma
client.on("guildMemberAdd", async member => {
    if (db.has(`botk_${member.guild.id}`)) {
        if (!member.user.bot) return;
        const entry = await member.guild.fetchAuditLogs({ type: "BOT_ADD" }).then(audit => audit.entries.first());

        if (entry.executor.id == client.user.id) return;
        if (entry.executor.id == await member.guild.fetchOwner().then(s => s.user.id)) return;
        let yapan = member.guild.members.cache.get(entry.executor.id)
        if (db.has(`guvenli_${member.guild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${member.guild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${member.guild.id}`)) {
            let arr = db.get(`guvenliKisi_${member.guild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        let log = client.channels.cache.get(botlog)
        await member.kick(member)

        try {
            await member.guild.members.ban(yapan.user.id, { reason: "Bot ekleme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir bot eklendi!')
                .setFooter({ text: `Botu ekleyen kişi banlandı` })
                .setTimestamp()
                .setThumbnail(member.guild.iconURL({ dynamic: true }))
                .setDescription(`\`•\` __Eklenen bot__: ${member} (**${member.user.tag}** - \`${member.user.id}\`)\n\`•\` __Ekleyen kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Botu ekleyen kişi banlandı ve bot atıldı.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await member.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Bir bot eklendi!')
                .setFooter({ text: `Botu ekleyen kişi banlandı` })
                .setTimestamp()
                .setThumbnail(member.guild.iconURL({ dynamic: true }))
                .setDescription(`\`•\` __Eklenen bot__: ${member} (**${member.user.tag}** - \`${member.user.id}\`)\n\`•\` __Ekleyen kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Botu ekleyen kişi banlandı ve bot atıldı.\``)
            log.send({ content: `<@${owner}> Bot ekleyen kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})

// Etiket spam koruması
client.on("messageCreate", async msg => {
    if (!db.has(`digerk_${msg.guild.id}`)) return;
    if (msg.channel.type === "dm") return;
    if (msg.author.bot) return;
    if (msg.member.permissions.has("ADMINISTRATOR")) return;
    if (db.has(`guvenli_${msg.guild.id}`)) {
        if (msg.member.roles.cache.has(`${db.get(`guvenli_${msg.guild.id}`)}`)) return;
    }
    if (db.has(`guvenliKisi_${msg.guild.id}`)) {
        let arr = db.get(`guvenliKisi_${msg.guild.id}`) || []
        if (arr.includes(msg.author.id)) return;
    }
    if (msg.mentions.users.size >= 7) {
        await msg.delete()
        msg.channel.send(`${msg.author}` + ` (**${msg.author.id}**) ` + `\`Toplu etiket attığı için sunucudan yasaklandı.\` <a:uyari:822437847495344128>`)
        setTimeout(async function () {
            await msg.guild.members.ban(msg.author.id)
        }, 1000);
    }
})

// Ban limit
client.on("guildBanAdd", async veri => {
    if (!db.has(`banlimit_${veri.guild.id}`)) return
    const entry = await veri.guild.fetchAuditLogs({ type: "MEMBER_BAN_ADD" }).then(audit => audit.entries.first());
    let yapan = veri.guild.members.cache.get(entry.executor.id)

    if (yapan.user.id == await veri.guild.fetchOwner().then(s => s.user.id)) return;
    if (yapan.user.id == client.user.id) return;
    if (db.has(`guvenli_${veri.guild.id}`)) {
        if (yapan.roles.cache.has(`${db.get(`guvenli_${veri.guild.id}`)}`)) return;
    }
    if (db.has(`guvenliKisi_${veri.guild.id}`)) {
        let arr = db.get(`guvenliKisi_${veri.guild.id}`) || []
        if (arr.includes(yapan.user.id)) return;
    }

    await db.add(`ban_${yapan.user.id}`, 1)
    let log = client.channels.cache.get(banlimitlog)
    let fetch = db.get(`ban_${yapan.user.id}`)

    if (fetch >= db.get(`banlimit_${veri.guild.id}`)) {
        try {
            await veri.guild.members.ban(yapan.user.id, { reason: "Ban limiti aştı." })
            const embed = new Discord.MessageEmbed()
                .setColor('#ff1f44')
                .setTitle('Ban limiti aşıldı!')
                .setThumbnail(veri.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Ban limiti aşan kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Ban limiti aşan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Son banladığı kişi__: <@${veri.user.id}> (**${veri.user.username}#${veri.user.discriminator}** - \`${veri.user.id}\`)\n• Ban limit: \`${db.get(`banlimit_${veri.guild.id}`)}\`\n\n<a:uyari:822437847495344128> \`Ban limiti aşan kişi banlandı.\``)
            log.send({ embeds: [embed] })
            if (db.has(`ban_${yapan.user.id}`)) db.delete(`ban_${yapan.user.id}`)
        } catch {
            let owner = await veri.guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor('#ff1f44')
                .setTitle('Ban limiti aşıldı!')
                .setThumbnail(veri.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Ban limiti aşan kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __Ban limiti aşan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Son banladığı kişi__: <@${veri.user.id}> (**${veri.user.username}#${veri.user.discriminator}** - \`${veri.user.id}\`)\n• Ban limit: \`${db.get(`banlimit_${veri.guild.id}`)}\`\n\n<a:uyari:822437847495344128> \`Ban limiti aşan kişi banlanamadı.\``)
            log.send({ content: `<@${owner}> Ban limiti aşan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
            if (db.has(`ban_${yapan.user.id}`)) db.delete(`ban_${yapan.user.id}`)
        }
    }
})

// Kick limit
client.on("guildMemberRemove", async user => {
    let guild = user.guild;
    if (!db.has(`kicklimit_${guild.id}`)) return
    const entry = await guild.fetchAuditLogs({ type: "MEMBER_KICK" }).then(audit => audit.entries.first());
    let yapan = guild.members.cache.get(entry.executor.id)
    if (Date.now() - entry.createdTimestamp > 5000) return;

    if (yapan.user.id == await user.guild.fetchOwner().then(s => s.user.id)) return;
    if (yapan.user.id == client.user.id) return;
    if (db.has(`guvenli_${guild.id}`)) {
        if (yapan.roles.cache.has(`${db.get(`guvenli_${guild.id}`)}`)) return;
    }
    if (db.has(`guvenliKisi_${guild.id}`)) {
        let arr = db.get(`guvenliKisi_${guild.id}`) || []
        if (arr.includes(yapan.user.id)) return;
    }

    await db.add(`kick_${yapan.user.id}`, 1)
    let log = client.channels.cache.get(kicklimitlog)

    let fetch = db.get(`kick_${yapan.user.id}`)
    if (fetch >= db.get(`kicklimit_${guild.id}`)) {
        try {
            await guild.members.ban(yapan.user.id, { reason: "Kick limiti aştı." })
            const embed = new Discord.MessageEmbed()
                .setColor('#ff1f44')
                .setTitle('Kick limit aşıldı!')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kick limiti aşan kişi banlandı` })
                .setTimestamp()
                .setDescription(`\`•\` __Kick limiti aşan kişi__: ${yapan.user.tag} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Son kicklediği kişi__: <@${user.user.id}> (**${user.user.tag}** - \`${user.id}\`)\n\`•\` __Kick limit__: \`${db.get(`kicklimit_${guild.id}`)}\`\n\n<a:uyari:822437847495344128> \`Kick limiti aşan kişi banlandı.\``)
            log.send({ embeds: [embed] })
            if (db.has(`kick_${yapan.user.id}`)) db.delete(`kick_${yapan.user.id}`)
        } catch {
            let owner = await guild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor('#ff1f44')
                .setTitle('Kick limit aşıldı!')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Kick limiti aşan kişi banlanamadı` })
                .setTimestamp()
                .setDescription(`\`•\` __Kick limiti aşan kişi__: ${yapan.user.tag} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Son kicklediği kişi__: <@${user.user.id}> (**${user.user.tag}** - \`${user.id}\`)\n\`•\` __Kick limit__: \`${db.get(`kicklimit_${guild.id}`)}\`\n\n<a:uyari:822437847495344128> \`Kick limiti aşan kişi banlanamadı.\``)
            log.send({ content: `<@${owner}> Kick limiti aşan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
            if (db.has(`kick_${yapan.user.id}`)) db.delete(`kick_${yapan.user.id}`)
        }
    }
})

// Sunucu koruma
client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (!db.has(`sunucuk_${oldGuild.id}`)) return;
    if (oldGuild.name !== newGuild.name) {
        const entry = await oldGuild.fetchAuditLogs({ type: "GUILD_UPDATE" }).then(audit => audit.entries.first());
        let yapan = oldGuild.members.cache.get(entry.executor.id)

        if (yapan.user.id == client.user.id) return;
        if (yapan.user.id == await oldGuild.fetchOwner().then(s => s.user.id)) return;
        if (db.has(`guvenli_${oldGuild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${oldGuild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${oldGuild.id}`)) {
            let arr = db.get(`guvenliKisi_${oldGuild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        await newGuild.setName(oldGuild.name)
        const log = client.channels.cache.get(sunuculog)

        try {
            await oldGuild.members.ban(yapan.user.id, { reason: "Sunucu ayarlarını değiştirme koruması aktif." })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Sunucu ayarları değiştirildi!')
                .setThumbnail(oldGuild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Sunucu ayarlarını değiştiren kişi banlandı' })
                .setDescription(`\`•\` __Gerçekleştirilen eylem__: **Sunucu ismi değiştirme**\n\`•\` __Yapan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Sunucu ayarlarını değiştiren kişi banlandı ve sunucu ayarları eski hale getirildi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await oldGuild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Sunucu ayarları değiştirildi!')
                .setThumbnail(oldGuild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Sunucu ayarlarını değiştiren kişi banlanamadı' })
                .setDescription(`\`•\` __Gerçekleştirilen eylem__: **Sunucu ismi değiştirme**\n\`•\` __Yapan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n<a:uyari:822437847495344128> \`Sunucu ayarlarını değiştiren kişi banlanamadı ancak sunucu ayarları eski hale getirildi.\``)
            log.send({ content: `<@${owner}> Sunucu ayarlarını değiştiren kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})
client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (!db.has(`sunucuk_${oldGuild.id}`)) return;
    if (oldGuild.iconURL({ dynamic: true }) !== newGuild.iconURL({ dynamic: true })) {
        const entry = await oldGuild.fetchAuditLogs({ type: "GUILD_UPDATE" }).then(audit => audit.entries.first());
        let yapan = oldGuild.members.cache.get(entry.executor.id)

        if (yapan.user.id == client.user.id) return;
        if (yapan.user.id == await oldGuild.fetchOwner().then(s => s.user.id)) return;
        if (db.has(`guvenli_${oldGuild.id}`)) {
            if (yapan.roles.cache.has(`${db.get(`guvenli_${oldGuild.id}`)}`)) return;
        }
        if (db.has(`guvenliKisi_${oldGuild.id}`)) {
            let arr = db.get(`guvenliKisi_${oldGuild.id}`) || []
            if (arr.includes(yapan.user.id)) return;
        }

        const log = client.channels.cache.get(sunuculog)
        await newGuild.setIcon(oldGuild.iconURL({ dynamic: true }))
        try {
            await oldGuild.members.ban(yapan.user.id, { reason: "Sunucu ayarlarını değiştirme" })
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Sunucu ayarları değiştirildi!')
                .setThumbnail(oldGuild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Sunucu ayarlarını değiştiren kişi banlandı' })
                .setDescription(`\`•\` __Gerçekleştirilen eylem__: **Sunucu avatarını değiştirme**\n\`•\` __Yapan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Sunucu ayarlarını değiştiren kişi banlandı ve sunucu ayarları eski hale getirildi.\``)
            log.send({ embeds: [embed] })
        } catch {
            let owner = await oldGuild.fetchOwner().then(s => s.user.id)
            const embed = new Discord.MessageEmbed()
                .setColor("#ff1f44")
                .setTitle('Sunucu ayarları değiştirildi!')
                .setThumbnail(oldGuild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Sunucu ayarlarını değiştiren kişi banlandı' })
                .setDescription(`\`•\` __Gerçekleştirilen eylem__: **Sunucu avatarını değiştirme**\n\`•\` __Yapan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\n<a:uyari:822437847495344128> \`Sunucu ayarlarını değiştiren kişi banlandı ve sunucu ayarları eski hale getirildi.\``)
            log.send({ content: `<@${owner}> Sunucu ayarlarını değiştiren kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
        }
    }
})

// * Everyone Yetki Verme Engel * \\
client.on('roleUpdate', async (oldRole, newRole) => {
    let log = client.channels.cache.get(digerlog)
    if (!db.has(`digerk_${message.guild.id}`)) return;
    if (oldRole.permissions == newRole.permissions) return;
    if (newRole.name == '@everyone') {
        if (newRole.permissions.has("ADMINISTRATOR")) {
            const entry = await oldRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(audit => audit.entries.first());
            const yapan = oldRole.guild.members.cache.get(entry.executor.id)

            if (yapan.user.id == client.user.id) return;
            if (yapan.user.id == await oldRole.guild.fetchOwner().then(s => s.user.id)) return;
            if (db.has(`guvenli_${oldRole.guild.id}`)) {
                if (yapan.roles.cache.has(`${db.get(`guvenli_${oldRole.guild.id}`)}`)) return;
            }
            if (db.has(`guvenliKisi_${oldRole.guild.id}`)) {
                let arr = db.get(`guvenliKisi_${oldRole.guild.id}`) || []
                if (arr.includes(yapan.user.id)) return;
            }

            const ever = oldRole.guild.roles.everyone
            await ever.setPermissions(['SEND_MESSAGES', 'VIEW_CHANNEL', 'ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY']);

            try {
                await oldRole.guild.members.ban(yapan.user.id, { reason: "Everyone için yetki açma koruması aktif." })
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için yönetici yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlandı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Yönetici**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlandı ve yetki kapatıldı.\``)
                log.send({ embeds: [embed] })
            } catch {
                let owner = await oldRole.guild.fetchOwner().then(s => s.user.id)
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için yönetici yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlanamadı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Yönetici**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlanamadı ancak yetki kapatıldı.\``)
                log.send({ content: `<@${owner}> Everyone için yetki açan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
            }
        }
    }
})
client.on('roleUpdate', async (oldRole, newRole) => {
    let log = client.channels.cache.get(digerlog)
    if (!db.has(`digerk_${message.guild.id}`)) return;
    if (oldRole.permissions == newRole.permissions) return;
    if (newRole.name == '@everyone') {
        if (newRole.permissions.has("BAN_MEMBERS")) {
            const entry = await oldRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(audit => audit.entries.first());
            const yapan = oldRole.guild.members.cache.get(entry.executor.id)

            if (yapan.user.id == client.user.id) return;
            if (yapan.user.id == await oldRole.guild.fetchOwner().then(s => s.user.id)) return;
            if (db.has(`guvenli_${oldRole.guild.id}`)) {
                if (yapan.roles.cache.has(`${db.get(`guvenli_${oldRole.guild.id}`)}`)) return;
            }
            if (db.has(`guvenliKisi_${oldRole.guild.id}`)) {
                let arr = db.get(`guvenliKisi_${oldRole.guild.id}`) || []
                if (arr.includes(yapan.user.id)) return;
            }

            const ever = oldRole.guild.roles.everyone
            await ever.setPermissions(['SEND_MESSAGES', 'VIEW_CHANNEL', 'ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY']);

            try {
                await oldRole.guild.members.ban(yapan.user.id, { reason: "Everyone için yetki açma koruması aktif." })
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için ban yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlandı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Üyeleri Engelle**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlandı ve yetki kapatıldı.\``)
                log.send({ embeds: [embed] })
            } catch {
                let owner = await oldRole.guild.fetchOwner().then(s => s.user.id)
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için ban yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlanamadı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Üyeleri Engelle**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlanamadı ancak yetki kapatıldı.\``)
                log.send({ content: `<@${owner}> Everyone için yetki açan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
            }
        }
    }
})
client.on('roleUpdate', async (oldRole, newRole) => {
    let log = client.channels.cache.get(digerlog)
    if (!db.has(`digerk_${message.guild.id}`)) return;
    if (oldRole.permissions == newRole.permissions) return;
    if (newRole.name == '@everyone') {
        if (newRole.permissions.has("KICK_MEMBERS")) {
            const entry = await oldRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(audit => audit.entries.first());
            const yapan = oldRole.guild.members.cache.get(entry.executor.id)

            if (yapan.user.id == client.user.id) return;
            if (yapan.user.id == await oldRole.guild.fetchOwner().then(s => s.user.id)) return;
            if (db.has(`guvenli_${oldRole.guild.id}`)) {
                if (yapan.roles.cache.has(`${db.get(`guvenli_${oldRole.guild.id}`)}`)) return;
            }
            if (db.has(`guvenliKisi_${oldRole.guild.id}`)) {
                let arr = db.get(`guvenliKisi_${oldRole.guild.id}`) || []
                if (arr.includes(yapan.user.id)) return;
            }

            const ever = oldRole.guild.roles.everyone
            await ever.setPermissions(['SEND_MESSAGES', 'VIEW_CHANNEL', 'ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY']);

            try {
                await oldRole.guild.members.ban(yapan.user.id, { reason: "Everyone için yetki açma koruması aktif." })
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için kick yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlandı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Üyeleri At**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlandı ve yetki kapatıldı.\``)
                log.send({ embeds: [embed] })
            } catch {
                let owner = await oldRole.guild.fetchOwner().then(s => s.user.id)
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1f44")
                    .setTitle('Everyone için kick yetkisi açıldı!')
                    .setFooter({ text: `Yetkiyi açan kişi banlanamadı` })
                    .setTimestamp()
                    .setThumbnail(oldRole.guild.iconURL({ dynamic: true }))
                    .setDescription(`\`•\` __Yetkiyi açan kişi__: ${yapan} (**${yapan.user.tag}** - \`${yapan.user.id}\`)\n\`•\` __Açılan yetki__: **Üyeleri At**\n\n<a:uyari:822437847495344128> \`Yapan kişi banlanamadı ancak yetki kapatıldı.\``)
                log.send({ content: `<@${owner}> Everyone için yetki açan kişiyi banlamaya yetkim yetmedi <a:unlem:909136740265099276>`, embeds: [embed] })
            }
        }
    }
})
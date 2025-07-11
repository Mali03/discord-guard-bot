const Discord = require('discord.js')
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")

module.exports = {
    name: "ayarlar",
    description: "Yapılan ayarları gösterir.",
    options: [], // https://github.com/clqu/discord.js-v13-slash-bot#for-developers
    execute: async (client, interaction) => {
        if (interaction.member.user.id !== await interaction.guild.fetchOwner().then(s => s.user.id)) return interaction.reply({ content: `<:kapali:1130088303421567016> Sunucu ayarlarını sadece sunucu sahibi görebilir.`, ephemeral: true })

        if (db.has(`banlimit_${interaction.guild.id}`)) banlimit = `<:acik:1130088206285688882> Açık (Limit: \`${db.get(`banlimit_${interaction.guild.id}`)}\`)`; else banlimit = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`kicklimit_${interaction.guild.id}`)) kicklimit = `<:acik:1130088206285688882> Açık (Limit: \`${db.get(`kicklimit_${interaction.guild.id}`)}\`)`; else kicklimit = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`botk_${interaction.guild.id}`)) botkoruma = `<:acik:1130088206285688882> Açık`; else botkoruma = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`kanalk_${interaction.guild.id}`)) kanalkoruma = `<:acik:1130088206285688882> Açık`; else kanalkoruma = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`rolk_${interaction.guild.id}`)) rolkoruma = `<:acik:1130088206285688882> Açık`; else rolkoruma = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`sunucuk_${interaction.guild.id}`)) sunucukoruma = `<:acik:1130088206285688882> Açık`; else sunucukoruma = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`kufurk_${interaction.guild.id}`)) kufurengelleme = `<:acik:1130088206285688882> Açık`; else kufurengelleme = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`reklamk_${interaction.guild.id}`)) reklamengelleme = `<:acik:1130088206285688882> Açık`; else reklamengelleme = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`digerk_${interaction.guild.id}`)) digerkorumalar = `<:acik:1130088206285688882> Açık`; else digerkorumalar = `<:kapali:1130088303421567016> Kapalı`;
        if (db.has(`guvenli_${interaction.guild.id}`)) guvenlirol = `**${interaction.guild.roles.cache.get(db.get(`guvenli_${interaction.guild.id}`)).name}**`; else guvenlirol = `<:kapali:1130088303421567016> **Aktif değil**`;
        let arr = db.get(`guvenliKisi_${interaction.guild.id}`) || []
        const embed = new Discord.MessageEmbed()
            .setColor("#b0ccc4")
            .setAuthor({ name: 'Tüm Koruma Ayarları', iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()
            .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
            .addFields([
                {
                    name: "Ban Limit",
                    value: banlimit,
                    inline: true
                },
                {
                    name: "Kick Limit",
                    value: kicklimit,
                    inline: true
                },
                {
                    name: "Bot Koruma",
                    value: botkoruma,
                    inline: true
                },
                {
                    name: "Kanal Koruma",
                    value: kanalkoruma,
                    inline: true
                },
                {
                    name: "Rol Koruma",
                    value: rolkoruma,
                    inline: true
                },
                {
                    name: "Sunucu Ayarları Koruma",
                    value: sunucukoruma,
                    inline: true
                },
                {
                    name: "Küfür Engelleme",
                    value: kufurengelleme,
                    inline: true
                },
                {
                    name: "Reklam Engelleme",
                    value: reklamengelleme,
                    inline: true
                },
                {
                    name: "Diğer Korumalar",
                    value: digerkorumalar,
                    inline: true
                },

            ])
            .setDescription(`\`□\` __Güvenli rol__: ${guvenlirol}\n\`□\` __Güvenli kişiler__: ${arr.length == 0 ? "<:kapali:1130088303421567016> **Aktif değil**" : arr.map(a => `**${interaction.guild.members.cache.get(a)?.user.tag || `Bilinmiyor (\`${a}\`)`}**`).join(" • ")}`)
        interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
    },
};
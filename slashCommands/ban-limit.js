const Discord = require('discord.js')
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")

module.exports = {
    name: "ban-limit",
    description: "Ban limiti koymanızı sağlar.",
    options: [
        { type: 10, name: 'sayı', description: 'Ban limit sayısını belirtin. Kapatmak için "0" yazın', required: true },
    ], // https://github.com/clqu/discord.js-v13-slash-bot#for-developers
    execute: async (client, interaction) => {
        if (interaction.member.user.id !== await interaction.guild.fetchOwner().then(s => s.user.id)) return interaction.reply({ content: `<:carpi:821005698564489237> Bu komut sunucu sahibine özeldir.`, ephemeral: true })
        let sayı = interaction?.options?._hoistedOptions[0].value
        if (sayı < 0) sayı = - sayı
        if (sayı >= 20) sayı = 20

        if (sayı == "0") {
            if (db.has(`banlimit_${interaction.guild.id}`)) {
                await db.delete(`banlimit_${interaction.guild.id}`)
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1818")
                    .setAuthor({ name: "Ban Limit", iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`<:tik:821005646299529236> **Ban Limit** sistemi başarıyla \`kapatıldı.\``)
                    .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp()
                return interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
            } else {
                await interaction.reply({ content: `<:carpi:821005698564489237> Ban limit sistemi açık değil.`, ephemeral: true })
            }
        } else {
            await db.set(`banlimit_${interaction.guild.id}`, sayı)
            const embed = new Discord.MessageEmbed()
                .setColor("#48d65d")
                .setAuthor({ name: "Bot Koruma", iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(`<:tik:821005646299529236> **Ban limit** sistemi başarıyla \`aktif\` edildi. **Ban limit** \`${sayı}\` olarak ayarlandı.`)
                .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp()
            return interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
        }
    },
};
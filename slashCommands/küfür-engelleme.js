const Discord = require('discord.js')
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")

module.exports = {
    name: "küfür-engelleme",
    description: "Küfür engelleme sistemini ayarlarsınız.",
    options: [
        {
            type: 3,
            name: "eylem",
            description: "Bir eylem seçin.",
            required: true,
            choices: [
                { name: "aç", value: "aç" },
                { name: "kapat", value: "kapat" },
            ]
        }
    ], // https://github.com/clqu/discord.js-v13-slash-bot#for-developers
    execute: async (client, interaction) => {
        if (interaction.member.user.id !== await interaction.guild.fetchOwner().then(s => s.user.id)) return interaction.reply({ content: `<:carpi:821005698564489237> Bu komut sunucu sahibine özeldir.`, ephemeral: true })
        let seçenek = interaction?.options?.getString("eylem");
        if (seçenek == "aç") {
            if (!db.has(`kufurk_${interaction.guild.id}`)) {
                await db.set(`kufurk_${interaction.guild.id}`, "Aktif")
                const embed = new Discord.MessageEmbed()
                    .setColor("#48d65d")
                    .setAuthor({ name: "Küfür engelleme", iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`<:tik:821005646299529236> **Küfür engelleme** sistemi başarıyla \`aktif\` edildi.`)
                    .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp()
                return interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
            } else {
                return interaction.reply({ content: `<:carpi:821005698564489237> Küfür engelleme sistemi zaten açık.`, ephemeral: true })
            }
        } else if (seçenek == "kapat") {
            if (db.has(`kufurk_${interaction.guild.id}`)) {
                await db.delete(`kufurk_${interaction.guild.id}`)
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff1818")
                    .setAuthor({ name: "Küfür engelleme", iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`<:tik:821005646299529236> **Küfür engelleme** sistemi başarıyla \`kapatıldı.\``)
                    .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp()
                return interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
            } else {
                return interaction.reply({ content: `<:carpi:821005698564489237> Küfür engelleme sistemi açık değil.`, ephemeral: true })
            }
        }
    },
};
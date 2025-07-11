const Discord = require('discord.js')
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")

module.exports = {
    name: "güvenli-rol",
    description: "Korumalardan etkilenmeyecek rolleri belirlersiniz.",
    options: [
        {
            type: 3,
            name: "eylem",
            description: "Bir eylem seçin.",
            required: true,
            choices: [
                { name: "ayarla", value: "ayarla" },
                { name: "kapat", value: "kapat" },
            ]
        },
        { type: 8, name: 'rol', description: 'Bir rol belirtin.', required: false }
    ], // https://github.com/clqu/discord.js-v13-slash-bot#for-developers
    execute: async (client, interaction) => {
        if (interaction.member.user.id !== await interaction.guild.fetchOwner().then(s => s.user.id)) return interaction.reply({ content: `<:carpi:821005698564489237> Sunucu ayarlarını sadece sunucu sahibi görebilir.`, ephemeral: true })
        let seçenek = interaction?.options?.getString("eylem");
        let rol = interaction?.options?.get("rol")

        if (seçenek == "ayarla") {
            if (!rol) return interaction.reply({ content: `<:carpi:821005698564489237> Lütfen bir rol belirtin.`, ephemeral: true })
            if (db.has(`guvenli_${interaction.guild.id}`)) {
                return interaction.reply({ content: `<:carpi:821005698564489237> Güvenli bölgede en fazla bir rol olabilir. **Şuanki güvenli bölge rolü:** \`${interaction.guild.roles.cache.get(db.get(`guvenli_${interaction.guild.id}`)).name}\``, ephemeral: true })
            } else {
                await db.set(`guvenli_${interaction.guild.id}`, rol.role.id)
                interaction.reply({ content: `<:tik:821005646299529236> Güvenli bölge rolü **${rol.role.name}** olarak ayarlandı. Bu roldeki kişiler güvenlikten etkilenmeyecek!`, allowedMentions: { repliedUser: false } })
            }
        } else if (seçenek == "kapat") {
            if (db.has(`guvenli_${interaction.guild.id}`)) {
                await db.delete(`guvenli_${interaction.guild.id}`)
                interaction.reply({ content: `<:tik:821005646299529236> Güvenli bölge rolü kapatıldı.`, allowedMentions: { repliedUser: false } })
            } else {
                return interaction.reply({ content: `<:carpi:821005698564489237> Güvenli bölge rolü ayarlı değil.`, allowedMentions: { repliedUser: false } })
            }
        }
    },
};
const Discord = require('discord.js')
const { JsonDatabase } = require("wio.db")
const db = new JsonDatabase("database")

module.exports = {
    name: "güvenli-kişi",
    description: "Korumalardan etkilenmeyecek kişileri belirlersiniz.",
    options: [
        {
            type: 3,
            name: "eylem",
            description: "Bir eylem seçin.",
            required: true,
            choices: [
                { name: "ekle", value: "ekle" },
                { name: "çıkart", value: "çıkart" },
            ]
        },
        { type: 6, name: 'kişi', description: 'Bir kişi belirtin.', required: true },
    ], // https://github.com/clqu/discord.js-v13-slash-bot#for-developers
    execute: async (client, interaction) => {
        if (interaction.member.user.id !== await interaction.guild.fetchOwner().then(s => s.user.id)) return interaction.reply({ content: `<:carpi:821005698564489237> Sunucu ayarlarını sadece sunucu sahibi görebilir.`, ephemeral: true })
        let seçenek = interaction?.options?.getString("eylem");
        let member = interaction?.options?.get("kişi").member

        if (seçenek == "ekle") {
            await db.push(`guvenliKisi_${interaction.guild.id}`, member.user.id)
            interaction.reply({ content: `<:tik:821005646299529236> **${member.user.tag}** adlı üye **güvenli kişi** olarak işaretlendi. Bu kişi güvenliklerden etkilenmeyecek!`, allowedMentions: { repliedUser: false } })
        } else if (seçenek == "çıkart") {
            let arr = await db.get(`guvenliKisi_${interaction.guild.id}`)
            if (!arr.includes(member.user.id)) return interaction.reply({ content: `<:carpi:821005698564489237> Bu kişi güvenli bölgede değil.`, ephemeral: true });
            let index = arr.findIndex(a => a == member.user.id)
            arr.splice(index, 1)
            await db.set(`guvenliKisi_${interaction.guild.id}`, arr)
            
            interaction.reply({ content: `<:tik:821005646299529236> **${member.user.tag}** adlı üye **güvenli bölgeden** çıkartıldı.`, allowedMentions: { repliedUser: false } })
        }
    },
};
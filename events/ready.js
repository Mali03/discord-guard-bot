const client = global.client;

module.exports = () => {
    console.log(`\n🌟 \x1b[33m${client.user.tag}\x1b[0m ismi ile bot aktif edildi!`)
    client.user.setPresence({ activities: [{ name: "", type: "PLAYING"}], status: 'dnd' });
}

module.exports.conf = {
    name: "ready"
}
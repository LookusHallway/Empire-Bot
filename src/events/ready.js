const config = require('../../config.json')
const Discord = require('discord.js');

module.exports = {
    once: true,
    async execute(client) {
        let peopleInDisc = client.guilds.cache.get(config.SERVER.MAIN).memberCount
        client.user.setPresence({ activity: { name: `${peopleInDisc} minemen`, type: 'WATCHING' } })

        const helloEmbed = new Discord.MessageEmbed()
            .setTitle('Bot Restarted')
            .setColor('#7289DA')
            .setDescription(`Bot restarted! I am now watching ${peopleInDisc} minemen...`)
        let msg = await client.channels.cache.get(config.CHANNEL.GENERAL).send(helloEmbed);
        msg.delete({ timeout: 10e3 });

        console.log(`${client.user.tag} has logged in!`)
    }
}
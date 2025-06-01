const Discord = require('discord.js')

module.exports = {
    embed: (type, text) => {
        if (type === 'success') {
            return new Discord.MessageEmbed()
            .setDescription('✅ ' + text)
            .setColor('#77b255')
        }
        if (type === 'error') {
            return new Discord.MessageEmbed()
            .setDescription('❌ ' + text)
            .setColor('#ff0000')
        }   
    }
}
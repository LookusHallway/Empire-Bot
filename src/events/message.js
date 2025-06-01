const config = require('../../config.json')
const cooldowns = new Map();
const Discord = require('discord.js')
const { embed } = require('../util/util')

module.exports = {
    once: false,
    async execute(message, client) {
        if (!message.content.startsWith(config.PREFIX) || message.author.bot) { return; }

        // Turning string into args
        const args = message.content.slice(config.PREFIX.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        // Executing the command
        if (!client.commands.has(commandName)) { return; }

        const command = client.commands.get(commandName)

        // Checking if member has permission
        if (command.roles) {
            if (!message.member.roles.cache.some(role => command.roles.includes(role.id))) {
                return message.reply('You don\'t have permission to execute that command!');
            }
        }
        // Checking if cooldown has expired

        if (command.cooldown) {

            // Checking if cooldown for the command exists
            if (!cooldowns.has(command.name)) {
                cooldowns.set(command.name, new Discord.Collection());
            }

            const currentTime = Date.now();
            const timestamps = cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown) * 1000;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

                if (currentTime < expirationTime) {
                    const timeLeft = (expirationTime - currentTime) / 1000;
                    return message.channel.send({ embed: embed('error', `Please wait \`${timeLeft.toFixed(0)}\` more seconds before using \`${command.name}\`.`) });
                }
            }
            // Adds a cooldown if they don't have one
            timestamps.set(message.author.id, currentTime)
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)

        }
        command.execute(client, message, args)

    }
}
const fs = require('fs')
const Discord = require('discord.js')
const config = require('./config.json')
const client = new Discord.Client({ partials: ['USER', 'GUILD_MEMBER']}, {ws: {intents: Discord.Intents.ALL}});
const r = require('rethinkdbdash')()
client.commands = new Discord.Collection()
const { get }= require('axios');
const disbut = require('discord-buttons');
disbut(client);

function loadCommandsAndEvents() {

    // Reading command files
    const commandFolders = fs.readdirSync('./src/commands').filter(f => !f.includes('.'))
    for (const folder in commandFolders) {
        const commandFiles = fs.readdirSync(`./src/commands/${commandFolders[folder]}`).filter(file => file.endsWith('.js'))
        for (const commandFile in commandFiles) {
            const command = require(`./src/commands/${commandFolders[folder]}/${commandFiles[commandFile]}`)
            client.commands.set(command.name, command)
        }
    }

    // Reading event files
    const eventFolder = fs.readdirSync('./src/events').filter(f => f.endsWith('.js'))
    for (const eventFile in eventFolder) {
        const event = require(`./src/events/${eventFolder[eventFile]}`)
        const eventName = eventFolder[eventFile].split('.')[0]

        if (event.once) {
            client.once(eventName, (...args) => event.execute(...args, client))
        } else {
            client.on(eventName, (...args) => event.execute(...args, client))
        }
    }
}

client.login(config.TOKEN).then(() => loadCommandsAndEvents())

module.exports = { r, client }



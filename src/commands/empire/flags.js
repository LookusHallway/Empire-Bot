const { r } = require('../../../index');
const { embed } = require('../../util/util');
const config = require('../../../config.json')

module.exports = {
    name: 'flags',
    description: 'Changes the flags of the empire you are currently in',
    async execute(client, message, args) {
        if (message.guild === client.guilds.cache.get(config.SERVER.EMPIRE)) {
            const entry = await r.db('TCFEmpire').table('users').get(message.author.id).run(); // Gets user id in database
            if (entry.role === 'Co-Owner' || entry.role === 'Master') {
                // The user has permission and the command continues
                const flags = ['peaceful'];
                
                // Ensures syntax is correct
                if (!args[0]) return message.channel.send(embed('error', 'No flag specified. Valid flags: <peaceful>')); // User doesn't specify a flag
                if (!flags.includes(args[0].toLowerCase())) return message.channel.send(embed('error', 'Invalid flag specified!')); // Flag does not exist
                if (!args[1]) return message.channel.send(embed('error', 'You must specify whether you want this flag off or on!'))
                if (args[1].toLowerCase() === 'on' || args[1].toLowerCase() === 'true') {
                    updateDBData(true, message.author.id)
                    message.channel.send(embed('success', `Sucessfully set the ${args[0]} flag to on!`))
                } else if (args[1].toLowerCase() === 'off' || args[1].toLowerCase() === 'false') {
                    updateDBData(false, message.author.id)
                    message.channel.send(embed('success', `Sucessfully set the ${args[0]} flag to off!`))
                } else {
                    // Shows invalid usage
                    message.channel.send(embed('error', 'Invalid value. Use <on/off> or <true/false>.'))
                }                      
            } else if (entry.role === 'Officer' || entry.role === 'Member' || entry.role === 'Trial') {
                message.channel.send(embed('error', 'You do not have permission to do this!')) // If role returns officer, trial, or member, sends error saying insufficient permissions
            } else {
                // If the role returns undefined, sends an error embed saying not in empire
                message.channel.send(embed('error', 'You are not in an empire.'));
            }      
        } else {
            message.channel.send(embed('error', 'You can only execute this command in the Empires discord!'))
        }
    }
}


function updateDBData(isPeaceful, id) {
    try {
        r.db('TCFEmpire').table('empires').filter(id).update({
            'peaceful': isPeaceful
        }).run();
    } catch (err) {
        console.error(new Error(err))
    }
}
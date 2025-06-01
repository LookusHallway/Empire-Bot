const { embed } = require('../../util/util');
const config = require('../../../config');
const { r } = require('../../../index');

module.exports = {
    name: 'rename',
    cooldown: 300,
    
    async execute(client, message, args) {
        if (message.guild === client.guilds.cache.get(config.SERVER.EMPIRE)) {
            if (!args[0]) return message.channel.send(embed('error', 'Invalid name.'))
            const empireName = args.slice(0).join(" ");
            const query = await r.db('TCFEmpire').table('users').get(message.author.id).run();
            if (!query) {
                return message.channel.send(embed('error', 'You are not in an empire.'))
            } else if (!query.role === 'Master') {
                return message.channel.send(embed('error', 'You do not have permission to do this!'))
            } else {
                updateChannelNames(client, query.empire, empireName)
                updateRoleNames(client, query.empire, empireName)
                setTimeout(() => {
                    updateUserData(query.empire, empireName)
                    updateEmpireData(message.author.id, empireName)    
                }, 3e3)  
                message.channel.send(embed('success', 'Successfully renamed your empire!'))
            }
        } else {
            message.channel.send(embed('error', 'You can only execute this command in the Empires Discord.'))
        }
    }
}

function updateUserData(id, empireName) {
    r.db('TCFEmpire').table('users').filter({'empire': id}).update({
        'empire': empireName,
        'lowercaseEmpire': empireName.toLowerCase()
    }).run();
}

function updateEmpireData(id, empireName) {
    r.db('TCFEmpire').table('empires').filter(id).update({
        'empireName': empireName,
        'lowercaseEmpireName': empireName.toLowerCase()
    }).run();
}

async function updateChannelNames(client, oldName, newName) {
    const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE);
    const category = await empireServer.channels.cache.find(c => c.name === oldName)
    category.edit({ name: newName })
}

async function updateRoleNames(client, oldName, newName) {
    const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE);
    // Old roles declared
    const mainRole = await empireServer.roles.cache.find(role => role.name === oldName)
    const officerRole = await empireServer.roles.cache.find(c => c.name === `${oldName} | Officer`)
    const coOwnerRole = await empireServer.roles.cache.find(c => c.name === `${oldName} | Co-Owner`)
    const masterRole = await empireServer.roles.cache.find(c => c.name === `${oldName} | Master`)
    const trialMemberRole = await empireServer.roles.cache.find(role => role.name === `${oldName} | Trial`)
    // Changing the names of the roles to newName
    mainRole.setName(newName)
    officerRole.setName(`${newName} | Officer`)
    coOwnerRole.setName(`${newName} | Co-Owner`)
    masterRole.setName(`${newName} | Master`)
    trialMemberRole.setName(`${newName} | Trial`)
}


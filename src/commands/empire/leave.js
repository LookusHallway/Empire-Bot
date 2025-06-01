const { embed } = require('../../util/util');
const config = require('../../../config');
const Discord = require('discord.js');
const { r } = require('../../../index');

module.exports = {
    name: 'leave',
    async execute(client, message, args) {
        const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE)

        if (message.guild === empireServer) {
            const query = await r.db('TCFEmpire').table('users').get(message.author.id).run()

            if (!query) return message.channel.send(embed('error', 'You are not in an empire.'))
            if (query.role === 'Master') return message.channel.send(embed('error', 'You are the empire master! Please do =transfer before leaving.'))
            
            const user = empireServer.members.cache.get(message.author.id)
            
            removeRoles(user, query, empireServer).then(() => {
                removeUserEntry(message.author.id);
            });
            message.author.send(embed('success', 'Successfully left your empire!'))
        } else {
            message.channel.send(embed('error', 'You can only execute this in the empire discord server!'))
        }
    }
}

async function removeUserEntry(id) {
    r.db('TCFEmpire').table('users').get(id).delete().run()
}

async function removeRoles(user, query, empireServer) {
    const memberRole = empireServer.roles.cache.find(r => r.name === query.empire)
    if (query.role === 'Member') {
        user.roles.remove(memberRole);
    } else {
        const altRole = empireServer.roles.cache.find(r => r.name === `${query.empire} | ${query.role}`)
        user.roles.remove(memberRole)
        user.roles.remove(altRole)
    }
}
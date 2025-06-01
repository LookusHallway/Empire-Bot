const { embed } = require('../../util/util');
const config = require('../../../config');
const Discord = require('discord.js');
const { r, client } = require('../../../index');

module.exports = {
    name: 'kick',
    async execute(client, message, args) {
        const hierarchy = ['Trial', 'Member', 'Officer', 'Co-Owner', 'Master']
        const allowedRoles = ['Officer', 'Co-Owner', 'Master']
        const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE)

        if (message.guild === empireServer) {
            const entry = await r.db('TCFEmpire').table('users').get(message.author.id).run()

            if (!entry) return message.channel.send(embed('error', 'You are not in an empire.'))
            if (!allowedRoles.includes(entry.role)) return message.channel.send(embed('error', 'You have insufficient permissions to execute this command'))
            if (!args[0]) return message.channel.send(embed('error', 'You did not specify a user to kick'))

            const preTarget = client.users.cache.find(user => user.username === args[0])

            if (!preTarget) return message.channel.send(embed('error', 'You specified an invalid user to kick!'))

            const target = empireServer.members.cache.get(preTarget.id)
            const targetQuery = await r.db('TCFEmpire').table('users').get(target.id).run()

            if (!targetQuery) return message.channel.send(embed('error', 'This person is not in an empire!'))
            if (targetQuery.empire !== entry.empire) return message.channel.send(embed('error', 'You are not in the same empire as this person!'))

            const kickReason = args.slice(1).join(" ");

            if (!kickReason) return message.channel.send(embed('error', 'You must provide a kick reason!'))

            const mainRole = empireServer.roles.cache.find(role => role.name === entry.empire)
            const officerRole = empireServer.roles.cache.find(role => role.name === `${entry.empire} | Officer`)
            const coOwnerRole = empireServer.roles.cache.find(role => role.name === `${entry.empire} | Co-Owner`)
            const trialRole = empireServer.roles.cache.find(role => role.name === `${entry.empire} | Trial`)
            const kickEmbed = new Discord.MessageEmbed()
                .setColor('RED')
                .setTitle(`You have been kicked from the ${entry.empire} empire by ${message.author.username}.`)
                .setDescription(`Reason for kick: ${kickReason}.`)
                .setFooter('If you believe this was a mistake, contact the owner of the empire.')

            if (targetQuery.role === 'Trial') {
                kickUser(target, trialRole, mainRole, kickEmbed, message)
            } else if (targetQuery.role === 'Member') {
                kickUser(target, undefined, mainRole, kickEmbed, message) // Undefined executes the if statement at line 63
            } else if (targetQuery.role === 'Officer') {
                if (hierarchy.indexOf(targetQuery.role) >= hierarchy.indexOf(entry.role)) return message.channel.send(embed('error', 'You cannot kick someone of same or higher status in the empire!'))
                kickUser(target, officerRole, mainRole, kickEmbed, message)
            } else if (targetQuery.role === 'Co-Owner') {
                if (hierarchy.indexOf(targetQuery.role) >= hierarchy.indexOf(entry.role)) return message.channel.send(embed('error', 'You cannot kick someone of same or higher status in the empire!'))
                kickUser(target, coOwnerRole, mainRole, kickEmbed, message)
            } else if (targetQuery.role === 'Master') {
                return message.channel.send(embed('error', 'You may not kick the master of the empire!'))
            }

            message.channel.send(embed('success', `Successfully kicked <@${target.id}> for '${kickReason}'.`))
        } else {
            message.channel.send(embed('error', 'You can only execute this in the empire discord server'))
        }
    }
}

async function removeUserEntry(id) {
    r.db('TCFEmpire').table('users').get(id).delete().run()
}

async function kickUser(target, altRole, mainRole, kickEmbed, message) {
    if (typeof altRole === 'undefined') { // If user is a member(altRole is undefined)
        target.roles.remove(mainRole)
        removeUserEntry(target.id)
        target.send(kickEmbed).catch(err => {})
        return;
    }
    target.roles.remove(altRole)
    target.roles.remove(mainRole)
    removeUserEntry(target.id)
    target.send(kickEmbed).catch(err => {})
    return;
}
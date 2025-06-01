const config = require('../../../config')
const { embed } = require('../../util/util');
const Discord = require('discord.js')
const { r } = require('../../../index')

module.exports = {
    name: 'promote',
    description: 'P',
    async execute(client, message, args) {
        const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE)

        if (message.guild === empireServer) {
            const query = await r.db('TCFEmpire').table('users').get(message.author.id).run();

            if (!query) return message.channel.send(embed('error', 'You are not in an empire.'))
            if (query.role !== 'Master') return message.channel.send(embed('error', 'You have insufficient permissions to do this!'))
            if (!args[0]) return message.channel.send(embed('error', 'You did not specify who to promote!'))

            const promotee = client.users.cache.find(user => user.username === args[0]) // Finds the invitee

            if (!promotee) return message.channel.send(embed('error', 'You specified an invalid player to promote!'))

            const promoteeQuery = await r.db('TCFEmpire').table('users').get(promotee.id).run();

            if (!promoteeQuery) return message.channel.send(embed('error', 'This person is not in an empire'))
            if (query.empire !== promoteeQuery.empire) return message.channel.send(embed('error', 'You are not in the same empire as this person!'))

            const lowercaseRank = args[1].toLowerCase();
            
            if (!lowercaseRank) return message.channel.send(embed('error', 'You did not specify what rank to promote this person to!')) // No specified rank
            if (lowercaseRank !== 'co-owner' && lowercaseRank !== 'officer' && lowercaseRank !== 'member' && lowercaseRank !== 'trial') return message.channel.send(embed('error', 'Invalid rank. Use <Co-Owner/Officer/Member/Trial> instead!'))
            if (lowercaseRank === promoteeQuery.role.toLowerCase()) return message.channel.send(embed('error', 'This person is already that rank!')) // Trying to promote member to the same rank

            let rank = '';
            switch (lowercaseRank) {                    
                case 'co-owner':
                    rank = 'Co-Owner';
                    break;
                case 'officer':
                    rank = 'Officer';
                    break;
                case 'member':
                    rank = 'Member';
                    break;
                case 'trial':
                    rank = 'Trial';
                    break;
            }

            const promoteeGMObj = empireServer.members.cache.get(promotee.id)
            const currentRole = promoteeGMObj.roles.cache.find(r => r.name === `${promoteeQuery.empire} | ${promoteeQuery.role}`)

            if (currentRole) { // If the promotee is NOT a member

                updateRoles(promoteeGMObj, currentRole, rank, promoteeQuery, empireServer)
                setTimeout(() => {
                    updateDBData(promoteeGMObj.id, rank)
                }, 3e3)
                message.channel.send(embed('success', `Successfully gave <@${promotee.id}> ${rank}!`))
            } else { // If the promotee IS a member
                updateRoles(promoteeGMObj, empireServer.roles.cache.find(r => r.name === promoteeQuery.empire), rank, promoteeQuery, empireServer)
                setTimeout(() => {
                    updateDBData(promoteeGMObj.id, rank)
                }, 3e3)
                message.channel.send(embed('success', `Successfully gave <@${promotee.id}> ${rank}!`))
            }

        } else {
            message.channel.send(embed('error', 'You can only execute this in the Empire server!'))
        }
    }
}

function updateDBData(id, newRole) {
    r.db('TCFEmpire').table('users').get(id).update({
        'lowercaseRole': newRole.toLowerCase(),
        'role': newRole
    }).run();
}

async function updateRoles(user, oldRole, rank, query, empireServer) {
    if (oldRole.name === query.empire) { // If promotee is a member

        const role = await empireServer.roles.cache.find(r => r.name === `${query.empire} | ${rank}`)
        user.roles.add(role)
        return;
    } else { // If promotee is NOT a member
        if (rank === 'Member') {
            return user.roles.remove(oldRole);
        }
        const role = await empireServer.roles.cache.find(r => r.name === `${query.empire} | ${rank}`)
        user.roles.add(role)
        user.roles.remove(oldRole)
        return;
    }
}
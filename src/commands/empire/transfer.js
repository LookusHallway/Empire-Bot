const { embed } = require('../../util/util');
const config = require('../../../config');
const { r } = require('../../../index');

module.exports = {
    name: 'transfer',
    async execute(client, message, args) {
        const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE)
        
        if (message.guild === empireServer) { // Makes sure command is executed in the Empire server
            const query = await r.db('TCFEmpire').table('users').get(message.author.id).run()
            if (!query) return message.channel.send(embed('error', 'You are not in an empire.')); // Makes sure people are in an empire
            if (!query.role === 'Master') return message.channel.send(embed('error', 'You have insufficient permissions to execute this command')) // Makes sure user has permission
            if (!args[0]) return message.channel.send(embed('error', 'You need to specify who to transfer the empire to')) // M

            const transferee = client.users.cache.find(user => user.username === args[0]) // Turns args[0] into a Discord user

            if (!transferee) return message.channel.send(embed('error', 'You did not specify a valid member to transfer the empire to.'))
            
            const transfereeQuery = await r.db('TCFEmpire').table('users').get(transferee.id).run()
            if (!transfereeQuery) return message.channel.send(embed('error', 'This person is not in an empire!')) // Makes sure transferee is in an empire
            if (transfereeQuery.empire !== query.empire) return message.channel.send(embed('error', 'You are not in the same empire as this person!')) // Makes sure transferee is in the same empire
            if (transfereeQuery.role === 'Member') {
                updateRoles(client, transferee.id, query, transfereeQuery, message.author.id)
                setTimeout(() => {
                    updateOwner(message.author.id, transferee.id);
                }, 1e3)
                return message.channel.send(embed('success', `Succesfully transferred your empire to ${transferee.username}!`))                
            }
            updateRoles(client, transferee.id, query, transfereeQuery)
            setTimeout(() => {
                updateOwner(message.author.id, transferee.id);                
            }, 1e3)
            return message.channel.send(embed('success', `Successfully transferred your empire to ${transferee.username}`))
        } else {
            message.channel.send(embed('error', 'You can only execute this command in the Empires Discord.'))
        }
    }
}

function updateOwner(oldOwner, newOwner) {
    r.db('TCFEmpire').table('empires').filter(oldOwner).update({ // Finds empire by old owner and updates ownerID to new owner
        'ownerID': newOwner
    }).run(); 

    r.db('TCFEmpire').table('users').get(oldOwner).update({
        'role': 'Member',
        'lowercaseRole': 'member',
    }).run();
    r.db('TCFEmpire').table('users').get(newOwner).update({
        'role': 'Master',
        'lowercaseRole': 'master',
    }).run();    
}

function updateRoles(client, userID, query, transfereeQuery, oldMasterID) {
    const guild = client.guilds.cache.get(config.SERVER.EMPIRE) // Gets empire server
    const masterRole = guild.roles.cache.find(r => r.name === `${query.empire} | Master`) // Finds the empire master role 
    const user = guild.members.cache.get(userID) // Finds the ID of the transferee 
    if (transfereeQuery.role === 'Member') {
        user.roles.add(masterRole) // Adds empire master role only
    } else {
        const oldRole = guild.roles.cache.find(r => r.name === `${query.empire} | ${transfereeQuery.role}`)
        user.roles.remove(oldRole) // Removes officer/co-owner role
        user.roles.add(masterRole) // Adds empire master role
    } 
    const master = guild.members.cache.get(oldMasterID)
    setTimeout(() => {
        master.roles.remove(masterRole).catch((err) => {

        })
    }, 2e3) // Gets rid of old master's role
}
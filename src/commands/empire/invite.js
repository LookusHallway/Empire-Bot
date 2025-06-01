const config = require('../../../config');
const { embed } = require('../../util/util');
const Discord = require('discord.js');
const { r } = require('../../../index');

module.exports = {
    name: 'invite',
    description: 'Invites a player to your empire',

    async execute(client, message, args) {
        if (message.guild === client.guilds.cache.get(config.SERVER.EMPIRE)) {
            const mainServer = client.guilds.cache.get(config.SERVER.MAIN) // Stores main server ID as a variable
            const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE) // Stores empire server ID as a variable

            const entry = await r.db('TCFEmpire').table('users').get(message.author.id).run();
            
            if (!entry) return message.channel.send(embed('error', 'You are not in an empire.'))
            if (!entry.role === 'Master' || !entry.role === 'Co-Owner' || !entry.role === 'Officer') return message.channel.send(embed('error', 'You do not have sufficient permission to invite people to the empire'))
            if (!args[0]) return message.channel.send(embed('error', 'You need to specify a person to invite')) // Missing someone to invite
            
            const invitee = client.users.cache.find(user => user.username === args[0]) // Finds the invitee
            
            if (!invitee) return message.channel.send(embed('error', 'You did not specify a valid person to invite'))
            
            const inviteeQuery = await r.db('TCFEmpire').table('users').get(invitee.id).run()
            
            if (inviteeQuery) return message.channel.send(embed('error', 'This person is already in an empire'))
            
            const inviteEmbed = new Discord.MessageEmbed() // Invite Embed
                .setColor('GREEN')
                .setTitle(`You have been invited to the test empire`)
                .setDescription('If you want to accept this invite, react with ✅. If you want to deny it, react with ❌')
                .setFooter('This embed will automatically delete in 60 seconds')

            const filter = (reaction, user) => {
                return reaction.emoji.name === '✅' || reaction.emoji.name === '❌' && user.id === message.author.id;
            }

            // Added a try catch to ensure that they have dms on
            invitee.send(inviteEmbed).then(async (msg) => {
                message.channel.send(embed('success', `Invited ${invitee.username} to the empire!`))
                await msg.react('✅')
                await msg.react('❌')

                const collector = msg.createReactionCollector(filter, { time: 60e3 })
                collector.on('collect', async (reaction, user) => {

                    if (reaction.emoji.name === '❌') {
                        msg.delete();
                        invitee.send(embed('success', 'Denied the invite.'))
                        collector.stop()
                    }
                    if (reaction.emoji.name === '✅') {
                        msg.delete();
                        const inviteEmbed = new Discord.MessageEmbed()
                            .setColor('GREEN')
                            .setTitle('You have accepted the invite')
                            .setDescription('Join the empire discord as soon as you can so the roles get applied to you after 10 seconds of you being in the discord')
                            .setFooter('If you do not join within 10 seconds, you will have to be reinvited')
                        invitee.send(inviteEmbed)
                        invitee.send('https://discord.gg/nRfrsfe4DF').then(() => {
                            message.channel.send(embed('success', `${invitee.username} joined the empire!`))

                            setTimeout(() => {
                                const user = empireServer.members.cache.get(invitee.id)
                                if (!user) return;
                                const mainRole = empireServer.roles.cache.find((role) => role.name === entry.empire)
                                const trialRole = empireServer.roles.cache.find((role) => role.name === `${entry.empire} | Trial`)
                                try {
                                    user.roles.add(mainRole)
                                    user.roles.add(trialRole)
                                    saveUserDBData(entry.empire, invitee.id)

                                } catch (err) {

                                }
                            }, 10e3)
                        })
                        collector.stop()
                    }
                })
                collector.on('end', (collected) => {

                })
            }).catch(() => {
                message.channel.send(embed('error', 'This user does not have DMs on with the bot.'))
            })

        } else {
            message.channel.send(embed('error', 'You can only execute this command in the empires discord'))
        }
    }
}

function saveUserDBData(empireName, id) {
    const dbQuery = {
        'id': id,
        'empire': empireName,
        'role': 'Trial',
    }
    r.db('TCFEmpire').table('users').insert(dbQuery).run();
}
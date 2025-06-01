const config = require('../../../config');
const { embed } = require('../../util/util');
const Discord = require('discord.js');
const { r } = require('../../../index');

module.exports = {
    name: 'disband',
    description: 'Disbands an empire',
    async execute(client, message, args) {
        if (!message.guild === client.guilds.cache.get(config.SERVER.EMPIRE)) return message.channel.send(embed('error', 'You can only do this in the Empires server!'))
        const entry = await r.db('TCFEmpire').table('users').get(message.author.id).run();

        if (!entry) return message.channel.send(embed('error', 'You are not in an empire.')); // Returns if the person is not in an empire
        if (entry.role === 'Master') {
            const disbandEmbed = new Discord.MessageEmbed()
                .setTitle(`Are you sure you want to disband ${entry.empire}?`)
                .setColor('RED')
                .setDescription('This action cannot be undone. This menu will be automatically disabled in 30 seconds.')
                .setFooter('Please react with a ✅ to continue.')

            const confirmEmbed = await message.channel.send(disbandEmbed);

            await confirmEmbed.react('✅')

            const filter = (reaction, user) => {
                return reaction.emoji.name === '✅' && user.id === message.author.id;
            }

            const collector = confirmEmbed.createReactionCollector(filter, { time: 30e3 });

            collector.on('collect', async (reaction, user) => {
                const typeInEmpireName = new Discord.MessageEmbed()
                    .setTitle(`Please type in your empire name, ${entry.empire}, to disband the empire`)
                    .setColor('RED')
                    .setDescription('If you do not want to disband your empire, wait 15 seconds.')

                const confirmMessage = await message.channel.send(typeInEmpireName)


                const filter = m => m.author.id === message.author.id;
                const messageCollector = message.channel.createMessageCollector(filter, { time: 15e3 })

                messageCollector.on('collect', message => {
                    if (message.content === entry.empire) {
                        deleteAllChannels(client, message.author.id)
                        deleteAllRoles(client.guilds.cache.get(config.SERVER.EMPIRE), message.author.id)
                        setTimeout(() => {
                            deleteDBData(message.author.id)
                        }, 3e3)

                        message.channel.send(embed('success', 'Sucessfully deleted your empire'))
                    }
                })

                messageCollector.on('end', (m) => {
                    confirmMessage.delete()
                })

            })

            collector.on('end', (collected) => {
                confirmEmbed.delete()
            })
        } else {
            message.channel.send(embed('error', 'You do not have sufficient permission to do this'))   
        }

    }
}

async function deleteDBData(id) {
    await r.db('TCFEmpire').table('empires').filter({ 'ownerID': id}).delete().run();
    const empireQuery = await r.db('TCFEmpire').table('users').get(id).run()
    const empireName = empireQuery.empire;
    r.db('TCFEmpire').table('users').filter({ 'empire': empireName}).delete().run()
}

async function deleteAllChannels(client, id) {
    const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE);
    const entry = await r.db('TCFEmpire').table('users').get(id).run()
    const category = await empireServer.channels.cache.find(c => c.name === entry.empire)
    category.children.forEach(channel => channel.delete())
    category.delete()
}

async function deleteAllRoles(guild, id) {
    const entry = await r.db('TCFEmpire').table('users').get(id).run()  
    // All of the roles we are deleting
    guild.roles.cache.find((role) => role.name === `${entry.empire} | Master`).delete();
    guild.roles.cache.find((role) => role.name === `${entry.empire} | Co-Owner`).delete();
    guild.roles.cache.find((role) => role.name === `${entry.empire} | Officer`).delete();
    guild.roles.cache.find((role) => role.name === `${entry.empire} | Trial`).delete();
    guild.roles.cache.find((role) => role.name === entry.empire).delete();
}
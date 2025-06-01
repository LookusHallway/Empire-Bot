const { embed } = require('../../util/util');
const config = require('../../../config');
const { r } = require('../../../index');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'description',
    async execute(client, message, args) {
        if (message.guild === client.guilds.cache.get(config.SERVER.EMPIRE)) {
            const userQuery = await r.db('TCFEmpire').table('users').get(message.author.id).run();
            if (!userQuery) return message.channel.send(embed('error', 'You are not in an empire'))
            if (userQuery !== 'Master' && userQuery !== 'Co-Owner') return message.channel.send(embed('error', 'You do not have sufficient permissions to execute this!'))
            
            const empireQuery = await r.db('TCFEmpire').table('empires').filter({ empireName: userQuery.empire }).run();
            const query = empireQuery[0];
            if (!args[0]) {
                const descEmbed = new MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(`${query.empireName}'s Description`)
                    .setDescription(query.empireDescription)
                message.channel.send(descEmbed)
            } else {
                
                const newDescription = args.join(' ')
                updateDescription(query, newDescription)
                message.channel.send(embed('success', `Successfully set your description to '${newDescription}'`))
            }

        } else {
            message.channel.send(embed('error', 'You can only execute this command in the Empires Discord.'))
        }
    }
}

function updateDescription(query, newDescription) {
    r.db('TCFEmpire').table('empires').filter({ 'empireName': query.empireName}).update({
        'empireDescription': newDescription
    }).run()
}

const config = require('../../../config');
const { embed } = require('../../util/util');
const Discord = require('discord.js');
const { r } = require('../../../index');

module.exports = {
    name: 'empire',
    description: 'Creates a new empire',

    async execute(client, message, args) {
        const empireLookupName = args.join(" ");
        if (args[0]) {
            const empireServer = client.guilds.cache.get(config.SERVER.EMPIRE)
            const empireQuery = await r.db('TCFEmpire').table('empires').filter({ empireName: empireLookupName }).run();
            const query = empireQuery[0];

            if (!query) return message.channel.send(embed('error', 'There is no empire under this name!'))
            const empireRole = empireServer.roles.cache.find((role) => role.name === empireLookupName)
            
            let peaceful = query.peaceful;
            switch (peaceful) {
                case true:
                    peaceful = 'True'
                    break;
                case false:
                    peaceful = 'False'
                    break;
            }

            const empireLookupEmbed = new Discord.MessageEmbed()
                .setColor('BLUE')
                .setTitle(`${query.empireName} empire`)
                .setDescription(`This is an overview of the ${query.empireName} empire.`)
                .addFields(
                    { name: 'Empire Name', value: query.empireName, inline: false },
                    { name: 'Empire Description', value: query.empireDescription, inline: false },
                    { name: 'Peaceful', value: peaceful, inline: false },
                    { name: 'Empire Members: ', value: empireRole.members.map(member => `<@${member.user.id}>`).join('\n'), inline: false }
                )

            message.channel.send(empireLookupEmbed);


        } else {
            let count = 0;
            let answers = [];

            let questionsEmbed = new Discord.MessageEmbed()
                .setTitle('Empire Creation')
                .setColor('GREEN')
                .setDescription('null')
                .setFooter('Type "cancel" to cancel this process. This times out after 30 seconds.')

            const questions = [
                'Please type the name of your new Empire!',
                'Please provide an empire description. This can be changed later.',
            ];

            const filter = m => m.author.id === message.author.id;
            const collector = new Discord.MessageCollector(message.channel, filter, { time: 30e3 })

            r.db('TCFEmpire').table('users').get(message.author.id).run().then(async (entry) => {
                if (entry) { // Makes sure they aren't already in the DB
                    message.channel.send(embed('error', 'You are already in an empire'))
                    return;
                } else {
                    questionsEmbed.setDescription(questions[count++]);
                    message.channel.send(questionsEmbed);

                    // Collector
                    collector.on('collect', async (m) => {
                        answers.push(m.content);
                        if (m.content.toLowerCase().startsWith('cancel')) {
                            collector.stop(); // End collector if cancel was executed
                            message.channel.send(embed('success', 'Canceled the empire creation process.'))
                            return;
                        }

                        if (count === 1) {
                            const dbCheck = await r.db('TCFEmpire').table('empires').filter({'empireName': answers[0]}).run();
                            if (dbCheck[0]) { //  Makes sure that desired empire name doesn't already exist
                                message.channel.send(embed('error', 'There is already an empire with that name! Canceled the creation process.'));
                                collector.stop();
                                return;
                            }
                        }

                        if (count < questions.length) { // Check for next question
                            questionsEmbed.setDescription(questions[count++]);
                            message.channel.send(questionsEmbed);
                        } else if (count === questions.length) {
                            message.channel.send(embed('success', 'Creating your new empire! You will be invited to the Empire Discord with corresponding channels and roles.'))
                            const empireName = answers[0];
                            const empireDescription = answers[1];


                            saveDB(empireName, message.author.id, empireDescription, true);
                            userDB(empireName, message.author.id);
                            createRoles(client, empireName, message.author.id);
                            collector.stop();
                        }
                    });
                }
            })
        }
    }
}

// Database functions
function saveDB(empireName, id, empireDescription, peaceful) {
    const dbQuery = {
        'empireName': empireName,
        'lowercaseEmpireName': empireName.toLowerCase(),
        'ownerID': id,
        'empireDescription': empireDescription,
        'peaceful': peaceful
    }
    r.db('TCFEmpire').table('empires').insert(dbQuery).run();
}

function userDB(empireName, id) {
    const dbQuery = {
        'id': id,
        'empire': empireName,
        'lowercaseEmpire': empireName.toLowerCase(),
        'role': 'Master',
        'lowercaseRole': 'master',

    }
    r.db('TCFEmpire').table('users').insert(dbQuery).run();
}

async function createRoles(client, empireName, id) {
    const server = client.guilds.cache.get(config.SERVER.EMPIRE);
    server.roles.create({
        data: {
            name: `${empireName} | Master`,
            color: 'BLUE',
        }
    }).then(async (role) => {
        const master = await server.members.cache.get(id)
        master.roles.add(role)
    });
    server.roles.create({
        data: {
            name: `${empireName} | Co-Owner`,
            color: 'BLUE',
        }
    });
    server.roles.create({
        data: {
            name: `${empireName} | Officer`,
            color: 'BLUE',
        }
    });
    server.roles.create({
        data: {
            name: empireName,
            color: 'BLUE',
        }
    }).then(async (role) => {
        const master = await server.members.cache.get(id)
        await master.roles.add(role)
    })
    server.roles.create({
        data: {
            name: `${empireName} | Trial`,
            color: 'BLUE'
        }
    })

    setTimeout(() => {
        createChannels(client, empireName);
    }, 2e3)
}

async function createChannels(client, empireName) {
    const server = client.guilds.cache.get(config.SERVER.EMPIRE);
    const everyoneRole = server.roles.everyone;
    const empireRole = await server.roles.cache.find(r => r.name === empireName)
    const masterRole = await server.roles.cache.find(r => r.name === `${empireName} | Master`)
    const coOwnerRole = await server.roles.cache.find(r => r.name === `${empireName} | Co-Owner`)
    const officerRole = await server.roles.cache.find(r => r.name === `${empireName} | Officer`)

    server.channels.create(empireName, {
        type: 'category',
    }).then(c => {
        c.overwritePermissions([
            {
                id: everyoneRole.id,
                deny: ['VIEW_CHANNEL']
            },
            {
                id: empireRole.id,
                allow: ['VIEW_CHANNEL']
            },
            {
                id: masterRole.id,
                allow: ['MANAGE_MESSAGES']
            },
            {
                id: coOwnerRole.id,
                allow: ['MANAGE_MESSAGES']
            }, 
            {
                id: officerRole.id,
                allow: ['MANAGE_MESSAGES']
            }
        ]);
        server.channels.create('empire-announcements', {
            type: 'text',
        }).then((channel) => {
            channel.setParent(c)
            channel.overwritePermissions([
                {
                    id: empireRole.id,
                    deny: ['SEND_MESSAGES']
                },
                {
                    id: masterRole.id,
                    allow: ['SEND_MESSAGES']
                }
            ])
        })
        server.channels.create('empire-general', {
            type: 'text',
        }).then((channel) => {
            channel.setParent(c)
        })
        server.channels.create('empire-commands', {
            type: 'text',
        }).then((channel) => {
            channel.setParent(c)
        })
        server.channels.create('Empire Voice', {
            type: 'voice',
        }).then((channel) => {
            channel.setParent(c)
        })
    })

}


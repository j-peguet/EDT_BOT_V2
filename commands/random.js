const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription(`Choix d'une personne au harsard`)
        .addStringOption(option =>
            option.setName('classe')
                .setDescription('Classe de la personne à choisir')
                .setRequired(true)
                .addChoice('B1C1', 'gif_funny')
                .addChoice('B1C2', 'gif_meme')
                .addChoice('B2C1', 'gif_meme')
                .addChoice('B2C2', 'gif_meme')
                .addChoice('B3C1', 'gif_meme')
                .addChoice('B3C2', 'gif_meme')
                .addChoice('B3CASR', 'gif_meme')
                .addChoice('I1C1', 'gif_meme')
                .addChoice('I1C2', 'gif_meme')
                .addChoice('I1CASR', 'gif_meme')
                .addChoice('I2C1', 'gif_meme')
                .addChoice('I2C2', 'gif_meme')
                .addChoice('I2C3', 'gif_meme')),
	async execute(interaction) {
        let name = interaction.options.getString('classe');

        await interaction.guild.roles.fetch('872376069666250796')
            .then(role => console.log(role.members));

        await interaction.reply(name);
    },
};

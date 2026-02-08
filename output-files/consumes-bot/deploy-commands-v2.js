import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '/home/opc/tbc-website/.env.consumes-bot' });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Get client ID from token (first part before the dot)
const CLIENT_ID = Buffer.from(TOKEN.split('.')[0], 'base64').toString();

console.log('Deploying commands...');
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Guild ID: ${GUILD_ID}`);

// Define commands
const commands = [
  // /prices command
  new SlashCommandBuilder()
    .setName('prices')
    .setDescription('View consume prices')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Item category')
        .setRequired(false)
        .addChoices(
          { name: 'Protection & Utility', value: 'protection' },
          { name: 'Tank & Melee', value: 'melee' },
          { name: 'Caster', value: 'caster' },
          { name: 'Concoctions', value: 'concoctions' },
          { name: 'Flasks', value: 'flasks' }
        )
    ),

  // /order command
  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Place an order for consumes')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Item name or acronym (e.g., GFPP, Mongoose)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Number of items')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes for the order')
        .setRequired(false)
    ),

  // /myorders command - NEW
  new SlashCommandBuilder()
    .setName('myorders')
    .setDescription('View your order history')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Pending', value: 'pending' },
          { name: 'Processing', value: 'processing' },
          { name: 'Completed', value: 'completed' }
        )
    ),

  // /admin command
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands for bot configuration')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setdiscount')
        .setDescription('Set the discount percentage')
        .addIntegerOption(option =>
          option.setName('percent')
            .setDescription('Discount percentage (0-50)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(50)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setprice')
        .setDescription('Manually set an item price')
        .addStringOption(option =>
          option.setName('item')
            .setDescription('Item name or acronym')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('price')
            .setDescription('AH price in gold')
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('orders')
        .setDescription('View pending orders')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('complete')
        .setDescription('Mark an order as completed')
        .addStringOption(option =>
          option.setName('orderid')
            .setDescription('Order ID to complete')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('process')
        .setDescription('Mark an order as being processed')
        .addStringOption(option =>
          option.setName('orderid')
            .setDescription('Order ID to mark as processing')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('addadmin')
        .setDescription('Add a new admin')
        .addStringOption(option =>
          option.setName('userid')
            .setDescription('Discord user ID to add as admin')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('View current bot configuration')
    )
].map(command => command.toJSON());

// Deploy commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy to specific guild (faster for development)
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    console.log('Commands deployed:');
    data.forEach(cmd => console.log(`  - /${cmd.name}`));
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();

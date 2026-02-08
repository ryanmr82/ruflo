import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

// Load environment variables
config({ path: '/home/opc/tbc-website/.env.consumes-bot' });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ALCHEMY_CHANNEL_ID = process.env.DISCORD_ALCHEMY_CHANNEL_ID;
const ADMIN_USER_ID = process.env.DISCORD_ADMIN_USER_ID;
const DEFAULT_DISCOUNT = parseInt(process.env.DEFAULT_DISCOUNT_PERCENT) || 10;

// Data file paths
const DATA_DIR = '/home/opc/consumes-bot/data';
const PRICES_FILE = `${DATA_DIR}/prices.json`;
const ORDERS_FILE = `${DATA_DIR}/orders.json`;
const CONFIG_FILE = `${DATA_DIR}/config.json`;

// Ensure data directory exists
try { mkdirSync(DATA_DIR, { recursive: true }); } catch(e) {}

// Item catalog with categories
const ITEM_CATALOG = {
  "protection": {
    name: "Protection & Utility",
    items: [
      { id: "GFPP", name: "Greater Fire Protection Potion", itemId: 13457 },
      { id: "GAPP", name: "Greater Arcane Protection Potion", itemId: 13461 },
      { id: "GNPP", name: "Greater Nature Protection Potion", itemId: 13458 },
      { id: "GFROP", name: "Greater Frost Protection Potion", itemId: 13456 },
      { id: "GSPP", name: "Greater Shadow Protection Potion", itemId: 13459 },
      { id: "LIP", name: "Limited Invulnerability Potion", itemId: 3387 },
      { id: "FAP", name: "Free Action Potion", itemId: 5634 },
      { id: "LAP", name: "Living Action Potion", itemId: 20008 },
      { id: "MRP", name: "Magic Resistance Potion", itemId: 9036 },
      { id: "RPA", name: "Restorative Potion", itemId: 9030 },
      { id: "Invis", name: "Invisibility Potion", itemId: 9172 },
      { id: "Swim", name: "Swim Speed Potion", itemId: 6372 },
      { id: "Swiftness", name: "Swiftness Potion", itemId: 2459 }
    ]
  },
  "melee": {
    name: "Tank & Melee",
    items: [
      { id: "Mongoose", name: "Elixir of the Mongoose", itemId: 13452 },
      { id: "Giants", name: "Elixir of Giants", itemId: 9206 },
      { id: "MightyRage", name: "Mighty Rage Potion", itemId: 13442 },
      { id: "GreaterStoneshield", name: "Greater Stoneshield Potion", itemId: 13455 },
      { id: "Fortitude", name: "Elixir of Fortitude", itemId: 3825 },
      { id: "SuperiorDefense", name: "Elixir of Superior Defense", itemId: 13445 },
      { id: "Agility", name: "Elixir of Greater Agility", itemId: 9187 },
      { id: "StrengthScroll", name: "Scroll of Strength IV", itemId: 10310 },
      { id: "AgilityScroll", name: "Scroll of Agility IV", itemId: 10309 }
    ]
  },
  "caster": {
    name: "Caster",
    items: [
      { id: "Mageblood", name: "Mageblood Potion", itemId: 20007 },
      { id: "GAE", name: "Greater Arcane Elixir", itemId: 13454 },
      { id: "MajorMana", name: "Major Mana Potion", itemId: 13444 },
      { id: "GFW", name: "Elixir of Greater Firepower", itemId: 21546 },
      { id: "GSP", name: "Elixir of Shadow Power", itemId: 9264 },
      { id: "GFrostP", name: "Elixir of Frost Power", itemId: 17708 },
      { id: "BrilliantManaOil", name: "Brilliant Mana Oil", itemId: 20748 },
      { id: "BrilliantWizardOil", name: "Brilliant Wizard Oil", itemId: 20749 }
    ]
  },
  "concoctions": {
    name: "Concoctions (Turtle WoW Custom)",
    items: [
      { id: "EmeraldMongoose", name: "Emerald Mongoose Concoction", itemId: 70231 },
      { id: "ArcaneGiant", name: "Arcane Giant Concoction", itemId: 70232 },
      { id: "Dreamwater", name: "Dreamwater", itemId: 70058 }
    ]
  },
  "flasks": {
    name: "Flasks (G-Bank Only - Static Pricing)",
    items: [
      { id: "Titans", name: "Flask of the Titans", itemId: 13510, staticPrice: 30 },
      { id: "Wisdom", name: "Flask of Distilled Wisdom", itemId: 13511, staticPrice: 20 },
      { id: "SupremePower", name: "Flask of Supreme Power", itemId: 13512, staticPrice: 20 },
      { id: "Chromatic", name: "Flask of Chromatic Resistance", itemId: 13513, staticPrice: 20 }
    ]
  }
};

// Load/save data functions
function loadJSON(file, defaultValue = {}) {
  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`Error loading ${file}:`, e);
  }
  return defaultValue;
}

function saveJSON(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${file}:`, e);
  }
}

// Load configuration
let botConfig = loadJSON(CONFIG_FILE, {
  discountPercent: DEFAULT_DISCOUNT,
  adminIds: [ADMIN_USER_ID],
  notifyOnOrder: true,
  notifyChannelId: ALCHEMY_CHANNEL_ID
});

// Load prices (AH prices from scanner)
let prices = loadJSON(PRICES_FILE, {});

// Load orders
let orders = loadJSON(ORDERS_FILE, []);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Helper: Check if user is admin
function isAdmin(userId) {
  return botConfig.adminIds.includes(userId);
}

// Helper: Calculate discounted price
function getDiscountedPrice(ahPrice) {
  if (!ahPrice || ahPrice === 0) return null;
  const discount = botConfig.discountPercent / 100;
  return Math.floor(ahPrice * (1 - discount));
}

// Helper: Format gold price
function formatGold(copper) {
  if (!copper) return 'N/A';
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const cop = copper % 100;
  let result = '';
  if (gold > 0) result += `${gold}g `;
  if (silver > 0) result += `${silver}s `;
  if (cop > 0 || result === '') result += `${cop}c`;
  return result.trim();
}

// Helper: Find item by ID or name
function findItem(query) {
  const q = query.toLowerCase();
  for (const [catKey, category] of Object.entries(ITEM_CATALOG)) {
    for (const item of category.items) {
      if (item.id.toLowerCase() === q || item.name.toLowerCase().includes(q)) {
        return { ...item, category: catKey, categoryName: category.name };
      }
    }
  }
  return null;
}

// Build prices embed for a category
function buildCategoryEmbed(categoryKey) {
  const category = ITEM_CATALOG[categoryKey];
  if (!category) return null;

  const embed = new EmbedBuilder()
    .setTitle(`${category.name}`)
    .setColor(categoryKey === 'flasks' ? 0xFFD700 : 0x00AE86)
    .setTimestamp();

  let description = '';
  for (const item of category.items) {
    let priceStr;
    if (item.staticPrice) {
      priceStr = `**${item.staticPrice}g** (G-Bank)`;
    } else {
      const ahPrice = prices[item.id]?.ahPrice;
      const discounted = getDiscountedPrice(ahPrice);
      if (discounted) {
        priceStr = `**${formatGold(discounted)}** (~~${formatGold(ahPrice)}~~ AH)`;
      } else {
        priceStr = '*Price not set*';
      }
    }
    description += `**${item.id}** - ${item.name}\n${priceStr}\n\n`;
  }

  embed.setDescription(description);
  embed.setFooter({ text: `${botConfig.discountPercent}% off AH prices | Use /order <item> <qty> to order` });

  return embed;
}

// Handle /prices command
async function handlePrices(interaction) {
  const category = interaction.options.getString('category');

  if (category) {
    const embed = buildCategoryEmbed(category);
    if (embed) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: 'Category not found.', ephemeral: true });
    }
  } else {
    // Show category selector
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('price_category_select')
          .setPlaceholder('Select a category')
          .addOptions(
            Object.entries(ITEM_CATALOG).map(([key, cat]) => ({
              label: cat.name,
              value: key,
              description: `${cat.items.length} items`
            }))
          )
      );

    await interaction.reply({
      content: 'Select a category to view prices:',
      components: [row]
    });
  }
}

// Handle /order command
async function handleOrder(interaction) {
  const itemQuery = interaction.options.getString('item');
  const quantity = interaction.options.getInteger('quantity') || 1;
  const notes = interaction.options.getString('notes') || '';

  const item = findItem(itemQuery);
  if (!item) {
    await interaction.reply({ content: `Item "${itemQuery}" not found. Use /prices to see available items.`, ephemeral: true });
    return;
  }

  let unitPrice;
  if (item.staticPrice) {
    unitPrice = item.staticPrice * 10000; // Convert gold to copper
  } else {
    const ahPrice = prices[item.id]?.ahPrice;
    unitPrice = getDiscountedPrice(ahPrice);
  }

  if (!unitPrice) {
    await interaction.reply({ content: `Price not available for ${item.name}. Please try again later.`, ephemeral: true });
    return;
  }

  const totalPrice = unitPrice * quantity;
  const order = {
    id: Date.now().toString(36),
    userId: interaction.user.id,
    username: interaction.user.username,
    itemId: item.id,
    itemName: item.name,
    quantity,
    unitPrice,
    totalPrice,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  saveJSON(ORDERS_FILE, orders);

  const embed = new EmbedBuilder()
    .setTitle('Order Placed!')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Order ID', value: order.id, inline: true },
      { name: 'Item', value: `${item.name} (${item.id})`, inline: true },
      { name: 'Quantity', value: quantity.toString(), inline: true },
      { name: 'Unit Price', value: formatGold(unitPrice), inline: true },
      { name: 'Total', value: formatGold(totalPrice), inline: true },
      { name: 'Status', value: 'Pending', inline: true }
    )
    .setFooter({ text: 'An alchemist will contact you soon!' })
    .setTimestamp();

  if (notes) {
    embed.addFields({ name: 'Notes', value: notes });
  }

  await interaction.reply({ embeds: [embed] });

  // Notify admins if enabled
  if (botConfig.notifyOnOrder && botConfig.notifyChannelId) {
    try {
      const channel = await client.channels.fetch(botConfig.notifyChannelId);
      const notifyEmbed = new EmbedBuilder()
        .setTitle('New Order Received!')
        .setColor(0xFFA500)
        .addFields(
          { name: 'From', value: `<@${order.userId}>`, inline: true },
          { name: 'Item', value: `${item.name} x${quantity}`, inline: true },
          { name: 'Total', value: formatGold(totalPrice), inline: true },
          { name: 'Order ID', value: order.id, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [notifyEmbed] });
    } catch (e) {
      console.error('Failed to send order notification:', e);
    }
  }
}

// Handle /admin command
async function handleAdmin(interaction) {
  if (!isAdmin(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'setdiscount': {
      const percent = interaction.options.getInteger('percent');
      botConfig.discountPercent = percent;
      saveJSON(CONFIG_FILE, botConfig);
      await interaction.reply({ content: `Discount set to ${percent}%`, ephemeral: true });
      break;
    }
    case 'setprice': {
      const itemQuery = interaction.options.getString('item');
      const priceGold = interaction.options.getNumber('price');
      const item = findItem(itemQuery);
      if (!item) {
        await interaction.reply({ content: `Item "${itemQuery}" not found.`, ephemeral: true });
        return;
      }
      prices[item.id] = { ahPrice: priceGold * 10000, updatedAt: new Date().toISOString(), source: 'manual' };
      saveJSON(PRICES_FILE, prices);
      await interaction.reply({ content: `Set AH price for ${item.name} to ${priceGold}g (shop price: ${formatGold(getDiscountedPrice(priceGold * 10000))})`, ephemeral: true });
      break;
    }
    case 'orders': {
      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length === 0) {
        await interaction.reply({ content: 'No pending orders.', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Pending Orders (${pendingOrders.length})`)
        .setColor(0x0099FF);

      for (const order of pendingOrders.slice(0, 10)) {
        embed.addFields({
          name: `#${order.id} - ${order.itemName} x${order.quantity}`,
          value: `From: <@${order.userId}>\nTotal: ${formatGold(order.totalPrice)}\nNotes: ${order.notes || 'None'}`
        });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
    case 'complete': {
      const orderId = interaction.options.getString('orderid');
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        await interaction.reply({ content: `Order ${orderId} not found.`, ephemeral: true });
        return;
      }
      orders[orderIndex].status = 'completed';
      orders[orderIndex].completedAt = new Date().toISOString();
      orders[orderIndex].completedBy = interaction.user.id;
      saveJSON(ORDERS_FILE, orders);
      await interaction.reply({ content: `Order ${orderId} marked as completed.`, ephemeral: true });
      break;
    }
    case 'addadmin': {
      const userId = interaction.options.getString('userid');
      if (!botConfig.adminIds.includes(userId)) {
        botConfig.adminIds.push(userId);
        saveJSON(CONFIG_FILE, botConfig);
      }
      await interaction.reply({ content: `Added <@${userId}> as admin.`, ephemeral: true });
      break;
    }
    case 'config': {
      const embed = new EmbedBuilder()
        .setTitle('Bot Configuration')
        .setColor(0x9B59B6)
        .addFields(
          { name: 'Discount', value: `${botConfig.discountPercent}%`, inline: true },
          { name: 'Notify on Order', value: botConfig.notifyOnOrder ? 'Yes' : 'No', inline: true },
          { name: 'Admins', value: botConfig.adminIds.map(id => `<@${id}>`).join(', ') }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
  }
}

// Handle interactions
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case 'prices':
          await handlePrices(interaction);
          break;
        case 'order':
          await handleOrder(interaction);
          break;
        case 'admin':
          await handleAdmin(interaction);
          break;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'price_category_select') {
        const embed = buildCategoryEmbed(interaction.values[0]);
        await interaction.update({ content: null, embeds: [embed], components: [] });
      }
    }
  } catch (error) {
    console.error('Interaction error:', error);
    const reply = { content: 'An error occurred processing your request.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving guild: ${GUILD_ID}`);
  console.log(`Alchemy channel: ${ALCHEMY_CHANNEL_ID}`);
  console.log(`Discount: ${botConfig.discountPercent}%`);
  console.log(`Admins: ${botConfig.adminIds.join(', ')}`);
});

// Login
client.login(TOKEN);

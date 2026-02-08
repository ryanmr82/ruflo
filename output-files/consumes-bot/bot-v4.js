import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '/home/opc/tbc-website/.env.consumes-bot' });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_BASE = 'http://localhost:8000/api/consumes';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Category info for dropdown
const CATEGORIES = {
  protection: { name: "Protection & Utility", count: 13 },
  melee: { name: "Tank & Melee", count: 9 },
  caster: { name: "Caster", count: 8 },
  concoctions: { name: "Concoctions (Turtle WoW)", count: 3 },
  flasks: { name: "Flasks (G-Bank Only)", count: 4 }
};

// Status emoji mapping
const STATUS_EMOJI = {
  pending: '⏳',
  processing: '🔧',
  completed: '✅',
  cancelled: '❌'
};

// API helper functions
async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`API GET ${endpoint} failed:`, e);
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`API POST ${endpoint} failed:`, e);
    return null;
  }
}

async function apiPatch(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`API PATCH ${endpoint} failed:`, e);
    return null;
  }
}

// Helper: Check if user is admin
async function isAdmin(userId) {
  const config = await apiGet('/config');
  return config?.adminIds?.includes(userId) || false;
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

// Helper: Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Build prices embed for a category
async function buildCategoryEmbed(categoryKey) {
  const data = await apiGet(`/prices?category=${categoryKey}`);
  if (!data) return null;

  const embed = new EmbedBuilder()
    .setTitle(data.name)
    .setColor(categoryKey === 'flasks' ? 0xFFD700 : 0x00AE86)
    .setTimestamp()
    .setFooter({ text: `${data.discountPercent}% off AH | /order <item> <qty> to order` });

  let description = '';
  for (const item of data.items) {
    let priceStr;
    if (item.isStatic) {
      priceStr = `**${item.staticPrice}g** (G-Bank)`;
    } else if (item.shopPrice) {
      priceStr = `**${formatGold(item.shopPrice)}** (~~${formatGold(item.ahPrice)}~~ AH)`;
    } else {
      priceStr = '*Price not set*';
    }
    // Truncate description for Discord embed
    const shortDesc = item.description.length > 60 ? item.description.substring(0, 57) + '...' : item.description;
    description += `**${item.id}** - ${item.name}\n${priceStr}\n*${shortDesc}*\n\n`;
  }

  embed.setDescription(description);
  return embed;
}

// Handle /prices command
async function handlePrices(interaction) {
  const category = interaction.options.getString('category');

  if (category) {
    const embed = await buildCategoryEmbed(category);
    if (embed) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: 'Failed to load prices. Please try again.', ephemeral: true });
    }
  } else {
    // Show category selector
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('price_category_select')
          .setPlaceholder('Select a category')
          .addOptions(
            Object.entries(CATEGORIES).map(([key, cat]) => ({
              label: cat.name,
              value: key,
              description: `${cat.count} alchemy items`
            }))
          )
      );

    await interaction.reply({
      content: '**Guild Alchemy Shop** - Select a category:',
      components: [row]
    });
  }
}

// Handle /order command
async function handleOrder(interaction) {
  const itemQuery = interaction.options.getString('item');
  const quantity = interaction.options.getInteger('quantity') || 1;
  const notes = interaction.options.getString('notes') || '';

  // Get item price from API
  const itemData = await apiGet(`/prices?item=${encodeURIComponent(itemQuery)}`);
  if (!itemData || itemData.error) {
    await interaction.reply({ content: `Item "${itemQuery}" not found. Use /prices to see available alchemy items.`, ephemeral: true });
    return;
  }

  if (!itemData.shopPrice) {
    await interaction.reply({ content: `Price not available for ${itemData.item.name}. Please try again later or ask an alchemist.`, ephemeral: true });
    return;
  }

  const totalPrice = itemData.shopPrice * quantity;

  // Create order via API
  const orderResult = await apiPost('/orders', {
    userId: interaction.user.id,
    username: interaction.user.username,
    itemId: itemData.item.id,
    itemName: itemData.item.name,
    quantity,
    unitPrice: itemData.shopPrice,
    totalPrice,
    notes
  });

  if (!orderResult || !orderResult.success) {
    await interaction.reply({ content: 'Failed to place order. Please try again.', ephemeral: true });
    return;
  }

  const order = orderResult.order;
  const embed = new EmbedBuilder()
    .setTitle('✅ Order Placed!')
    .setColor(0x00FF00)
    .setDescription(`*${itemData.item.description}*`)
    .addFields(
      { name: 'Order ID', value: order.id, inline: true },
      { name: 'Item', value: `${order.itemName} (${order.itemId})`, inline: true },
      { name: 'Quantity', value: quantity.toString(), inline: true },
      { name: 'Unit Price', value: formatGold(order.unitPrice), inline: true },
      { name: 'Total', value: formatGold(order.totalPrice), inline: true },
      { name: 'Status', value: `${STATUS_EMOJI.pending} Pending`, inline: true }
    )
    .setFooter({ text: 'Use /myorders to track your orders' })
    .setTimestamp();

  if (notes) {
    embed.addFields({ name: 'Notes', value: notes });
  }

  await interaction.reply({ embeds: [embed] });

  // Send notification to alchemy channel
  const config = await apiGet('/config');
  if (config?.notifyOnOrder && config?.notifyChannelId) {
    try {
      const channel = await client.channels.fetch(config.notifyChannelId);
      const notifyEmbed = new EmbedBuilder()
        .setTitle('📦 New Order Received!')
        .setColor(0xFFA500)
        .addFields(
          { name: 'From', value: `<@${order.userId}>`, inline: true },
          { name: 'Item', value: `${order.itemName} x${quantity}`, inline: true },
          { name: 'Total', value: formatGold(order.totalPrice), inline: true },
          { name: 'Order ID', value: order.id, inline: true }
        )
        .setTimestamp();

      if (notes) {
        notifyEmbed.addFields({ name: 'Notes', value: notes });
      }

      await channel.send({ embeds: [notifyEmbed] });
    } catch (e) {
      console.error('Failed to send order notification:', e);
    }
  }
}

// Handle /myorders command
async function handleMyOrders(interaction) {
  const statusFilter = interaction.options.getString('status') || 'all';

  // Get orders for this user
  let endpoint = `/orders?userId=${interaction.user.id}`;
  if (statusFilter !== 'all') {
    endpoint += `&status=${statusFilter}`;
  }

  const ordersData = await apiGet(endpoint);

  if (!ordersData || !ordersData.orders || ordersData.orders.length === 0) {
    await interaction.reply({
      content: statusFilter === 'all'
        ? 'You have no orders yet. Use `/order <item> <quantity>` to place one!'
        : `No ${statusFilter} orders found.`,
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📋 Your Orders ${statusFilter !== 'all' ? `(${statusFilter})` : ''}`)
    .setColor(0x0099FF)
    .setFooter({ text: `Showing ${ordersData.orders.length} order(s)` })
    .setTimestamp();

  let description = '';
  for (const order of ordersData.orders.slice(0, 10)) {
    const statusEmoji = STATUS_EMOJI[order.status] || '❓';
    description += `**#${order.id}** - ${order.itemName} x${order.quantity}\n`;
    description += `${statusEmoji} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | ${formatGold(order.totalPrice)}\n`;
    description += `*${formatDate(order.createdAt)}*\n\n`;
  }

  embed.setDescription(description);

  if (ordersData.orders.length > 10) {
    embed.addFields({ name: 'Note', value: `Showing first 10 of ${ordersData.orders.length} orders` });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Handle /admin command
async function handleAdmin(interaction) {
  if (!await isAdmin(interaction.user.id)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'setdiscount': {
      const percent = interaction.options.getInteger('percent');
      const result = await apiPost('/config', {
        discountPercent: percent,
        updatedBy: interaction.user.id
      });
      if (result?.success) {
        await interaction.reply({ content: `✅ Discount set to ${percent}%`, ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Failed to update discount.', ephemeral: true });
      }
      break;
    }
    case 'setprice': {
      const itemQuery = interaction.options.getString('item');
      const priceGold = interaction.options.getNumber('price');
      const result = await apiPost('/prices', {
        itemId: itemQuery,
        ahPrice: priceGold * 10000,
        source: 'discord',
        updatedBy: interaction.user.id
      });
      if (result?.success) {
        const config = await apiGet('/config');
        const discountedPrice = Math.floor(priceGold * 10000 * (1 - config.discountPercent / 100));
        await interaction.reply({ content: `✅ Set AH price for **${itemQuery}** to ${priceGold}g (shop price: ${formatGold(discountedPrice)})`, ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Failed to update price.', ephemeral: true });
      }
      break;
    }
    case 'orders': {
      const ordersData = await apiGet('/orders?status=pending');
      if (!ordersData || ordersData.orders.length === 0) {
        await interaction.reply({ content: '✅ No pending orders.', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`⏳ Pending Orders (${ordersData.orders.length})`)
        .setColor(0xFFA500);

      for (const order of ordersData.orders.slice(0, 10)) {
        embed.addFields({
          name: `#${order.id} - ${order.itemName} x${order.quantity}`,
          value: `From: <@${order.userId}>\nTotal: ${formatGold(order.totalPrice)}\nPlaced: ${formatDate(order.createdAt)}\nNotes: ${order.notes || 'None'}`
        });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
    case 'process': {
      const orderId = interaction.options.getString('orderid');
      const result = await apiPatch('/orders', {
        orderId,
        status: 'processing',
        processedBy: interaction.user.id
      });
      if (result?.success) {
        await interaction.reply({ content: `🔧 Order **${orderId}** marked as processing.`, ephemeral: true });

        // Notify user their order is being processed
        if (result.order?.userId) {
          try {
            const user = await client.users.fetch(result.order.userId);
            const dm = await user.createDM();
            await dm.send(`🔧 Your order **#${orderId}** (${result.order.itemName} x${result.order.quantity}) is now being processed!`);
          } catch (e) {
            console.error('Failed to DM user:', e);
          }
        }
      } else {
        await interaction.reply({ content: `❌ Order ${orderId} not found.`, ephemeral: true });
      }
      break;
    }
    case 'complete': {
      const orderId = interaction.options.getString('orderid');
      const result = await apiPatch('/orders', {
        orderId,
        status: 'completed',
        completedBy: interaction.user.id
      });
      if (result?.success) {
        await interaction.reply({ content: `✅ Order **${orderId}** marked as completed.`, ephemeral: true });

        // Notify user their order is complete
        if (result.order?.userId) {
          try {
            const user = await client.users.fetch(result.order.userId);
            const dm = await user.createDM();
            await dm.send(`✅ Your order **#${orderId}** (${result.order.itemName} x${result.order.quantity}) is ready! Contact the alchemist to arrange pickup.`);
          } catch (e) {
            console.error('Failed to DM user:', e);
          }
        }
      } else {
        await interaction.reply({ content: `❌ Order ${orderId} not found.`, ephemeral: true });
      }
      break;
    }
    case 'addadmin': {
      const userId = interaction.options.getString('userid');
      const result = await apiPatch('/config/admin', {
        userId,
        action: 'add',
        updatedBy: interaction.user.id
      });
      if (result?.success) {
        await interaction.reply({ content: `✅ Added <@${userId}> as admin.`, ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Failed to add admin.', ephemeral: true });
      }
      break;
    }
    case 'config': {
      const config = await apiGet('/config');
      if (!config) {
        await interaction.reply({ content: '❌ Failed to load config.', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Bot Configuration')
        .setColor(0x9B59B6)
        .addFields(
          { name: 'Discount', value: `${config.discountPercent}%`, inline: true },
          { name: 'Notify on Order', value: config.notifyOnOrder ? 'Yes' : 'No', inline: true },
          { name: 'Admins', value: config.adminIds.map(id => `<@${id}>`).join(', ') || 'None' }
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
        case 'myorders':
          await handleMyOrders(interaction);
          break;
        case 'admin':
          await handleAdmin(interaction);
          break;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'price_category_select') {
        const embed = await buildCategoryEmbed(interaction.values[0]);
        if (embed) {
          await interaction.update({ content: null, embeds: [embed], components: [] });
        }
      }
    }
  } catch (error) {
    console.error('Interaction error:', error);
    const reply = { content: '❌ An error occurred processing your request.', ephemeral: true };
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
  console.log(`API Base: ${API_BASE}`);
  console.log('Guild Alchemy Shop Bot v1.2 - With order tracking');
});

// Login
client.login(TOKEN);

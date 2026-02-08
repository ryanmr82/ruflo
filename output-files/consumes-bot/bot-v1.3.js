import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "dotenv";

config({ path: "/home/opc/tbc-website/.env.consumes-bot" });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_BASE = "http://localhost:8000/api/consumes";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const CATEGORIES = {
  protection: { name: "Protection & Utility", count: 13 },
  melee: { name: "Tank & Melee", count: 9 },
  caster: { name: "Caster", count: 8 },
  concoctions: { name: "Concoctions (Turtle WoW)", count: 3 },
  flasks: { name: "Flasks (G-Bank Only)", count: 4 }
};

const STATUS_EMOJI = { pending: "⏳", processing: "🔧", completed: "✅", cancelled: "❌" };

async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) { console.error(`API GET ${endpoint} failed:`, e); return null; }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) { console.error(`API POST ${endpoint} failed:`, e); return null; }
}

async function apiPatch(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) { console.error(`API PATCH ${endpoint} failed:`, e); return null; }
}

async function isAdmin(userId) {
  const cfg = await apiGet("/config");
  return cfg?.adminIds?.includes(userId) || false;
}

function formatGold(copper) {
  if (!copper) return "N/A";
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const cop = copper % 100;
  let result = "";
  if (gold > 0) result += `${gold}g `;
  if (silver > 0) result += `${silver}s `;
  if (cop > 0 || result === "") result += `${cop}c`;
  return result.trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function buildCategoryEmbed(categoryKey) {
  const data = await apiGet(`/prices?category=${categoryKey}`);
  if (!data) return null;
  const embed = new EmbedBuilder()
    .setTitle(data.name)
    .setColor(categoryKey === "flasks" ? 0xFFD700 : 0x00AE86)
    .setTimestamp()
    .setFooter({ text: `${data.discountPercent}% off AH | /order <item> <qty> to order` });
  let description = "";
  for (const item of data.items) {
    let priceStr;
    if (item.isStatic) priceStr = `**${item.staticPrice}g** (G-Bank)`;
    else if (item.shopPrice) priceStr = `**${formatGold(item.shopPrice)}** (~~${formatGold(item.ahPrice)}~~ AH)`;
    else priceStr = "*Price not set*";
    const shortDesc = item.description && item.description.length > 60 ? item.description.substring(0, 57) + "..." : (item.description || "");
    description += `**${item.id}** - ${item.name}\n${priceStr}\n*${shortDesc}*\n\n`;
  }
  embed.setDescription(description);
  return embed;
}

async function handlePrices(interaction) {
  const category = interaction.options.getString("category");
  if (category) {
    const embed = await buildCategoryEmbed(category);
    if (embed) await interaction.reply({ embeds: [embed] });
    else await interaction.reply({ content: "Failed to load prices.", ephemeral: true });
  } else {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("price_category_select")
        .setPlaceholder("Select a category")
        .addOptions(Object.entries(CATEGORIES).map(([key, cat]) => ({
          label: cat.name, value: key, description: `${cat.count} alchemy items`
        })))
    );
    await interaction.reply({ content: "**Guild Alchemy Shop** - Select a category:", components: [row] });
  }
}

async function handleOrder(interaction) {
  const itemQuery = interaction.options.getString("item");
  const quantity = interaction.options.getInteger("quantity") || 1;
  const notes = interaction.options.getString("notes") || "";

  const itemData = await apiGet(`/prices?item=${encodeURIComponent(itemQuery)}`);
  if (!itemData || itemData.error) {
    await interaction.reply({ content: `Item "${itemQuery}" not found.`, ephemeral: true });
    return;
  }
  if (!itemData.shopPrice) {
    await interaction.reply({ content: `Price not available for ${itemData.item.name}.`, ephemeral: true });
    return;
  }

  const totalPrice = itemData.shopPrice * quantity;
  const orderResult = await apiPost("/orders", {
    userId: interaction.user.id, username: interaction.user.username,
    itemId: itemData.item.id, itemName: itemData.item.name,
    quantity, unitPrice: itemData.shopPrice, totalPrice, notes
  });

  if (!orderResult || !orderResult.success) {
    await interaction.reply({ content: "Failed to place order.", ephemeral: true });
    return;
  }

  const order = orderResult.order;
  const embed = new EmbedBuilder()
    .setTitle("✅ Order Placed!")
    .setColor(0x00FF00)
    .setDescription(`*${itemData.item.description || ""}*`)
    .addFields(
      { name: "Order ID", value: order.id, inline: true },
      { name: "Item", value: `${order.itemName} (${order.itemId})`, inline: true },
      { name: "Quantity", value: quantity.toString(), inline: true },
      { name: "Unit Price", value: formatGold(order.unitPrice), inline: true },
      { name: "Total", value: formatGold(order.totalPrice), inline: true },
      { name: "Status", value: `${STATUS_EMOJI.pending} Pending`, inline: true }
    )
    .setFooter({ text: "Use /myorders to track your orders" })
    .setTimestamp();
  if (notes) embed.addFields({ name: "Notes", value: notes });
  await interaction.reply({ embeds: [embed] });

  // Notify alchemy channel with action buttons
  const cfg = await apiGet("/config");
  if (cfg?.notifyOnOrder && cfg?.notifyChannelId) {
    try {
      const channel = await client.channels.fetch(cfg.notifyChannelId);
      const notifyEmbed = new EmbedBuilder()
        .setTitle("📦 New Order Received!")
        .setColor(0xFFA500)
        .addFields(
          { name: "From", value: `<@${order.userId}>`, inline: true },
          { name: "Item", value: `${order.itemName} x${quantity}`, inline: true },
          { name: "Total", value: formatGold(order.totalPrice), inline: true },
          { name: "Order ID", value: order.id, inline: true },
          { name: "Status", value: "⏳ Pending", inline: true }
        )
        .setTimestamp();
      if (notes) notifyEmbed.addFields({ name: "Notes", value: notes });

      // Action buttons for alchemists
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claim_order_${order.id}`).setLabel("🔧 Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`fulfill_order_${order.id}`).setLabel("✅ Fulfilled").setStyle(ButtonStyle.Success)
      );
      await channel.send({ embeds: [notifyEmbed], components: [buttonRow] });
    } catch (e) { console.error("Failed to send notification:", e); }
  }
}

async function handleMyOrders(interaction) {
  const statusFilter = interaction.options.getString("status") || "all";
  let endpoint = `/orders?userId=${interaction.user.id}`;
  if (statusFilter !== "all") endpoint += `&status=${statusFilter}`;

  const ordersData = await apiGet(endpoint);
  if (!ordersData || !ordersData.orders || ordersData.orders.length === 0) {
    await interaction.reply({ content: statusFilter === "all" ? "You have no orders yet." : `No ${statusFilter} orders found.`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📋 Your Orders ${statusFilter !== "all" ? `(${statusFilter})` : ""}`)
    .setColor(0x0099FF)
    .setFooter({ text: `Showing ${ordersData.orders.length} order(s)` })
    .setTimestamp();

  let description = "";
  for (const order of ordersData.orders.slice(0, 10)) {
    const statusEmoji = STATUS_EMOJI[order.status] || "❓";
    description += `**#${order.id}** - ${order.itemName} x${order.quantity}\n`;
    description += `${statusEmoji} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | ${formatGold(order.totalPrice)}\n`;
    description += `*${formatDate(order.createdAt)}*\n\n`;
  }
  embed.setDescription(description);
  if (ordersData.orders.length > 10) embed.addFields({ name: "Note", value: `Showing first 10 of ${ordersData.orders.length} orders` });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleAdmin(interaction) {
  if (!await isAdmin(interaction.user.id)) {
    await interaction.reply({ content: "You do not have permission.", ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case "setdiscount": {
      const percent = interaction.options.getInteger("percent");
      const result = await apiPost("/config", { discountPercent: percent, updatedBy: interaction.user.id });
      await interaction.reply({ content: result?.success ? `✅ Discount set to ${percent}%` : "❌ Failed.", ephemeral: true });
      break;
    }
    case "setprice": {
      const itemQuery = interaction.options.getString("item");
      const priceGold = interaction.options.getNumber("price");
      const result = await apiPost("/prices", { itemId: itemQuery, ahPrice: priceGold * 10000, source: "discord", updatedBy: interaction.user.id });
      if (result?.success) {
        const cfg = await apiGet("/config");
        const discounted = Math.floor(priceGold * 10000 * (1 - cfg.discountPercent / 100));
        await interaction.reply({ content: `✅ Set ${itemQuery} to ${priceGold}g (shop: ${formatGold(discounted)})`, ephemeral: true });
      } else await interaction.reply({ content: "❌ Failed.", ephemeral: true });
      break;
    }
    case "orders": {
      const ordersData = await apiGet("/orders?status=pending");
      if (!ordersData || ordersData.orders.length === 0) {
        await interaction.reply({ content: "✅ No pending orders.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder().setTitle(`⏳ Pending Orders (${ordersData.orders.length})`).setColor(0xFFA500);
      for (const order of ordersData.orders.slice(0, 10)) {
        embed.addFields({ name: `#${order.id} - ${order.itemName} x${order.quantity}`, value: `From: <@${order.userId}>\nTotal: ${formatGold(order.totalPrice)}\nNotes: ${order.notes || "None"}` });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
    case "process": {
      const orderId = interaction.options.getString("orderid");
      const result = await apiPatch("/orders", { orderId, status: "processing", processedBy: interaction.user.id });
      await interaction.reply({ content: result?.success ? `🔧 Order ${orderId} processing.` : "❌ Not found.", ephemeral: true });
      if (result?.order?.userId) {
        try {
          const user = await client.users.fetch(result.order.userId);
          await (await user.createDM()).send(`🔧 Your order **#${orderId}** is being processed!`);
        } catch (e) {}
      }
      break;
    }
    case "complete": {
      const orderId = interaction.options.getString("orderid");
      const result = await apiPatch("/orders", { orderId, status: "completed", completedBy: interaction.user.id });
      await interaction.reply({ content: result?.success ? `✅ Order ${orderId} completed.` : "❌ Not found.", ephemeral: true });
      if (result?.order?.userId) {
        try {
          const user = await client.users.fetch(result.order.userId);
          await (await user.createDM()).send(`✅ Your order **#${orderId}** is ready!`);
        } catch (e) {}
      }
      break;
    }
    case "addadmin": {
      const userId = interaction.options.getString("userid");
      const result = await apiPatch("/config/admin", { userId, action: "add", updatedBy: interaction.user.id });
      await interaction.reply({ content: result?.success ? `✅ Added <@${userId}> as admin.` : "❌ Failed.", ephemeral: true });
      break;
    }
    case "config": {
      const cfg = await apiGet("/config");
      if (!cfg) { await interaction.reply({ content: "❌ Failed.", ephemeral: true }); return; }
      const embed = new EmbedBuilder()
        .setTitle("⚙️ Bot Configuration")
        .setColor(0x9B59B6)
        .addFields(
          { name: "Discount", value: `${cfg.discountPercent}%`, inline: true },
          { name: "Notify", value: cfg.notifyOnOrder ? "Yes" : "No", inline: true },
          { name: "Admins", value: cfg.adminIds.map(id => `<@${id}>`).join(", ") || "None" }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
  }
}

// Button handler for order fulfillment
async function handleOrderButton(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith("claim_order_")) {
    const orderId = customId.replace("claim_order_", "");
    const result = await apiPatch("/orders", { orderId, status: "processing", processedBy: interaction.user.id });

    if (result?.success) {
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed).setColor(0x3498DB).setTitle("🔧 Order Claimed!");
      const fields = [...originalEmbed.fields];
      const statusIdx = fields.findIndex(f => f.name === "Status");
      if (statusIdx >= 0) fields[statusIdx] = { name: "Status", value: `🔧 Claimed by <@${interaction.user.id}>`, inline: true };
      updatedEmbed.setFields(fields);

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claim_order_${orderId}`).setLabel("🔧 Claimed").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`fulfill_order_${orderId}`).setLabel("✅ Fulfilled").setStyle(ButtonStyle.Success)
      );
      await interaction.update({ embeds: [updatedEmbed], components: [buttonRow] });

      if (result.order?.userId) {
        try {
          const user = await client.users.fetch(result.order.userId);
          await (await user.createDM()).send(`🔧 Your order **#${orderId}** (${result.order.itemName} x${result.order.quantity}) has been claimed by an alchemist!`);
        } catch (e) {}
      }
    } else {
      await interaction.reply({ content: "❌ Failed to claim order.", ephemeral: true });
    }
  } else if (customId.startsWith("fulfill_order_")) {
    const orderId = customId.replace("fulfill_order_", "");
    const result = await apiPatch("/orders", { orderId, status: "completed", completedBy: interaction.user.id });

    if (result?.success) {
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed).setColor(0x2ECC71).setTitle("✅ Order Fulfilled!");
      const fields = [...originalEmbed.fields];
      const statusIdx = fields.findIndex(f => f.name === "Status");
      if (statusIdx >= 0) fields[statusIdx] = { name: "Status", value: `✅ Fulfilled by <@${interaction.user.id}>`, inline: true };
      updatedEmbed.setFields(fields);

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claim_order_${orderId}`).setLabel("🔧 Claimed").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`fulfill_order_${orderId}`).setLabel("✅ Fulfilled").setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      await interaction.update({ embeds: [updatedEmbed], components: [buttonRow] });

      if (result.order?.userId) {
        try {
          const user = await client.users.fetch(result.order.userId);
          await (await user.createDM()).send(`✅ Your order **#${orderId}** (${result.order.itemName} x${result.order.quantity}) is ready! Contact <@${interaction.user.id}> to pickup.`);
        } catch (e) {}
      }
    } else {
      await interaction.reply({ content: "❌ Failed to fulfill order.", ephemeral: true });
    }
  }
}

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "prices": await handlePrices(interaction); break;
        case "order": await handleOrder(interaction); break;
        case "myorders": await handleMyOrders(interaction); break;
        case "admin": await handleAdmin(interaction); break;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "price_category_select") {
        const embed = await buildCategoryEmbed(interaction.values[0]);
        if (embed) await interaction.update({ content: null, embeds: [embed], components: [] });
      }
    } else if (interaction.isButton()) {
      await handleOrderButton(interaction);
    }
  } catch (error) {
    console.error("Interaction error:", error);
    const reply = { content: "❌ An error occurred.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Guild: ${GUILD_ID}`);
  console.log("Guild Alchemy Shop Bot v1.3 - With order fulfillment buttons");
});

client.login(TOKEN);

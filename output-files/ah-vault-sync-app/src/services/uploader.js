const axios = require('axios');

class Uploader {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async testConnection() {
    const response = await this.client.get('/api/guild-storage/combined', { timeout: 5000 });
    return { status: 'ok', serverReachable: true };
  }

  async uploadPrices(data) {
    const response = await this.client.put('/api/consumes/prices', {
      prices: data.prices,
      scanTime: data.scanTime,
      itemCount: data.itemCount
    });
    return response.data;
  }

  async uploadGuildBank(data) {
    const response = await this.client.put('/api/guild-bank/inventory', {
      exportVersion: data.exportVersion,
      scanTime: data.scanTime,
      guildName: data.guildName,
      tabs: data.tabs,
      summary: data.summary,
      totalItems: data.totalItems,
      uniqueItems: data.uniqueItems
    });
    return response.data;
  }

  async uploadBankAlt(data) {
    const response = await this.client.put('/api/bank-alts/inventory', {
      account: data.account,
      exportVersion: data.exportVersion,
      scanTime: data.scanTime,
      characters: data.characters,
      totalItems: data.totalItems
    });
    return response.data;
  }

  async deleteBankAlt(account) {
    const response = await this.client.delete('/api/bank-alts/inventory', {
      params: { account }
    });
    return response.data;
  }
}

module.exports = Uploader;

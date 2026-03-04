const axios = require('axios');
const https = require('https');

class Uploader {
  constructor(serverUrl, fallbackUrl) {
    this.serverUrl = serverUrl;
    this.fallbackUrl = fallbackUrl || null;
    // Allow self-signed cert when hitting IP fallback directly
    this.agent = new https.Agent({ rejectUnauthorized: false });
    this.client = this._createClient(serverUrl);
    this._usingFallback = false;
  }

  _createClient(baseURL) {
    // When falling back to IP, include the real Host header so the server routes correctly
    const hostname = new URL(this.serverUrl).hostname;
    return axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json', 'Host': hostname },
      httpsAgent: this.agent,
    });
  }

  async _request(method, url, data, opts) {
    try {
      const response = await this.client[method](url, data, opts);
      return response;
    } catch (err) {
      // If DNS fails and we have a fallback IP, switch to it
      if (this.fallbackUrl && !this._usingFallback &&
          err.code && (err.code === 'EAI_AGAIN' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT')) {
        console.log(`DNS failed for ${this.serverUrl}, falling back to ${this.fallbackUrl}`);
        this.client = this._createClient(this.fallbackUrl);
        this._usingFallback = true;
        const response = await this.client[method](url, data, opts);
        return response;
      }
      throw err;
    }
  }

  async testConnection() {
    const response = await this._request('get', '/api/guild-storage/combined', { timeout: 5000 });
    return { status: 'ok', serverReachable: true };
  }

  async uploadPrices(data) {
    const response = await this._request('put', '/api/consumes/prices', {
      prices: data.prices,
      scanTime: data.scanTime,
      itemCount: data.itemCount,
      source: 'GuildShopSync-addon'
    });
    return response.data;
  }

  async uploadGuildBank(data) {
    const response = await this._request('put', '/api/guild-bank/inventory', {
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
    const response = await this._request('put', '/api/bank-alts/inventory', {
      account: data.account,
      exportVersion: data.exportVersion,
      scanTime: data.scanTime,
      characters: data.characters,
      totalItems: data.totalItems
    });
    return response.data;
  }

  async deleteBankAlt(account) {
    const response = await this._request('delete', '/api/bank-alts/inventory', {
      params: { account }
    });
    return response.data;
  }

  async uploadGuildGrowth(data) {
    const response = await this._request('put', '/api/guild-growth', data);
    return response.data;
  }
}

module.exports = Uploader;

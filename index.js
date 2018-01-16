const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');
const isEmpty = require('lodash/isEmpty');

const BASE_URL = 'https://api.kucoin.com/v1';

class Kucoin {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 1000,
    });
  }

  rawRequest(method, endpoint, signed = false, params = {}) {
    const path = endpoint;
    const nonce = new Date().getTime();
    const isParamsEmpty = isEmpty(params);
    const queryString = isParamsEmpty ? '' : qs.stringify(params);

    const options = {
      url: `${path}${isParamsEmpty ? '' : `?${queryString}`}`,
      headers: {},
      method,
    };

    if (signed) {
      options.headers = {
        'KC-API-KEY': this.apiKey,
        'KC-API-NONCE': nonce,
        'KC-API-SIGNATURE': this.getSignature(path, queryString, nonce),
      };
    }

    return this.client(options);
  }

  getSignature(path, queryString, nonce) {
    const strForSign = `${path}/${nonce}/${queryString}`;
    const signatureStr = Buffer.from(strForSign).toString('base64');
    const signatureResult = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureStr)
      .digest('hex');

    return signatureResult;
  }

  request(method, endpoint, params) {
    return this.rawRequest(method, endpoint, false, params);
  }

  signedRequest(method, endpoint, params) {
    return this.rawRequest(method, endpoint, true, params);
  }

  getExchangeRates(params = {}) {
    const coins = params.symbols ? params.symbols.join(',') : '';

    return this.request('get', '/open/currencies', { ...params, coins });
  }

  getLanguages() {
    return this.request('get', '/open/lang-list');
  }

  changeLanguage(params = {}) {
    return this.signedRequest('post', '/user/change-lang', params);
  }

  getUserInfo() {
    return this.signedRequest('get', '/user/info');
  }

  getInviteCount() {
    return this.signedRequest('get', '/referrer/descendant/count');
  }

  getPromotionRewardInfo(params = {}) {
    const coin = params.symbol ? params.symbol : '';

    return this.signedRequest(
      'get',
      `/account/${params.symbol !== undefined ? `${params.symbol}/` : ''}promotion/info`,
      { ...params, coin },
    );
  }

  getPromotionRewardSummary(params = {}) {
    return this.signedRequest(
      'get',
      `/account/${params.symbol !== undefined ? `${params.symbol}/` : ''}promotion/sum`,
    );
  }

  getDepositAddress(params = {}) {
    return this.signedRequest(
      'get',
      `/account/${params.symbol}/wallet/address`,
    );
  }

  createWithdrawal(params = {}) {
    const coin = params.symbol;

    return this.signedRequest(
      'post',
      `/account/${params.symbol}/withdraw/apply`,
      { ...params, coin },
    );
  }

  cancelWithdrawal(params = {}) {
    return this.signedRequest(
      'post',
      `/account/${params.symbol}/withdraw/cancel`,
      params,
    );
  }

  getDepositAndWithdrawalRecords(params = {}) {
    return this.signedRequest(
      'get',
      `/account/${params.symbol}/wallet/records`,
      params,
    );
  }

  getBalance(params = {}) {
    return this.signedRequest(
      'get',
      `/account/${params.symbol ? `${params.symbol}/` : ''}balance`,
    );
  }

  createOrder(params = {}) {
    const symbol = params.pair;

    return this.signedRequest('post', '/order', { ...params, symbol });
  }

  getActiveOrders(params = {}) {
    const symbol = params.pair;
    return this.signedRequest('get', `/${params.pair}/order/active`, {
      ...params,
      symbol,
    });
  }

  cancelOrder(params = {}) {
    const symbol = params.pair;

    return this.signedRequest('post', '/cancel-order', { ...params, symbol });
  }

  getDealtOrders(params = {}) {
    const symbol = params.pair;

    return this.signedRequest('get', `/${params.pair}/deal-orders`, {
      ...params,
      symbol,
    });
  }

  getTicker(params = {}) {
    return this.request('get', `/${params.pair}/open/tick`);
  }

  getOrderBooks(params = {}) {
    const symbol = params.pair;

    return this.request(
      'get',
      `/${params.pair}/open/orders${params.type ? `-${params.type.toLowerCase()}` : ''}`,
      { ...params, symbol },
    );
  }

  getRecentlyDealtOrders(params = {}) {
    return this.request('get', `/${params.pair}/open/deal-orders`, params);
  }

  getTradingSymbols() {
    return this.request('get', '/market/open/symbols');
  }

  getTrending() {
    return this.request('get', '/market/open/coins-trending');
  }

  getCoins() {
    return this.request('get', '/market/open/coins-list');
  }
}

module.exports = Kucoin;

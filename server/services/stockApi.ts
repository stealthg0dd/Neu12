interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
  companyName?: string;
}

interface StockNews {
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  url?: string;
}

class StockApiService {
  private baseUrl = 'https://api.polygon.io/v2';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || process.env.STOCK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('No stock API key provided. Using fallback mock data for development.');
    }
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    if (!this.apiKey) {
      return this.getMockQuote(symbol);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      const result = data.results[0];
      const price = result.c; // Close price
      const previousClose = result.o; // Open price as proxy for previous close
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol,
        price,
        change,
        changePercent,
        volume: result.v,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return this.getMockQuote(symbol);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes = await Promise.all(
      symbols.map(symbol => this.getQuote(symbol))
    );
    return quotes.filter(quote => quote !== null) as StockQuote[];
  }

  async getCompanyInfo(symbol: string): Promise<{ name: string; sector: string } | null> {
    if (!this.apiKey) {
      return this.getMockCompanyInfo(symbol);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/reference/tickers/${symbol}?apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        name: data.results?.name || symbol,
        sector: data.results?.sic_description || 'Unknown',
      };
    } catch (error) {
      console.error(`Error fetching company info for ${symbol}:`, error);
      return this.getMockCompanyInfo(symbol);
    }
  }

  async getMarketNews(limit: number = 20): Promise<StockNews[]> {
    if (!this.apiKey) {
      return this.getMockNews();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/reference/news?limit=${limit}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.results?.map((article: any) => ({
        headline: article.title,
        summary: article.description || article.title,
        source: article.publisher?.name || 'Unknown',
        publishedAt: article.published_utc,
        symbols: article.tickers || [],
        url: article.article_url,
      })) || [];
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getMockNews();
    }
  }

  private getMockQuote(symbol: string): StockQuote {
    const mockPrices: Record<string, number> = {
      'AAPL': 175.84,
      'TSLA': 245.67,
      'MSFT': 378.95,
      'NVDA': 487.23,
      'GOOGL': 142.89,
      'AMD': 156.78,
    };

    const basePrice = mockPrices[symbol] || 100 + Math.random() * 200;
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const change = basePrice * (changePercent / 100);

    return {
      symbol,
      price: Number((basePrice + change).toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
    };
  }

  private getMockCompanyInfo(symbol: string): { name: string; sector: string } {
    const mockCompanies: Record<string, { name: string; sector: string }> = {
      'AAPL': { name: 'Apple Inc.', sector: 'Technology' },
      'TSLA': { name: 'Tesla Inc.', sector: 'Automotive' },
      'MSFT': { name: 'Microsoft Corp.', sector: 'Technology' },
      'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology' },
      'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology' },
      'AMD': { name: 'Advanced Micro Devices', sector: 'Technology' },
    };

    return mockCompanies[symbol] || { name: `${symbol} Corp.`, sector: 'Unknown' };
  }

  private getMockNews(): StockNews[] {
    return [
      {
        headline: 'Apple Reports Strong Q4 Earnings, Beats Revenue Expectations',
        summary: 'Apple Inc. reported better-than-expected quarterly results driven by strong iPhone sales and services revenue growth.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        symbols: ['AAPL'],
      },
      {
        headline: 'Tesla Faces Production Challenges in Shanghai Facility',
        summary: 'Tesla\'s Shanghai Gigafactory is experiencing temporary production slowdowns due to supply chain disruptions.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        symbols: ['TSLA'],
      },
      {
        headline: 'NVIDIA Announces New AI Chip Architecture with 40% Performance Boost',
        summary: 'NVIDIA unveiled its next-generation AI processor architecture promising significant improvements in machine learning workloads.',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        symbols: ['NVDA'],
      },
    ];
  }
}

export const stockApi = new StockApiService();

import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import config from '../config/index.js';

class UsageAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.usageLimit = 2000000; // 2M tokens for free tier
  }

  /**
   * Get usage overview for all accounts
   */
  async getUsageOverview() {
    const cacheKey = 'usage-overview';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Returning cached usage overview');
        return cached.data;
      }
    }

    try {
      console.log('Calculating usage overview from CSV files');
      const csvFiles = await this.scanDownloadFolder();
      const allAccountsData = [];

      for (const filePath of csvFiles) {
        const email = path.basename(filePath, '.csv');
        console.log(`Processing CSV file for ${email}:`, filePath);
        const records = await this.parseCsvFile(filePath);
        console.log(`Parsed ${records.length} records for ${email}`);
        const analytics = this.calculateAccountMetrics(records, email);
        console.log(`Analytics for ${email}:`, analytics);
        allAccountsData.push(analytics);
      }

      // Sort by usage descending
      allAccountsData.sort((a, b) => b.totalTokens30d - a.totalTokens30d);

      const overview = {
        totalAccounts: allAccountsData.length,
        totalTokens30d: allAccountsData.reduce((sum, acc) => sum + acc.totalTokens30d, 0),
        totalCost30d: allAccountsData.reduce((sum, acc) => sum + acc.totalCost30d, 0),
        averageUsagePerAccount: allAccountsData.length > 0 
          ? allAccountsData.reduce((sum, acc) => sum + acc.totalTokens30d, 0) / allAccountsData.length 
          : 0,
        highRiskAccounts: allAccountsData.filter(acc => acc.riskLevel === 'high' || acc.riskLevel === 'critical').length,
        accounts: allAccountsData
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: overview,
        timestamp: Date.now()
      });

      console.log(`Usage overview calculated for ${overview.totalAccounts} accounts`);
      return overview;
    } catch (error) {
      console.error('Error calculating usage overview:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific account
   */
  async getAccountAnalytics(email) {
    const cacheKey = `account-${email}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`Returning cached analytics for ${email}`);
        return cached.data;
      }
    }

    try {
      const filePath = path.join(config.paths.download, `${email}.csv`);
      const records = await this.parseCsvFile(filePath);
      const analytics = this.calculateAccountMetrics(records, email);

      // Cache the result
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      console.log(`Analytics calculated for account: ${email}`);
      return analytics;
    } catch (error) {
      console.error(`Error calculating analytics for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Refresh all analytics data (clear cache)
   */
  async refreshAnalytics() {
    console.log('Refreshing analytics data - clearing cache');
    this.cache.clear();
    return await this.getUsageOverview();
  }

  /**
   * Scan download folder for CSV files
   */
  async scanDownloadFolder() {
    try {
      console.log('Scanning download folder:', config.paths.download);
      const files = await fs.readdir(config.paths.download);
      console.log('All files found:', files);
      const csvFiles = files
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(config.paths.download, file));
      
      console.log(`Found ${csvFiles.length} CSV files in download folder:`, csvFiles);
      return csvFiles;
    } catch (error) {
      console.error('Error scanning download folder:', error);
      return [];
    }
  }

  /**
   * Parse CSV file and return usage records
   */
  async parseCsvFile(filePath) {
    return new Promise((resolve, reject) => {
      const records = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Parse the CSV row
            const record = {
              date: new Date(row.Date),
              kind: row.Kind,
              model: row.Model,
              maxMode: row['Max Mode'],
              inputWithCache: parseInt(row['Input (w/ Cache Write)']) || 0,
              inputWithoutCache: parseInt(row['Input (w/o Cache Write)']) || 0,
              cacheRead: parseInt(row['Cache Read']) || 0,
              outputTokens: parseInt(row['Output Tokens']) || 0,
              totalTokens: parseInt(row['Total Tokens']) || 0,
              cost: parseFloat(row.Cost) || 0
            };

            // Only include records from last 30 days
            if (record.date >= thirtyDaysAgo && record.date <= new Date()) {
              records.push(record);
            }
          } catch (error) {
            console.warn(`Error parsing CSV row in ${filePath}:`, error);
          }
        })
        .on('end', () => {
          console.log(`Parsed ${records.length} records from ${path.basename(filePath)}`);
          resolve(records);
        })
        .on('error', (error) => {
          console.error(`Error reading CSV file ${filePath}:`, error);
          reject(error);
        });
    });
  }

  /**
   * Calculate analytics metrics for an account
   */
  calculateAccountMetrics(records, email) {
    if (records.length === 0) {
      return {
        email,
        totalTokens30d: 0,
        totalCost30d: 0,
        usagePercentage: 0,
        averageCostPerDay: 0,
        mostActiveDay: null,
        tokenEfficiency: 0,
        usageTrend: 'stable',
        daysUntilLimit: Infinity,
        riskLevel: 'low',
        dailyUsage: []
      };
    }

    // Calculate basic metrics
    const totalTokens30d = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost30d = records.reduce((sum, r) => sum + r.cost, 0);
    const usagePercentage = (totalTokens30d / this.usageLimit) * 100;

    // Calculate daily usage
    const dailyUsage = this.calculateDailyUsage(records);
    const averageCostPerDay = totalCost30d / 30;

    // Find most active day
    const mostActiveDay = dailyUsage.length > 0 
      ? dailyUsage.reduce((max, day) => day.totalTokens > max.totalTokens ? day : max).date
      : null;

    // Calculate token efficiency (Output/Input ratio)
    const totalInput = records.reduce((sum, r) => sum + r.inputWithCache + r.inputWithoutCache, 0);
    const totalOutput = records.reduce((sum, r) => sum + r.outputTokens, 0);
    const tokenEfficiency = totalInput > 0 ? totalOutput / totalInput : 0;

    // Calculate usage trend
    const usageTrend = this.calculateUsageTrend(dailyUsage);

    // Estimate days until limit
    const daysUntilLimit = this.estimateDaysUntilLimit(dailyUsage, totalTokens30d);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(usagePercentage);

    return {
      email,
      totalTokens30d,
      totalCost30d,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      averageCostPerDay: Math.round(averageCostPerDay * 100) / 100,
      mostActiveDay,
      tokenEfficiency: Math.round(tokenEfficiency * 100) / 100,
      usageTrend,
      daysUntilLimit,
      riskLevel,
      dailyUsage
    };
  }

  /**
   * Calculate daily usage breakdown
   */
  calculateDailyUsage(records) {
    const dailyMap = new Map();

    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          totalTokens: 0,
          cost: 0,
          sessions: 0
        });
      }

      const day = dailyMap.get(dateKey);
      day.totalTokens += record.totalTokens;
      day.cost += record.cost;
      day.sessions += 1;
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate usage trend (comparing recent vs previous period)
   */
  calculateUsageTrend(dailyUsage) {
    if (dailyUsage.length < 14) {
      return 'stable';
    }

    const midPoint = Math.floor(dailyUsage.length / 2);
    const recentPeriod = dailyUsage.slice(midPoint);
    const previousPeriod = dailyUsage.slice(0, midPoint);

    const recentAvg = recentPeriod.reduce((sum, day) => sum + day.totalTokens, 0) / recentPeriod.length;
    const previousAvg = previousPeriod.reduce((sum, day) => sum + day.totalTokens, 0) / previousPeriod.length;

    if (previousAvg === 0) return 'stable';

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (changePercent > 20) return 'increasing';
    if (changePercent < -20) return 'decreasing';
    return 'stable';
  }

  /**
   * Estimate days until hitting usage limit
   */
  estimateDaysUntilLimit(dailyUsage, totalTokens30d) {
    if (totalTokens30d >= this.usageLimit) {
      return 0;
    }

    const remainingTokens = this.usageLimit - totalTokens30d;
    
    if (dailyUsage.length === 0) {
      return Infinity;
    }

    // Calculate average daily usage from recent period
    const recentDays = dailyUsage.slice(-7); // Last 7 days
    const avgDailyUsage = recentDays.reduce((sum, day) => sum + day.totalTokens, 0) / recentDays.length;

    if (avgDailyUsage <= 0) {
      return Infinity;
    }

    return Math.floor(remainingTokens / avgDailyUsage);
  }

  /**
   * Determine risk level based on usage percentage
   */
  determineRiskLevel(usagePercentage) {
    if (usagePercentage >= 95) return 'critical';
    if (usagePercentage >= 80) return 'high';
    if (usagePercentage >= 60) return 'medium';
    return 'low';
  }
}

export default new UsageAnalyticsService();

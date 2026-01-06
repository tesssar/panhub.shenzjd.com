import { MemoryCache } from '../cache/memoryCache';

export interface HotSearchItem {
  term: string;
  score: number;
}

export interface HotSearchStats {
  total: number;
  topTerms: HotSearchItem[];
}

export class HotSearchService {
  private cache: MemoryCache<HotSearchItem[]>;
  private readonly CACHE_KEY = 'hot-searches';
  private readonly MAX_ENTRIES = 50;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

  constructor() {
    this.cache = new MemoryCache<HotSearchItem[]>({
      maxSize: 10,
      maxMemoryBytes: 5 * 1024 * 1024, // 5MB
      cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
    });
  }

  /**
   * 记录搜索词（增加分数）
   */
  async recordSearch(term: string): Promise<void> {
    if (!term || term.trim().length === 0) return;

    // 违规词检查（这里可以集成现有的过滤系统）
    if (await this.isForbidden(term)) {
      console.log(`[HotSearchService] 搜索词包含违规内容: ${term}`);
      return;
    }

    // 获取当前热搜列表
    const current = this.cache.get(this.CACHE_KEY);
    let searches: HotSearchItem[] = current.hit ? [...current.value] : [];

    // 查找是否已存在
    const existing = searches.find(s => s.term === term);
    if (existing) {
      existing.score += 1;
    } else {
      searches.push({ term, score: 1 });
    }

    // 按分数降序排序
    searches.sort((a, b) => b.score - a.score);

    // 限制数量并淘汰低分词
    if (searches.length > this.MAX_ENTRIES) {
      searches = searches.slice(0, this.MAX_ENTRIES);
    }

    // 保存到缓存
    this.cache.set(this.CACHE_KEY, searches, this.CACHE_TTL);

    console.log(`[HotSearchService] 记录搜索词: "${term}" (score: ${existing ? existing.score : 1})`);
  }

  /**
   * 获取热搜列表
   */
  async getHotSearches(limit: number = 30): Promise<HotSearchItem[]> {
    const result = this.cache.get(this.CACHE_KEY);
    if (!result.hit || !result.value) {
      return [];
    }
    return result.value.slice(0, Math.min(limit, 50));
  }

  /**
   * 清除所有热搜记录（需要密码验证）
   */
  async clearHotSearches(password: string): Promise<{ success: boolean; message: string }> {
    // 简单的密码验证（实际项目中应该使用环境变量）
    const correctPassword = process.env.HOT_SEARCH_PASSWORD || 'admin123';

    if (password !== correctPassword) {
      return { success: false, message: '密码错误' };
    }

    this.cache.delete(this.CACHE_KEY);
    console.log('[HotSearchService] 所有热搜记录已清除');
    return { success: true, message: '热搜记录已清除' };
  }

  /**
   * 删除指定热搜词
   */
  async deleteHotSearch(term: string, password: string): Promise<{ success: boolean; message: string }> {
    const correctPassword = process.env.HOT_SEARCH_PASSWORD || 'admin123';

    if (password !== correctPassword) {
      return { success: false, message: '密码错误' };
    }

    const result = this.cache.get(this.CACHE_KEY);
    if (!result.hit || !result.value) {
      return { success: false, message: '没有找到热搜记录' };
    }

    const searches = result.value.filter(s => s.term !== term);
    this.cache.set(this.CACHE_KEY, searches, this.CACHE_TTL);

    console.log(`[HotSearchService] 删除热搜词: "${term}"`);
    return { success: true, message: `热搜词 "${term}" 已删除` };
  }

  /**
   * 获取热搜统计信息
   */
  async getStats(): Promise<HotSearchStats> {
    const result = this.cache.get(this.CACHE_KEY);
    const topTerms = result.hit ? result.value.slice(0, 10) : [];

    return {
      total: result.hit ? result.value.length : 0,
      topTerms,
    };
  }

  /**
   * 违规词检查（简化版，可扩展）
   */
  private async isForbidden(term: string): Promise<boolean> {
    // 简单的敏感词过滤
    const forbiddenPatterns = [
      /政治|暴力|色情|赌博|毒品/i,
      /fuck|shit|bitch/i,
    ];

    return forbiddenPatterns.some(pattern => pattern.test(term));
  }

  /**
   * 手动触发缓存清理（用于测试或紧急情况）
   */
  forceCleanup(): void {
    this.cache.forceCleanup();
  }
}

// 单例模式
let singleton: HotSearchService | undefined;

export function getOrCreateHotSearchService(): HotSearchService {
  if (!singleton) {
    singleton = new HotSearchService();
  }
  return singleton;
}

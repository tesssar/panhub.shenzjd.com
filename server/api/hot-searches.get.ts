import { defineEventHandler, getQuery } from 'h3';
import { getOrCreateHotSearchSQLiteService } from '../core/services/hotSearchSQLite';

export default defineEventHandler(async (event) => {
  try {
    const service = getOrCreateHotSearchSQLiteService();

    // 获取limit参数，默认30
    const query = getQuery(event);
    const limit = parseInt((query.limit as string) || '30', 10);

    const hotSearches = await service.getHotSearches(limit);

    return {
      code: 0,
      message: 'success',
      data: {
        hotSearches,
      },
    };
  } catch (error) {
    console.error('[GET /api/hot-searches] Error:', error);
    return {
      code: -1,
      message: '获取热搜失败',
      data: {
        hotSearches: [],
      },
    };
  }
});

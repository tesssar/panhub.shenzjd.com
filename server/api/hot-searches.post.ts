import { defineEventHandler, readBody } from 'h3';
import { getOrCreateHotSearchSQLiteService } from '../core/services/hotSearchSQLite';

interface RequestBody {
  term: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<RequestBody>(event);

    if (!body || !body.term) {
      return {
        code: -1,
        message: '缺少搜索词参数',
        data: null,
      };
    }

    const service = getOrCreateHotSearchSQLiteService();
    await service.recordSearch(body.term);

    return {
      code: 0,
      message: 'success',
      data: null,
    };
  } catch (error) {
    console.error('[POST /api/hot-searches] Error:', error);
    return {
      code: -1,
      message: '记录搜索词失败',
      data: null,
    };
  }
});

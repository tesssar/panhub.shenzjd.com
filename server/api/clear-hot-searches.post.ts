import { defineEventHandler, readBody } from 'h3';
import { getOrCreateHotSearchSQLiteService } from '../core/services/hotSearchSQLite';

interface RequestBody {
  password: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<RequestBody>(event);

    if (!body || !body.password) {
      return {
        code: -1,
        message: '缺少密码参数',
        data: null,
      };
    }

    const service = getOrCreateHotSearchSQLiteService();
    const result = await service.clearHotSearches(body.password);

    if (result.success) {
      return {
        code: 0,
        message: result.message,
        data: null,
      };
    } else {
      return {
        code: -1,
        message: result.message,
        data: null,
      };
    }
  } catch (error) {
    console.error('[POST /api/clear-hot-searches] Error:', error);
    return {
      code: -1,
      message: '清除热搜失败',
      data: null,
    };
  }
});

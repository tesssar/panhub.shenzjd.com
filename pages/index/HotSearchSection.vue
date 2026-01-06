<template>
  <div class="hot-search-section">
    <h2 class="section-title">热搜推荐</h2>

    <div class="categories-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 分类行列表 -->
      <template v-else>
        <div
          v-for="category in categorizedData"
          :key="category.key"
          class="category-row"
        >
          <div class="category-header">
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-label">{{ category.label }}</span>
          </div>

          <div class="searches-list">
            <button
              v-for="(item, index) in category.items"
              :key="item.term + index"
              class="search-item"
              :class="{ 'top-3': index < 3 }"
              @click="onSearchClick(item.term)"
            >
              <span class="rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="term">{{ item.term }}</span>
              <span class="score" v-if="item.score > 1">🔥 {{ item.score }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 空状态（所有分类都无数据） -->
      <div v-if="!loading && categorizedData.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>暂无热搜数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface Props {
  onSearch: (term: string) => void;
}

interface CategoryConfig {
  key: string;
  label: string;
  icon: string;
  keywords: string[];
  maxDisplay: number;
  fallback: string[];
}

interface HotSearchItem {
  term: string;
  score: number;
  lastSearched: number;
  createdAt: number;
}

interface CategorizedResult {
  key: string;
  label: string;
  icon: string;
  items: HotSearchItem[];
}

const props = defineProps<Props>();

// 状态
const loading = ref(false);
const allSearches = ref<HotSearchItem[]>([]);

// 分类配置
const CATEGORIES: CategoryConfig[] = [
  {
    key: 'all',
    label: '全部',
    icon: '🔥',
    keywords: [],
    maxDisplay: 6,
    fallback: ['热门电影', '最新软件', '学习资料', '流行音乐', '热门游戏', '电子书']
  },
  {
    key: 'movie',
    label: '影视',
    icon: '🎬',
    keywords: ['电影', '剧集', '电视剧', '动漫', '动画', '纪录片', '综艺'],
    maxDisplay: 6,
    fallback: ['肖申克的救赎', '流浪地球3', '热辣滚烫', '飞驰人生2', '第二十条', '周处除三害']
  },
  {
    key: 'software',
    label: '软件',
    icon: '💻',
    keywords: ['软件', '工具', '应用', 'APP', '程序', '安装包'],
    maxDisplay: 6,
    fallback: ['Photoshop 2024', 'Office 2021', 'VS Code', 'Python 3.12', 'Blender', '剪映专业版']
  },
  {
    key: 'study',
    label: '学习',
    icon: '📚',
    keywords: ['学习', '资料', '教程', '课程', '文档', '电子书', '教材'],
    maxDisplay: 6,
    fallback: ['Python入门', 'React教程', '考研资料', '雅思真题', 'PPT模板', 'Excel技巧']
  },
  {
    key: 'music',
    label: '音乐',
    icon: '🎵',
    keywords: ['音乐', '歌曲', 'MP3', '无损', 'FLAC'],
    maxDisplay: 6,
    fallback: ['周杰伦', '林俊杰', '邓紫棋', '陈奕迅', '毛不易', '告五人']
  },
  {
    key: 'game',
    label: '游戏',
    icon: '🎮',
    keywords: ['游戏', 'Steam', '单机', '手游', '网游'],
    maxDisplay: 6,
    fallback: ['黑神话:悟空', '原神', '王者荣耀', '英雄联盟', 'CS2', '艾尔登法环']
  }
];

// 计算属性：分类后的数据
const categorizedData = computed<CategorizedResult[]>(() => {
  // 如果没有真实数据，全部使用假数据
  if (allSearches.value.length === 0) {
    return CATEGORIES.map(cat => ({
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
      items: cat.fallback.map(term => ({
        term,
        score: 0,
        lastSearched: 0,
        createdAt: 0
      }))
    }));
  }

  // 混合真实数据和假数据
  return CATEGORIES.map(cat => {
    // 过滤该分类的真实热搜
    const realItems = allSearches.value.filter(item =>
      cat.keywords.length === 0 ||
      cat.keywords.some(keyword => item.term.includes(keyword))
    );

    // 如果真实数据不足，用假数据补充
    const displayCount = cat.maxDisplay;
    let items = [...realItems];

    if (items.length < displayCount) {
      const needed = displayCount - items.length;
      const fallbackItems = cat.fallback.slice(0, needed).map(term => ({
        term,
        score: 0,
        lastSearched: 0,
        createdAt: 0
      }));
      items = [...items, ...fallbackItems];
    } else {
      items = items.slice(0, displayCount);
    }

    return {
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
      items
    };
  });
});

// 获取热搜数据
async function fetchHotSearches() {
  loading.value = true;
  try {
    const response = await fetch('/api/hot-searches?limit=50');
    const data = await response.json();

    if (data.code === 0 && data.data?.hotSearches) {
      allSearches.value = data.data.hotSearches;
    }
  } catch (error) {
    console.error('获取热搜失败:', error);
    // 失败时使用假数据
    allSearches.value = [];
  } finally {
    loading.value = false;
  }
}

// 获取排名样式
function getRankClass(index: number): string {
  if (index === 0) return 'rank-first';
  if (index === 1) return 'rank-second';
  if (index === 2) return 'rank-third';
  return '';
}

// 点击搜索词
function onSearchClick(term: string) {
  props.onSearch(term);
}

// 页面加载时获取数据
onMounted(() => {
  fetchHotSearches();
});
</script>

<style scoped>
.hot-search-section {
  width: 100%;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '🔥';
  font-size: 24px;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 每行分类卡片 */
.category-row {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.4s ease;
}

/* 分类头部 */
.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-icon {
  font-size: 20px;
}

.category-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 热搜列表 */
.searches-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 13px;
  color: var(--text-primary);
  text-align: left;
  white-space: nowrap;
  flex: 1;
  min-width: 120px;
  max-width: calc(33.333% - 8px);
}

.search-item:hover {
  background: var(--bg-primary);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

/* 前 3 名特殊样式 */
.search-item.top-3 {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  border-color: rgba(99, 102, 241, 0.3);
}

.rank {
  font-weight: 700;
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.rank-first {
  color: #f59e0b; /* 金牌 */
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.rank-second {
  color: #94a3b8; /* 银牌 */
  text-shadow: 0 0 8px rgba(148, 163, 184, 0.4);
}

.rank-third {
  color: #cd7f32; /* 铜牌 */
  text-shadow: 0 0 8px rgba(205, 127, 50, 0.4);
}

.term {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  padding: 2px 6px;
  border-radius: 999px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .section-title {
    font-size: 18px;
  }

  .category-row {
    padding: 12px;
  }

  .search-item {
    min-width: 100px;
    max-width: calc(50% - 8px);
    font-size: 12px;
    padding: 6px 10px;
  }

  .rank {
    width: 16px;
    font-size: 12px;
  }

  .score {
    font-size: 10px;
    padding: 1px 4px;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .category-row {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .search-item {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(100, 116, 139, 0.3);
  }

  .search-item:hover {
    background: rgba(15, 23, 42, 0.7);
  }

  .search-item.top-3 {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .category-row,
  .search-item {
    animation: none;
    transition: none;
  }

  .spinner {
    animation: none;
    opacity: 0.7;
  }

  .search-item:hover {
    transform: none;
  }
}
</style>

<template>
  <div v-if="!hasAnyData" class="hidden"></div>

  <div v-else class="douban-movie-section">
    <div class="section-head">
      <h2 class="section-title">豆瓣电影 · 新片榜</h2>
      <p class="section-subtitle">点击电影可快速发起网盘搜索</p>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中…</span>
    </div>
    <div v-else class="movie-grid">
      <button
        v-for="item in movieItems"
        :key="(item.id ?? 0) + item.title"
        class="movie-card"
        :aria-label="`搜索 ${extractTerm(item.title)}`"
        @click="onItemClick(item.title)"
      >
        <div class="movie-cover">
          <img
            v-if="item.cover && !imgFailed.includes(item.id ?? 0)"
            :src="proxyCover(item.cover)"
            :alt="extractTerm(item.title)"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="onImgError(item.id ?? 0)"
          />
          <div v-else class="cover-placeholder">🎬</div>
        </div>
        <div class="movie-info">
          <span class="movie-title">{{ extractTerm(item.title) }}</span>
          <span v-if="item.desc" class="movie-desc">{{ item.desc }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  onSearch: (term: string) => void;
}

interface DoubanHotItem {
  id?: number;
  title: string;
  url?: string;
  cover?: string;
  desc?: string;
  hot?: number;
}

interface DoubanHotCategory {
  id: string;
  label: string;
  title: string;
  type: string;
  items: DoubanHotItem[];
}

const props = defineProps<Props>();

const loading = ref(false);
const categories = ref<Record<string, DoubanHotCategory>>({});
const hasInitialized = ref(false);
const imgFailed = ref<number[]>([]);

function onImgError(id: number) {
  if (!imgFailed.value.includes(id)) {
    imgFailed.value = [...imgFailed.value, id];
  }
}

const movieItems = computed(() => {
  const cat = categories.value["douban-movie"];
  return cat?.items ?? [];
});

const hasAnyData = computed(() => {
  if (loading.value) return true;
  return movieItems.value.length > 0;
});

function extractTerm(title: string): string {
  return title.replace(/^【[\d.]+】/, "").trim() || title;
}

function proxyCover(url: string): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

async function fetchDoubanHot() {
  loading.value = true;
  try {
    const response = await fetch("/api/douban-hot");
    const data = await response.json();
    if (data.code === 0 && data.data?.categories) {
      categories.value = data.data.categories;
    } else {
      categories.value = {};
    }
  } catch {
    categories.value = {};
  } finally {
    loading.value = false;
  }
}

function onItemClick(title: string) {
  const term = extractTerm(title);
  if (term) props.onSearch(term);
}

async function init() {
  if (hasInitialized.value) return;
  hasInitialized.value = true;
  await fetchDoubanHot();
}

async function refresh() {
  await fetchDoubanHot();
}

defineExpose({ init, refresh });
</script>

<style scoped>
.douban-movie-section {
  width: 100%;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.section-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-light);
  border-radius: 14px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(15, 118, 110, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.movie-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease;
  text-align: left;
  padding: 0;
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(15, 118, 110, 0.15);
}

.movie-cover {
  aspect-ratio: 2 / 3;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  overflow: hidden;
}

.movie-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.movie-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
}

.movie-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.movie-desc {
  font-size: 10px;
  color: var(--text-tertiary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hidden {
  display: none;
}

@media (max-width: 500px) {
  .movie-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
}

@media (min-width: 640px) {
  .movie-grid {
    gap: 14px;
  }

  .movie-title {
    font-size: 13px;
  }
}

@media (prefers-color-scheme: dark) {
  .loading-state,
  .movie-card {
    background: rgba(17, 24, 39, 0.6);
    border-color: rgba(75, 85, 99, 0.4);
  }

  .movie-cover {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  }

  .movie-card:hover {
    box-shadow: 0 12px 24px rgba(15, 118, 110, 0.25);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner,
  .movie-card {
    animation: none;
    transition: none;
  }

  .movie-card:hover {
    transform: none;
  }
}
</style>

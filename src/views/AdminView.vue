<template>
  <div class="admin-view">
    <h1>用户数据分析</h1>
    
    <div class="stats-container">
      <div class="stats-card">
        <h2>总体统计</h2>
        <div v-if="userStats" class="stats-grid">
          <div class="stat-item">
            <span class="label">总会话数：</span>
            <span class="value">{{ userStats.totalSessions }}</span>
          </div>
          <div class="stat-item">
            <span class="label">总消息数：</span>
            <span class="value">{{ userStats.totalMessages }}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均会话长度：</span>
            <span class="value">{{ userStats.averageSessionLength.toFixed(2) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">自动回复使用次数：</span>
            <span class="value">{{ userStats.autoReplyUsage }}</span>
          </div>
          <div class="stat-item">
            <span class="label">手动输入使用次数：</span>
            <span class="value">{{ userStats.manualInputUsage }}</span>
          </div>
        </div>
      </div>

      <div class="stats-card">
        <h2>角色偏好</h2>
        <div v-if="userStats && userStats.preferredRoles" class="role-stats">
          <div v-for="(count, role) in userStats.preferredRoles" :key="role" class="role-item">
            <span class="role-name">{{ role }}</span>
            <div class="role-bar">
              <div class="bar-fill" :style="{ width: (count / maxRoleCount * 100) + '%' }"></div>
            </div>
            <span class="role-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="export-section">
      <h2>导出数据</h2>
      <div class="export-controls">
        <input type="date" v-model="startDate" />
        <input type="date" v-model="endDate" />
        <button @click="exportData">导出数据</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DatabaseService from '../services/dbService';

const dbService = DatabaseService.getInstance();
const userStats = ref<any>(null);
const startDate = ref('');
const endDate = ref('');

const maxRoleCount = computed(() => {
  if (!userStats.value?.preferredRoles) return 0;
  return Math.max(...Object.values(userStats.value.preferredRoles).map(v => Number(v)));
});

onMounted(async () => {
  try {
    // 获取所有用户的统计数据
    userStats.value = await dbService.getUserStats('all');
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
});

async function exportData() {
  try {
    const filters = {
      timestamp: {
        $gte: new Date(startDate.value),
        $lte: new Date(endDate.value)
      }
    };
    
    const logs = await dbService.exportChatLogs(filters);
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-logs-${startDate.value}-${endDate.value}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出数据失败:', error);
  }
}
</script>

<style scoped>
.admin-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.stats-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.role-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-item {
  display: grid;
  grid-template-columns: 150px 1fr 60px;
  align-items: center;
  gap: 1rem;
}

.role-bar {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.export-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.export-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}

input[type="date"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style> 
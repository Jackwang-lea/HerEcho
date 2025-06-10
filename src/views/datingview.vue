<template>
  <div class="dating-view">
    <div class="topbar">
      <span class="logo">💜</span>
      <span class="title">角色聊天</span>
      <span class="menu-icon">☰</span>
    </div>
    <div class="card-container">
      <div v-for="(character, index) in visibleCharacters" 
           :key="character.id" 
           class="card-wrapper"
           :style="{ '--i': index }">
        <CharacterCard 
          :character="character" 
          @cancel="handleCancel(index)"
          @match="handleMatch(index)"
          :class="{ 'dismissing': dismissingIndex === index }"
          :style="getCardStyle(index)"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CharacterCard from '../components/characterCard.vue';
import { characters } from '../config/characters';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentIndex = ref(0);
const dismissingIndex = ref(-1);
const startPoint = ref<{ x: number; y: number } | null>(null);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);

// 显示最多3张卡片
const visibleCharacters = computed(() => {
  const result = [];
  for (let i = 0; i < 3; i++) {
    const index = (currentIndex.value + i) % characters.length;
    result.push(characters[index]);
  }
  return result;
});

function getCardStyle(index: number) {
  if (index === dismissingIndex.value) {
    return {
      transform: `translate(${offset.value.x}px, ${offset.value.y}px) rotate(${offset.value.x * 0.05}deg)`,
      transition: isDragging.value ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  }
  return {};
}

function handleCancel(index: number) {
  if (index !== 0) return;
  dismissingIndex.value = index;
  offset.value = { x: -window.innerWidth, y: 0 };
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % characters.length;
    dismissingIndex.value = -1;
    offset.value = { x: 0, y: 0 };
  }, 500);
}

function handleMatch(index: number) {
  if (index !== 0) return;
  dismissingIndex.value = index;
  offset.value = { x: window.innerWidth, y: 0 };
  setTimeout(() => {
    const character = visibleCharacters.value[0];
    router.push(`/chat/${character.book_id}/${character.id}`);
  }, 500);
}

// 鼠标事件处理
function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return; // 只处理左键点击
  isDragging.value = true;
  startPoint.value = { x: e.clientX, y: e.clientY };
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!startPoint.value || !isDragging.value) return;
  const deltaX = e.clientX - startPoint.value.x;
  const deltaY = e.clientY - startPoint.value.y;
  
  offset.value = { x: deltaX, y: deltaY };
  
  // 如果滑动距离超过阈值，触发相应的动作
  if (Math.abs(deltaX) > window.innerWidth * 0.3) {
    if (deltaX > 0) {
      handleMatch(0);
    } else {
      handleCancel(0);
    }
  }
}

function handleMouseUp() {
  if (!startPoint.value) return;
  isDragging.value = false;
  startPoint.value = null;
  offset.value = { x: 0, y: 0 };
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

// 触摸事件处理
function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  startPoint.value = { x: touch.clientX, y: touch.clientY };
}

function handleTouchMove(e: TouchEvent) {
  if (!startPoint.value) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - startPoint.value.x;
  const deltaY = touch.clientY - startPoint.value.y;
  
  offset.value = { x: deltaX, y: deltaY };
  
  // 如果滑动距离超过阈值，触发相应的动作
  if (Math.abs(deltaX) > window.innerWidth * 0.3) {
    if (deltaX > 0) {
      handleMatch(0);
    } else {
      handleCancel(0);
    }
  }
}

function handleTouchEnd() {
  if (!startPoint.value) return;
  startPoint.value = null;
  offset.value = { x: 0, y: 0 };
}
</script>

<style scoped>
.dating-view {
  background: #181828;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.topbar {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e1e2f;
  padding: 0 20px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
}

.logo {
  font-size: 22px;
  color: #d893eb;
  font-weight: bold;
}

.title {
  font-size: 20px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 1px;
}

.menu-icon {
  font-size: 22px;
  color: #fff;
  cursor: pointer;
}

.card-container {
  width: 100%;
  height: calc(100vh - 56px);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
  perspective: 1000px;
  perspective-origin: center 50%;
  transform-style: preserve-3d;
}

.card-wrapper {
  position: absolute;
  width: min(90vw, 360px);
  height: min(calc(90vw * 1.6), 576px);
  transform: translateZ(calc(-30px * var(--i))) translateY(calc(-20px * var(--i))) rotate(calc(-4deg * var(--i)));
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.card-wrapper:first-child {
  pointer-events: auto;
}

.dismissing {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style> 
<template>
  <div class="character-card" 
       :style="{ backgroundImage: `url(${character.avatar})` }"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd"
       @touchcancel="handleTouchEnd">
    <div class="overlay">
      <div class="name">{{ character.name }}</div>
      <!-- 增加一条分割线 -->
      <div class="divider"></div>
      <div class="desc">{{ characterDesc }}</div>
      <div class="actions">
        <button class="btn skip" @click.stop="$emit('cancel')">
          <span class="icon">✖</span>
          <span class="text"></span>
        </button>
        <button class="btn like" @click.stop="$emit('match')">
          <span class="icon">❤</span>
          <span class="text"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  character: { type: Object, required: true }
});

const emit = defineEmits(['cancel', 'match']);

const characterDesc = computed(() => {
  // 取角色的介绍信息，优先 backgroundDescription，没有则用 name
  return props.character.backgroundDescription || props.character.name;
});

const startPoint = ref<{ x: number; y: number } | null>(null);

function handleTouchStart(e: TouchEvent) {
  e.preventDefault();
  const touch = e.touches[0];
  startPoint.value = { x: touch.clientX, y: touch.clientY };
}

function handleTouchMove(e: TouchEvent) {
  if (!startPoint.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  const deltaX = touch.clientX - startPoint.value.x;
  
  // 如果滑动距离超过阈值，触发相应的动作
  if (Math.abs(deltaX) > window.innerWidth * 0.3) {
    if (deltaX > 0) {
      emit('match');
    } else {
      emit('cancel');
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault();
  startPoint.value = null;
}
</script>

<style scoped>
.character-card {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 2;
  background-size: cover;
  background-position: center;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(122, 79, 255, 0.18);
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border: 4px solid rgba(216, 147, 235, 0.7);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.overlay {
  width: 100%;
  padding: clamp(20px, 5vw, 36px) clamp(16px, 4vw, 28px) clamp(24px, 6vw, 32px) clamp(16px, 4vw, 28px);
  background: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.0) 100%);
  color: #fff;
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.name {
  font-size: clamp(24px, 6vw, 36px);
  font-weight: 700;
  margin-bottom: 1px;
  letter-spacing: 1px;
  text-align: left;
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.divider {
  width: 90%;
  height: 1px;
  background-color: #f3eaff;
  /* 居中 */
  margin-left: auto;
  margin-right: auto;
  margin-top: 5px;
  margin-bottom: 5px;
}
.desc {
  font-size: clamp(14px, 3.5vw, 16px);
  color: #f3eaff;
  margin-bottom: 15px;
  text-align: left;
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 clamp(20px, 5vw, 30px);
  gap: clamp(30px, 8vw, 50px);
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(60px, 15vw, 80px);
  padding: clamp(12px, 3vw, 18px);
  height: clamp(45px, 12vw, 60px);
  border: none;
  border-radius: 22px;
  font-size: clamp(15px, 4vw, 17px);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.btn .icon {
  font-size: 20px;
  margin-right: auto;
  margin-left: auto;
}
.skip {
  background: #f3f3f6;
  color: #888;
}
.skip:hover {
  background: #e0e0e6;
  color: #555;
}
.like {
  background: linear-gradient(90deg, #7a4fff 60%, #e85dff 100%);
  color: #fff;
}
.like:hover {
  background: linear-gradient(90deg, #6a3fd9 60%, #c84dcf 100%);
}
</style> 
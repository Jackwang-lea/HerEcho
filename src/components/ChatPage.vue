<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, provide, type Ref } from 'vue';
// 解决方案一：选择 main 分支的图标导入
import { RiDeleteBin2Line, RiArrowUpSLine } from '@remixicon/vue';
// import { Icon } from '@iconify/vue';
import ChatHeader from './ChatHeader.vue';
import ChatInput from './ChatInput.vue';
import BottomNav from './BottomNav.vue';
import ChatSidebar from './ChatSidebar.vue';
// 解决方案二：选择 main 分支的服务导入
import { clearChatHistory, setCurrentModel } from '../services/chatService';
import { getDefaultCharacter } from '../config/characters';
import type { Character } from '../types/character';
import type { ViewpointRelation } from '../types/viewpoint';
import { VIEWPOINT_MAPPING } from '../services/viewpointService';
import { logViewpointChange } from '../services/logService';
import type { AIModel } from '../types/chat';
import { useSidebarStore } from '../stores/sidebarStore';

// 使用Vite的资源导入方式导入背景图片
import bgImageSrc from '../assets/character_qqc_B001C001.png';
const bgImage = bgImageSrc;

// 修复：移除内联的 defaultCharacter 定义，并确保 currentCharacter 只被定义一次
// const defaultCharacter: Character = { ... }; // 这个详细的定义可以删除或注释掉

// 当前角色 - 确保只定义一次，并使用 getDefaultCharacter
const currentCharacter = ref<Character>(getDefaultCharacter());

// 当前视角关系
const currentViewpoint = ref<ViewpointRelation | undefined>(
  VIEWPOINT_MAPPING.find(vp => vp.characterId === currentCharacter.value.id)
);

// 修改消息接口以包含isSystem属性
interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  hasAudio: boolean;
  isSystem?: boolean;
}

// 更新消息内容以符合羌青瓷和程聿怀的角色扮演场景
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    content: '(摇晃着盛满白葡萄酒的高脚杯，背对着你靠在桌前。听到脚步声后歪了歪唇，没有回头，只是抿了一口杯中的酒，随后轻轻地把酒杯放在桌子上，轻声笑了) "牵，你来了。"',
    isUser: false,
    hasAudio: true
  },
  {
    id: 2,
    content: '(伸手环住他的腰，将脸埋进他的后背) 羌青瓷，我来了。',
    isUser: true,
    hasAudio: false
  },
  {
    id: 3,
    content: '(轻笑一声，没有挣开你的怀抱，只是拿起酒杯又抿了一口酒，随后转身面对着你，微微俯身凑近你，温热的呼吸洒在你的脸上) "今天怎么这么粘人？"',
    isUser: false,
    hasAudio: true
  },
  {
    id: 4,
    content: '(伸手搭住他的肩膀，凑近他的耳边轻声说) "我今天......有点想你。"',
    isUser: true,
    hasAudio: false
  },
  {
    id: 5,
    content: '(喉结滚动，轻笑着将你推开一些，与你四目相对，眼中带着笑意) "哦？是吗？我还以为程医生巴不得离我远点呢。"',
    isUser: false,
    hasAudio: true
  }
]);

// 视角切换处理
function handleViewpointChange(viewpoint: ViewpointRelation) {
  console.log(`用户切换视角关系: ${viewpoint.promptKey}, 角色: ${currentCharacter.value.name}(${currentCharacter.value.id})`);
  logViewpointChange(viewpoint.promptKey, currentCharacter.value.id, currentCharacter.value.name);
  currentViewpoint.value = viewpoint;
  
  // 添加视角切换的系统消息
  let viewpointMessage = '';
  switch (viewpoint.promptKey) {
    case 'BJX_TO_CZL':
      viewpointMessage = '【已切换到蒋伯驾视角】';
      break;
    case 'YS_TO_MHM':
      viewpointMessage = '【已切换到以撒视角】';
      break;
    default:
      viewpointMessage = '【已切换到默认视角】';
  }
  
  // 添加系统消息
  messages.value.push({
    id: Date.now(),
    content: viewpointMessage,
    isUser: false,
    hasAudio: false,
    isSystem: true
  });
  
  scrollToBottom();
}

// 情节信息
const sceneInfo = {
  title: '（番外）你与羌青瓷重逢后的日常',
  stage: '相爱阶段',
  progress: 40
};

const progress = ref(sceneInfo.progress);
const isCollapsed = ref(false); // 默认展开状态
const chatContainerRef = ref<HTMLElement | null>(null);
const showClearConfirm = ref(false); // 添加清除确认对话框状态
// const currentCharacter = ref<Character>(getDefaultCharacter()); // 确保此行已被上面的统一定义替换或删除

// 使用侧边栏 store
const sidebarStore = useSidebarStore();

// 添加 autoPlayTTS 状态
const autoPlayTTS = ref(localStorage.getItem('autoPlayTTS') === 'true');
const isStoryMode = ref(false);

// 处理自动播放设置变化
function handleAutoPlayChange(value: boolean) {
  console.log('自动播放设置改变:', value);
  autoPlayTTS.value = value;
  localStorage.setItem('autoPlayTTS', value.toString());
}

// 定义 testApiConnection 函数
const testApiConnection = async () => {
  console.log("尝试连接 API...");
  try {
    // 这里可以添加实际的API测试逻辑
    const response = await fetch('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success) {
      console.log("API 测试成功");
      // 添加系统消息
      messages.value.push({
        id: Date.now(),
        content: '【API 连接测试成功】',
        isUser: false,
        hasAudio: false,
        isSystem: true
      });
    } else {
      throw new Error(data.error || 'API 测试失败');
    }
  } catch (error: any) {
    console.error("API 测试失败:", error);
    // 添加系统消息
    messages.value.push({
      id: Date.now(),
      content: `【API 连接测试失败: ${error.message || '未知错误'}】`,
      isUser: false,
      hasAudio: false,
      isSystem: true
    });
  }
  scrollToBottom();
};

// 发送消息
function sendMessage(text: string) {
  console.log(`用户发送消息: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" 给角色: ${currentCharacter.value.name}(${currentCharacter.value.id})`);
  addUserMessage(text);
  // 不再需要这里的自动回复，因为会由AI响应事件处理
}

function selectOption(option: string) {
  addUserMessage(option);
  // 不再需要这里的自动回复，因为会由AI响应事件处理
}

function handleAIResponse(response: string) {
  messages.value.push({
    id: Date.now(),
    content: response,
    isUser: false,
    hasAudio: true
  });

  console.log(`角色 ${currentCharacter.value.name}(${currentCharacter.value.id}) 回复了消息`);
  updateProgress();
  scrollToBottom();
}

function handleVoiceMessage(duration: number) {
  const voiceMessage = `(发送了一条 ${duration.toFixed(1)} 秒的语音消息)`;
  messages.value.push({
    id: Date.now(),
    content: voiceMessage,
    isUser: true,
    hasAudio: true
  });

  updateProgress();
  scrollToBottom();

  // 语音消息的AI响应会通过handleAIResponse处理，不需要在这里模拟
}

function addUserMessage(text: string) {
  messages.value.push({
    id: Date.now(),
    content: text,
    isUser: true,
    hasAudio: false
  });
  updateProgress();
  scrollToBottom();
}

function updateProgress() {
  if (progress.value < 95) {
    progress.value += 5;
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (chatContainerRef.value && !isCollapsed.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  }, 100);
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

// 添加清除对话功能
function showClearDialog() {
  showClearConfirm.value = true;
}

function clearChat() {
  // 清除本地消息
  messages.value = [
    {
      id: Date.now(),
      content: '(优雅地站在窗边，看着窗外的风景，听到你进来的脚步声，转身微笑) "聿怀，你来了。有什么想和我聊的吗？"',
      isUser: false,
      hasAudio: true
    }
  ];

  // 清除DeepSeek API的对话历史
  clearChatHistory(); // 这个函数来自于导入

  // 重置进度
  progress.value = 10;

  // 隐藏确认对话框
  showClearConfirm.value = false;

  // 滚动到底部
  scrollToBottom();
}

function cancelClear() {
  showClearConfirm.value = false;
}

// 添加计算属性获取最后的消息
const lastUserMessage = computed(() => {
  const userMessages = messages.value.filter(m => m.isUser);
  return userMessages.length > 0 ? userMessages[userMessages.length - 1] : undefined;
});

const lastCharacterMessage = computed(() => {
  const characterMessages = messages.value.filter(m => !m.isUser && !m.isSystem);
  return characterMessages.length > 0 ? characterMessages[characterMessages.length - 1] : undefined;
});

// 处理模型切换
function handleModelChange(model: AIModel) {
  setCurrentModel(model);
}

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="chat-page">
    <div class="background-fixed">
      <img :src="bgImage" alt="羌青瓷" />
    </div>

    <div class="content-wrapper">
      <ChatHeader
        :currentCharacter="currentCharacter"
        :isCollapsed="isCollapsed"
        :hasDynamicBackground="true"
        :isDynamicBackground="true"
        :autoPlayTTS="autoPlayTTS"
        :isStoryMode="isStoryMode"
        @test-api="testApiConnection"
        @change-viewpoint="handleViewpointChange"
        @model-changed="handleModelChange"
        @toggle-collapse="toggleCollapse"
        @toggle-background="() => {}"
        @auto-play-changed="handleAutoPlayChange"
      />

      <ChatSidebar
        :show="sidebarStore.isOpen"
        :currentCharacter="currentCharacter"
        @close="() => {
          console.log('ChatPage: 收到关闭事件');
          sidebarStore.close();
        }"
      />

      <div class="scene-container" v-if="!isCollapsed">
        <div class="scene-info">
          <div class="scene-text">情节：{{ sceneInfo.title }}</div>
          <div class="scene-stage">{{ sceneInfo.stage }}</div>
        </div>

        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>

      <div class="chat-wrapper" :class="{ 'collapsed': isCollapsed }">
        <div class="toggle-bar">
          <div class="clear-chat" @click="showClearDialog">
            <RiDeleteBin2Line />
          </div>
          <div class="toggle-section" @click="toggleCollapse">
            <span>{{ isCollapsed ? '展开对话' : '收起对话' }}</span>
            <div class="arrow-icon" :class="{ 'rotate': isCollapsed }">
              <RiArrowUpSLine /> 
              </div>
          </div>
        </div>

        <div
          class="chat-container"
          ref="chatContainerRef"
        >
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'message-container', 
              message.isUser ? 'user-message' : 
              message.isSystem ? 'system-message' : 'character-message'
            ]"
          >
            <div v-if="message.hasAudio && !message.isUser && !message.isSystem" class="audio-icon">🔊</div>
            <div class="message-bubble" v-if="!message.isSystem">
              <div class="message-content" v-html="message.content"></div>
            </div>
            <div v-else class="system-message-content">{{ message.content }}</div>
          </div>
        </div>

        <ChatInput
          @send-message="sendMessage"
          @select-option="selectOption"
          @send-voice="handleVoiceMessage"
          @ai-response="handleAIResponse"
          :isCollapsed="isCollapsed"
          :currentCharacter="currentCharacter"
          :lastUserMessage="lastUserMessage"
          :lastCharacterMessage="lastCharacterMessage"
        />
      </div>

      <div class="nav-placeholder"></div>
    </div>

    <div class="confirm-dialog" v-if="showClearConfirm">
      <div class="confirm-content">
        <h3>清除对话</h3>
        <p>确定要清除所有对话记录吗？此操作不可恢复。</p>
        <div class="confirm-buttons">
          <button class="cancel-button" @click="cancelClear">取消</button>
          <button class="confirm-button" @click="clearChat">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
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

.background-fixed {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100vh;
  max-width: 480px;
  z-index: 1;
  pointer-events: none;
}

.background-fixed img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.content-wrapper {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 情节信息样式 */
.scene-container {
  background-color: rgba(26, 42, 42, 0.6);
  color: white;
  padding: 10px 15px;
  font-size: 14px;
  height: 80px; /* 固定进度元素的高度 */
  box-sizing: border-box;
}

.scene-info {
  margin-bottom: 8px;
}

.scene-text {
  font-weight: 500;
  margin-bottom: 5px;
}

.scene-stage {
  color: #cccccc;
  font-size: 12px;
}

.progress-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #3a4a4a;
  border-radius: 2px;
  overflow: hidden;
  margin-right: 10px;
}

.progress-fill {
  height: 100%;
  background-color: #42b883;
  border-radius: 2px;
}

.toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  background-color: rgba(26, 42, 42, 0.3); /* 降低透明度 */
  color: #cccccc;
  font-size: 14px;
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  z-index: 10;
  height: 36px;
}

.clear-chat {
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: color 0.2s ease;
  height: 20px; /* 固定高度 */
}

.clear-chat:hover {
  color: #e74c3c;
}

.toggle-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 20px; /* 固定高度 */
}

.arrow-icon {
  display: inline-flex;
  margin-left: 6px;
  font-size: 18px;
  height: 20px;
  align-items: center;
}

/* 聊天容器和控制栏的包装器 */
.chat-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  transition: height 0.3s ease;
  display: flex;
  flex-direction: column;
  background-color: rgba(18, 26, 26, 0.5);
}

.chat-wrapper:not(.collapsed) {
  height: calc(100% - 50px - 80px); /* 减去header高度(50px)和进度元素高度(80px) */
}

.chat-wrapper.collapsed {
  height: 40%; /* 收起时固定占据底部40%高度 */
}

.chat-container {
  flex: 1;
  width: 100%;
  background-color: rgba(26, 42, 42, 0.3);
  overflow-y: auto;
  padding: 10px 0;
  margin-top: 36px;
  margin-bottom: 120px;
  -webkit-overflow-scrolling: touch; /* 添加弹性滚动 */
  overscroll-behavior: contain; /* 防止滚动传播 */
}

.message-container {
  display: flex;
  margin: 8px 15px;
  align-items: flex-start;
}

.user-message {
  justify-content: flex-end;
}

.character-message {
  justify-content: flex-start;
}

.audio-icon {
  margin-right: 8px;
  color: #cccccc;
  font-size: 16px;
  margin-top: 5px;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  word-break: break-word;
  backdrop-filter: blur(4px);
}

.user-message .message-bubble {
  background-color: rgba(255, 255, 255, 0.8);
  color: #1a1a1a;
  border-top-right-radius: 0;
}

.character-message .message-bubble {
  background-color: rgba(26, 26, 26, 0.7);
  color: #ffffff;
  border-top-left-radius: 0;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
}

/* 隐藏滚动条但保留功能 */
.chat-container::-webkit-scrollbar {
  width: 0px;
}

/* 确认对话框样式 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.confirm-content {
  background-color: #1a2a2a;
  border-radius: 10px;
  padding: 20px;
  width: 80%;
  max-width: 300px;
}

.confirm-content h3 {
  margin-top: 0;
  color: #fff;
  font-size: 18px;
}

.confirm-content p {
  color: #ccc;
  font-size: 14px;
  margin-bottom: 20px;
}

.confirm-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button, .confirm-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.cancel-button {
  background-color: #333;
  color: #fff;
}

.confirm-button {
  background-color: #e74c3c;
  color: #fff;
}

.system-message {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.system-message-content {
  background-color: rgba(0, 0, 0, 0.3);
  color: #bbb;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 12px;
  text-align: center;
  max-width: 80%;
}

.nav-placeholder {
  height: 48px;
  background-color: #000000;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
}
</style>
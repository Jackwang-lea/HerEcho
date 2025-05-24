import { createRouter, createWebHistory } from 'vue-router'
import CharacterChatPage from '../components/CharacterChatPage.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/chat'
    },
    {
      path: '/dream',
      name: 'dream',
      component: () => import('../views/DreamHomeView.vue')
    },
    {
      path: '/dream/scene/:storyId?',
      name: 'dreamScene',
      component: () => import('../views/DreamView.vue'),
      props: true
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ScriptSelectionView.vue')
    },
    {
      path: '/chat/:scriptId/:characterId',
      name: 'chatWithScript',
      component: CharacterChatPage,
      props: true
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('../views/DiscoverView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/chat'
    }
  ]
})

// 添加路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 这里可以添加身份验证逻辑
    // 例如检查用户是否是管理员
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      next('/chat');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 
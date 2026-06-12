export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/materials/materials',
    'pages/bind/bind',
    'pages/profile/profile',
    'pages/webview/webview',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E3A5F',
    navigationBarTitleText: '吉他教室',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#1E3A5F',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '课程', iconPath: 'assets/tab-lessons-inactive.png', selectedIconPath: 'assets/tab-lessons.png' },
      { pagePath: 'pages/materials/materials', text: '课件', iconPath: 'assets/tab-materials-inactive.png', selectedIconPath: 'assets/tab-materials.png' },
      { pagePath: 'pages/profile/profile', text: '我的', iconPath: 'assets/tab-profile-inactive.png', selectedIconPath: 'assets/tab-profile.png' },
    ],
  },
})

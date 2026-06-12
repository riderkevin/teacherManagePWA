export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/materials/materials',
    'pages/bind/bind',
    'pages/profile/profile',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E3A5F',
    navigationBarTitleText: '吉他教室',
    navigationBarTextStyle: 'white',
  },
  // tabBar 图标需在微信开发者工具中上传 81x81 PNG 图标
  // 文件位置: src/assets/tab-*.png
  // 注意：上线前需要添加真实图标，否则默认文本tab也可以使用
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#1E3A5F',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '课程', iconPath: 'src/assets/tab-lessons-inactive.png', selectedIconPath: 'src/assets/tab-lessons.png' },
      { pagePath: 'pages/materials/materials', text: '课件', iconPath: 'src/assets/tab-materials-inactive.png', selectedIconPath: 'src/assets/tab-materials.png' },
      { pagePath: 'pages/profile/profile', text: '我的', iconPath: 'src/assets/tab-profile-inactive.png', selectedIconPath: 'src/assets/tab-profile.png' },
    ],
  },
})

export default defineAppConfig({
  pages: [
    'pages/performances/performances',
    'pages/rehearsals/rehearsals',
    'pages/songs/songs',
    'pages/resources/resources',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E3A5F',
    navigationBarTitleText: '乐队管理',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#1E3A5F',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/performances/performances', text: '演出', iconPath: 'assets/tab-performances-inactive.png', selectedIconPath: 'assets/tab-performances.png' },
      { pagePath: 'pages/rehearsals/rehearsals', text: '排练', iconPath: 'assets/tab-rehearsals-inactive.png', selectedIconPath: 'assets/tab-rehearsals.png' },
      { pagePath: 'pages/songs/songs', text: '歌单', iconPath: 'assets/tab-songs-inactive.png', selectedIconPath: 'assets/tab-songs.png' },
      { pagePath: 'pages/resources/resources', text: '资料', iconPath: 'assets/tab-resources-inactive.png', selectedIconPath: 'assets/tab-resources.png' },
    ],
  },
})

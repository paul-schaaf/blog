// .vuepress/config.js
module.exports = {
    title: 'paulx',
    theme: '@vuepress/theme-blog',
    head: [
      ['link', { rel: 'icon', href: '/logo.ico' }]
    ],
    markdown: {
      lineNumbers: true
    },
    themeConfig: {
        lastUpdated: 'LastUpdated',
        footer: {
            contact: [
                {
                    type: 'github',
                    link: 'https://github.com/paul-schaaf',
                },
                {
                    type: 'twitter',
                    link: 'https://twitter.com/blocks_go_brr',
                },
            ]
        },
        summary: false
    },
    plugins: [
      [
        'vuepress-plugin-container',
        {
          type: 'blog-meta',
          defaultTitle: '<div class="gray-section"><span class="title">Last updated: </span><span>{{$page.lastUpdated}}</span><p class="margin-bottom-zero"><span class="title">Time to read: </span>{{$page.readingTime.minutes}} minutes</p></div>'
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'theory-recap',
          before: '<div class="gray-section"><div class="title">theory recap 📚</div><ul style="margin-bottom: .5rem">',
          after: '</ul></div>'
        }
      ],
      'vuepress-plugin-reading-time',
      [
        'medium-zoom',
        {
          selector: 'div.zoom-image img'
        }
      ],
      'reading-progress'
    ]
}

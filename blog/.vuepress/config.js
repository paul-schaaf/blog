// .vuepress/config.js
module.exports = {
    title: 'paulx_blog',
    theme: '@vuepress/theme-blog',
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
          defaultTitle: '<div><span class="title">Last updated: </span>{{$page.lastUpdated}}<p class="margin-bottom-zero"><span class="title">Time to read: </span>{{$page.readingTime.minutes}} minutes</p></div>'
        },
      ],
      'vuepress-plugin-reading-time',
      [
        'medium-zoom',
        {
          selector: '.vuepress-blog-theme-content img:not(.no-medium-zoom)',
        },
      ],
      'reading-progress'
    ]
}

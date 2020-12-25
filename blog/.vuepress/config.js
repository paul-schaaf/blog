// .vuepress/config.js
module.exports = {
    title: 'paulx_blog',
    theme: '@vuepress/theme-blog',
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
          type: 'last-updated',
          defaultTitle: '<div class="last-updated"><span class="title">Last Updated: </span>{{$page.lastUpdated}}</div>'
        },
      ],
    ]
}

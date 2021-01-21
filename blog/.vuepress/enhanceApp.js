export default ({
    Vue,
    router,
    siteData,
    isServer
}) => {
    router.beforeEach((to, from, next) => {
            if (to.fullPath.startsWith("/2021")) {
                next({path: "/blog" + to.fullPath});
            } else {
                next();
            }
    });
}

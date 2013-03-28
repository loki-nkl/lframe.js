Initiate
========

All options of lframe.init() are optional.

    lframe.init({
      contentSelector:          '#page',
      menu:                     '#nav',
      menuChildrenSelector:     '> li',
      activeClass:              'active',
      bodyLoadingClass:         'loading',
      completedEventName:       'statechangecomplete',
      cacheables:               ["/", "/page1", "/images"],
      preload:                  ["/", "/page1", "/images"],
      preloadImagesBeforeShow:  true,
      preloadImagesEventName:   'imageloaded',
      loadingSelector:          false
    });
    
Helpers
=======

    lframe.reload();
    
    lframe.fullReload();
    
    lframe.go('/home');

Project Using lframe.js
=======================

[Lokinote.com](http://lokinote.com)

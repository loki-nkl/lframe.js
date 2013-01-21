// Modified from: https://gist.github.com/854622
// required: underscore.js, jQuery, History.js

(function(window,undefined){
  window.lframe = {};

  window.lframe.reload = function() {
    $(window).trigger('statechange');
  }

  window.lframe.fullReload = function() {
    window.location.href = window.History.getState().url;
  }

  window.lframe.go = function(url) {
    window.History.pushState(null, null, url);
  }

  window.lframe.init = function(opt) {
    opt = _.extend({
      contentSelector:          '#page',
      menu:                     '#nav',
      menuChildrenSelector:     '> li',
      activeClass:              'active',
      bodyLoadingClass:         'loading',
      completedEventName:       'statechangecomplete',
      cacheables:               [],
      preload:                  [],
      preloadImagesBeforeShow:  true,
      preloadImagesEventName:   'imageloaded',
    }, opt);
    
    // fall back to traditional http link if no history supported
    if ( !window.History.enabled ) return false;
    var $ = window.jQuery;

    // Wait for Document
    $(function(){
      var cachedPages = {};
      var cachedImages = {};
      var activeSelector = '.' + opt.activeClass;
      var $menu = $(opt.menu);
      var $content = $(opt.contentSelector);
      var $window = $(window);
      var $body = $(window.document.body);
      var rootUrl = window.History.getRootUrl();

      // Ensure Content
      if ( $content.length === 0 ) alert(opt.contentSelector + " not found");
      
      // Internal Helper
      // $('a:internal') to select all internal links
      $.expr[':'].internal = function(obj, index, meta, stack){
        var url = $(obj).attr('href') || '';
        // internal links mean
        // absolute link start from root url like http://myapp.com/abc.html
        // or all relative links, means no http:// prefixed
        return url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;
      };
      
      // Ajaxify Helper
      $.fn.ajaxify = function(){
        var $this = $(this);
        $this.find('a:internal:not(.no-ajaxy)').click(function(event){
          // Continue as normal for cmd clicks etc, open new tabs...
          if ( event.which == 2 || event.metaKey ) { return true; }

          var url = $(this).attr('href');
          window.History.pushState(null, null, url);
          event.preventDefault();
          return false;
        });
        return $this;
      };

      function changeDocumentTitle(title) {
        window.document.title = title;
        try {
          var titleHTML = window.document.title
            .replace('<','&lt;')
            .replace('>','&gt;')
            .replace(' & ',' &amp; ');
          window.document.getElementsByTagName('title')[0].innerHTML = titleHTML;
        }
        catch ( Exception ) { }
      }

      function updateActiveMenuItem(url) {
        $menu.find(opt.menuChildrenSelector)
          .filter(activeSelector).removeClass(opt.activeClass).end()
          .each(function() {
            var self = $(this);
            var href = $('a', self).prop('href');
            if (href === url) {
              self.addClass(opt.activeClass);
            }
          });
      }

      function loadSingleImage(src, callback) {
        if (cachedImages[src]) return callback();
        cachedImages[src] = new Image();
        cachedImages[src].onload = callback;
        cachedImages[src].onerror = callback;
        cachedImages[src].src = src;
      }

      function loadImages(images, finishedCallback) {
        var count = images.length;
        var finished = 0;
        images.forEach(function(src) {
          loadSingleImage(src, function() {
            finished++;
            $window.trigger(opt.preloadImagesEventName, [count, finished]);
            if (finished == count) finishedCallback();
          });
        });
      }

      function preloadImages($page, finishedCallback) {
        if (!opt.preloadImagesBeforeShow) return finishedCallback();
        var images = [];
        $('img', $page).each(function() {
          images.push(this.src);
        });
        $page.filter('img').each(function() {
          images.push(this.src);
        });
        if (images.length > 0) {
          loadImages(images, finishedCallback);
        } else {
          finishedCallback();
        }
      }

      function renderPage(html, url) {
        if (!html) {
          window.document.location.href = url;
          return false;
        }
        updateActiveMenuItem(url);

        var $data = $(html);
        var title = $data.filter('title').text();
        changeDocumentTitle(title);

        $page = $data.filter(opt.contentSelector);
        preloadImages($page, function() {
          // Update the content
          $content
            .stop(true,true)
            .html($page.children())
            .ajaxify()
            .fadeIn(500);
          $body.removeClass(opt.bodyLoadingClass);
          $window.trigger(opt.completedEventName, getRelativeUrl());
        });
      }

      function isCacheable(relativeUrl) {
        return _.include(opt.cacheables, relativeUrl);
      }

      function cachePageIfCacheable(html, relativeUrl) {
        if (isCacheable(relativeUrl)) {
          cachedPages[relativeUrl] = html;
        }
      }

      function removeCacheIfNotCacheable(relativeUrl) {
        if (!isCacheable(relativeUrl)) {
          cachedPages[relativeUrl] = null;
        }
      }

      function fetchAndCache(url, relativeUrl, render) {
        if (!relativeUrl) relativeUrl = url;
        $.ajax({
          url: url,
          success: function(html, textStatus, jqXHR){
            if (render === true) renderPage(html, url);
            cachePageIfCacheable(html, relativeUrl);
          },
          error: function(jqXHR, textStatus, errorThrown){
            window.document.location.href = url;
            return false;
          }
        });
      }

      function getFullUrl() {
        return window.History.getState().url;
      }

      function getRelativeUrl() {
        return '/' + getFullUrl().replace(rootUrl,'');
      }

      function initiatePlugin() {
        updateActiveMenuItem(getFullUrl());
        $body.ajaxify();
        opt.preload.forEach(function(p) { fetchAndCache(p); });
      }
      
      // Hook into State Changes
      $window.bind('statechange',function(){
        var url = getFullUrl();
        var relativeUrl = getRelativeUrl();

        // Set Loading class in body
        $body.addClass(opt.bodyLoadingClass);

        // Start Fade Out
        // Animating to opacity to 0 still keeps the element's height intact
        // Which prevents that annoying pop bang issue when loading in new content
        // TODO: better animation 
        $content.fadeOut(500);
        
        var cache = cachedPages[relativeUrl];
        if (cache) {
          renderPage(cache, url);
          removeCacheIfNotCacheable(relativeUrl);
        } else {
          fetchAndCache(url, relativeUrl, true);
        }
      }); // end onStateChange

      initiatePlugin();
      
    }); // end onDomLoad
  }

})(window);

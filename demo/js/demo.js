'use strict';

$(function() {

  $('a[href=#]').click(function() {
    alert('hash btn clicked');
  });

  lframe.init({
    cacheables: ["/demo/page1.html", "/demo/images.html"],
    preload: ["/demo/page1.html", "/demo/images.html"],
  });

  function updateLoadingStatus(p) {
    $('div.loading-status > div').css('width', p);
    $('div.loading-status > p').text(p);
  }

  $(window).on('imageloaded', function(e, total, items) {
    var p = Math.round((items * 100) / total) + '%';
    updateLoadingStatus(p);
  });

  $(window).on('statechangecomplete', function() {
    updateLoadingStatus(0);
  });

});

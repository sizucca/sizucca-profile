$(function(){
  var $body = $('#js-body');

  //-------------------------------------------------
  // スクロール処理
  //-------------------------------------------------
  var $globalNav         = $('#js-global-nav');
  var globalNavTop       = $globalNav.offset().top;
  var globalNavHeight    = $globalNav.outerHeight();
  var globalNavTrigger   = '.js-global-nav-trigger';
  var $globalNavTrigger  = $(globalNavTrigger);
  var scrollHeaderHeight = globalNavHeight + 15;
  var SCROLL_SPEED       = 250;
  var SCROLL_TIMER       = 400;
  var STATE_SCROLL       = 'is-scroll';
  var STATE_NAV_ACTIVE   = 'is-active';

  // block の情報を格納
  var blocks = [];
  $('.js-block').each(function(i, self){
    var blockID     = '#js-section-' + $(self).attr('data-block-id');
    var blockTop    = (i === 0) ? '0' : ($(self).offset().top - scrollHeaderHeight - 5);
    var blockHeight = $(self).outerHeight();
    var navID       = '#js-global-nav-' + $(self).attr('data-block-id');
    blocks[i] = {
      id:       blockID,
      top:      blockTop,
      bottom:   (blockTop + blockHeight),
      $nav:     $(navID)
    };
  });

  //------------------------------
  // scrollTopにhtmlが使えるか否か
  //------------------------------
  var checkHtmlScroll = function(){
    var $html   = $('html');
    var htmlTop = $html.scrollTop();
    var dom     = $('<div>').height(10000).appendTo('body');
    var result  = false;

    // 動くかどうかテスト
    $html.scrollTop(10000);
    result = !!$html.scrollTop();

    // 判定後は、scrollTopの位置を戻して判定に使ったDOMを削除
    $html.scrollTop(htmlTop);
    dom.remove();

    return result;
  };

  //------------------------------
  // イベント：画面スクロールoff
  //------------------------------
  var offScrollWindow = function(){
    return $(window).off('scroll');
  };

  //------------------------------
  // イベント：画面スクロールon
  //------------------------------
  var onScrollWindow = function(){
    var scrollTimer = false;
    var scrollTop   = 0;

    $(window).on('scroll', function(){
      if(scrollTimer !== false){
        clearTimeout(scrollTimer);
      }
      scrollTimer = setTimeout(function(){
        // スクロール位置を取得
        scrollTop = $(window).scrollTop();

        // スクロールしてるかどうか判断
        if(scrollTop > globalNavTop){
          $body.addClass(STATE_SCROLL);

          // スクロール範囲内にあるblockにis-activeを付与
          for(var i = 0, len = blocks.length; i < len; i++){
            // blockがスクロール範囲内にある場合
            if((scrollTop > blocks[i].top) && (scrollTop < blocks[i].bottom)){
              blocks[i].$nav.addClass(STATE_NAV_ACTIVE);
            }
            // blockがスクロール範囲内にない場合
            else{
              blocks[i].$nav.removeClass(STATE_NAV_ACTIVE);
            }
          }
        }
        else {
          moveNavActive('reset');
        }
      }, SCROLL_TIMER);
    });
  };

  //------------------------------
  // イベント：ナビゲーションクリック
  //------------------------------
  var onClickNavTrigger = function(){
    $('#js-global-heading, ' + globalNavTrigger).on('click', function(e){
      var targetID  = $(this).attr('href');
      var targetTop = $(targetID).offset().top - scrollHeaderHeight;

      // 一番最初の項目
      var triggerFirstID = $globalNavTrigger.eq(0).attr('href');
      if(targetID === triggerFirstID){
        targetTop = 0;
      }

      // アニメーションが終わるまで、scrollイベントをoff
      offScrollWindow();

      // アニメーション実行
      $(checkHtmlScroll() ? 'html' : 'body').animate({
        scrollTop: targetTop
      }, SCROLL_SPEED, function(){

        // ナビのis-active付け外し
        if(targetID === triggerFirstID){
          moveNavActive('reset');
        }
        else{
          moveNavActive(targetID);
        }

        // offにしたイベントを戻す
        onScrollWindow();
      });
      e.preventDefault();
    });
  };

  //------------------------------
  // イベント：ナビゲーション移動
  //------------------------------
  var moveNavActive = function(targetID){
    if(targetID === 'reset'){
      $body.removeClass(STATE_SCROLL);
      $globalNavTrigger.each(function(i, self){
        if(i === 0){
          $(self).addClass(STATE_NAV_ACTIVE);
        }
        else{
          $(self).removeClass(STATE_NAV_ACTIVE);
        }
      });
    }
    else{
      $body.addClass(STATE_SCROLL);
      $globalNavTrigger.each(function(i, self){
        if($(self).attr('href') === targetID){
          $(self).addClass(STATE_NAV_ACTIVE);
        }
        else{
          $(self).removeClass(STATE_NAV_ACTIVE);
        }
      });
    }
  };

  //------------------------------
  // イベント実行
  //------------------------------
  onScrollWindow();
  onClickNavTrigger();

  //-------------------------------------------------
  // 詳細の表示/非表示
  //-------------------------------------------------
  var $detailTrigger  = $('.js-detail-trigger');
  var $detailInside   = $('#js-detail-inside');
  var $detailPrev     = $('#js-detail-prev');
  var $detailNext     = $('#js-detail-next');
  var $detailClose     = $('#js-detail-close');
  var works           = '.js-works';
  var $works          = $(works);
  var worksElement    = '';

  var STATE_DISABLE        = 'is-disabled';
  var STATE_DETAIL_VISIBLE = 'is-detail-visible';
  var STATE_NO_SCROLL      = 'is-no-scroll';
  var ATTR_WORK_ITEM       = 'data-work-item';

  var workItemCount   = $detailTrigger.length;
  var clickFlug       = true;
  var listenEvents    = [
    'webkitTransitionEnd',
    'oTransitionEnd',
    'otransitionend',
    'transitionend'
  ];

  //------------------------------
  // 前後移動（最初と最後の場合は無効デザインに）
  //------------------------------
  var arrowPrevNext = function(idx){
    if(idx > 1){
      $detailPrev.removeClass(STATE_DISABLE);
    }
    else{
      $detailPrev.addClass(STATE_DISABLE);
    }
    if(idx < workItemCount){
      $detailNext.removeClass(STATE_DISABLE);
    }
    else{
      $detailNext.addClass(STATE_DISABLE);
    }
  };

  //------------------------------
  // イベント：詳細の表示
  //------------------------------
  var onClickDetailTrigger = function(){
    $detailTrigger.on('click', function(){
      // クリックされた要素が何番目か取得
      var index = parseInt($('.js-works .js-detail-trigger').index(this), 10) + 1;

      // 前後移動
      arrowPrevNext(index);

      // クローンした内容を入れる
      worksElement = $works.clone().addClass('is-detail').removeClass('is-list');
      $detailInside.append(worksElement);

      // クリックしたindex番号を入れる
      $detailInside.find(works).attr(ATTR_WORK_ITEM, index);

      // 詳細表示・画面スクロールの停止
      $body.addClass(STATE_DETAIL_VISIBLE).addClass(STATE_NO_SCROLL);
    });
  };

  //------------------------------
  // イベント：詳細を非表示
  //------------------------------
  var onClickDetailClose = function(){
    $detailClose.on('click', function(){
      // クローンした内容を削除
      $detailInside.find(works).remove();

      // 詳細非表示・画面スクロールの再開
      $body.removeClass(STATE_DETAIL_VISIBLE).removeClass(STATE_NO_SCROLL);
    });
  };

  //------------------------------
  // イベント：前移動
  //------------------------------
  var onClickDetailPrev = function(){
    $detailPrev.on('click', function(){
      if(clickFlug && !$(this).hasClass(STATE_DISABLE)){
        clickFlug = false;
        var itemNum = parseInt($detailInside.find(works).attr(ATTR_WORK_ITEM), 10);
        if(itemNum > 1){
          var prevNum = itemNum - 1;
          $detailInside.find(works).attr(ATTR_WORK_ITEM, prevNum).on(listenEvents.join(' '), function(){
            arrowPrevNext(prevNum);
            clickFlug = true;
          });
        }
      }
    });
  };

  //------------------------------
  // イベント：次移動
  //------------------------------
  var onClickDetailNext = function(){
    $detailNext.on('click', function(){
      if(clickFlug && !$(this).hasClass(STATE_DISABLE)){
        clickFlug = false;
        var itemNum = parseInt($detailInside.find(works).attr(ATTR_WORK_ITEM), 10);
        if(itemNum < workItemCount){
          var nextNum = itemNum + 1;
          $detailInside.animate({scrollTop: 0}, 100, function(){
            $detailInside.find(works).attr(ATTR_WORK_ITEM, nextNum).on(listenEvents.join(' '), function(){
              arrowPrevNext(nextNum);
              clickFlug = true;
            });
          });
        }
      }
    });
  };

  //------------------------------
  // イベント実行
  //------------------------------
  onClickDetailTrigger();
  onClickDetailClose();
  onClickDetailPrev();
  onClickDetailNext();

});

/**
 * Created by plthan on 12/18/2014.
 */
var Posts = (function () {
    var $window = $(window),
        $body = $('body'),
        Modernizr = window.Modernizr,
    // https://github.com/twitter/bootstrap/issues/2870
        transEndEventNames = {
            'WebkitTransition' : 'webkitTransitionEnd',
            'MozTransition' : 'transitionend',
            'OTransition' : 'oTransitionEnd',
            'msTransition' : 'MSTransitionEnd',
            'transition' : 'transitionend'
        },
        transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
        init = function () {
            Posts.container = $('#content-container');
            Posts.singlepost = Posts.container.children('div.single-post');
            Posts.photos = Posts.singlepost.find('div.single-photo');

            Posts.description = $('<div/>')
                .addClass('Posts-description').appendTo(Posts.singleview);
            addClickHandler();
        },
        addClickHandler = function () {
            Posts.photos.each(function () {
                $(this).find('img').on('click', show);
                console.log($(this).find('img'));
            });
        },
        getData = function ($post) {
            var img = $post.find('div.single-photo').find('img'),
                description = $post.find('.description');
            return {img: img, description: description};
        },
        show = function () {
            var post = $(this).closest('div.single-post'),
                data = getData(post);
            Posts.description.html(data.description);
            prepareFly(data.img);
            _setTransition(Posts.fly);
            transform();
        },
        prepareFly = function ($img) {
            Posts.fly = $('<img/>').attr('src', $img.attr('src')).addClass('Posts-img-fly').css({
                width: $img.width(),
                height: $img.height(),
                left: $img.offset().left + ( $img.outerWidth(true) - $img.width() ) / 2,
                top: $img.offset().top + ( $img.outerHeight(true) - $img.height() ) / 2
            }).appendTo($body);
            console.log(Posts.fly);
        },
        transform = function () {
            var styleCSS = {
                width: 'auto',
                height: $window.height(),
                top: 41,
                left: 13
            };
            _applyAnimation
            Posts.singleview.show();
        },
        _createSingleView = function () {
            $('<div class="Posts-single-view"><div class="Posts-options Posts-options-single"><div class="Posts-buttons"><button class="Posts-btn-close"></button></div></div></div>')
                .appendTo(Posts.container);
            Posts.singleview = Posts.container.children('div.Posts-single-view');
            Posts.svclose = Posts.singleview.find('button.Posts-btn-close');
        },
    // sets a transition for an element
        _setTransition = function (el) {
            var property = 'all',
                speed = 300,
                easing = 'ease-in-out';
            el.css('transition', property + ' ' + speed + 'ms ' + easing);

        },
    // apply a transition or fallback to jquery animate based on condition (cond)
        _applyAnimation = function (el, styleCSS, speed, cond, fncomplete) {

            $.fn.applyStyle = cond ? $.fn.css : $.fn.animate;

            if (fncomplete && cond) {

                el.on(transEndEventName, fncomplete);

            }

            fncomplete = fncomplete || function () {
                return false;
            };

            el.stop().applyStyle(styleCSS, $.extend(true, [], { duration: speed + 'ms', complete: fncomplete }));

        },
        _initEvents = function (type) {

            switch (type) {

                case 'window' :

                    if (Posts.settings.historyapi) {

                        $window.on('statechange.Posts', function () {

                            _goto(true);

                        });

                    }

                    $window.on('smartresize.Posts', _resize);

                    // use the property name to generate the prefixed event name
                    var visProp = getHiddenProp();

                    // HTML5 PageVisibility API
                    // http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
                    // by Joe Marini (@joemarini)
                    if (visProp) {

                        var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
                        document.addEventListener(evtname, _visChange);

                    }

                    break;

                case 'singleview' :

                    Posts.items.each(function () {
                        $(this).find('img').on('click.Posts', _singleview);
                        console.log($(this).find('img'));
                    });
                    Posts.svclose.on('click.Posts', _closesingleview);

                    break;
            }
            ;
            return {
                init: init
            }
        }
})();
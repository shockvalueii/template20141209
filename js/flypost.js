/**
 * Created by plthan on 12/19/2014.
 */
var FlyPost = (function () {
    var $window = $(window),
        $body = $('body'),
        $document = $(document),
        Modernizr = window.Modernizr,
    // https://github.com/twitter/bootstrap/issues/2870
        transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        },
        transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ],
    // default settings
        defaults = {
            // default value for masonry column count
            columns: 4,
            // transition properties for the images in ms (transition to/from singleview)
            speed: 300,
            easing: 'ease',
            // if set to true the overlay's opacity will animate (transition to/from singleview)
            overlayAnimated: true,
            // if true, the navigate next function is called when the image (singleview) is clicked
            nextOnClickImage: true,
            // circular navigation
            circular: true,
            // transition settings for the image in the single view.
            // These includes:
            // - ajusting its position and size when the window is resized
            // - fading out the image when navigating
            svImageTransitionSpeedFade: 300,
            svImageTransitionEasingFade: 'ease-in-out',
            svImageTransitionSpeedResize: 300,
            svImageTransitionEasingResize: 'ease-in-out',
            svMarginsVH: {
                vertical: 60,
                horizontal: 50
            },
            // slideshow interval (ms)
            interval: 4000
        },
        init = function (settings, callback) {

            FlyPost.settings = $.extend(true, {}, defaults, settings);
            // cache some elements..
            _config();
            _createSingleView();
        },
        _config = function () {
            FlyPost.container = $('#content-container');
            FlyPost.gallery = FlyPost.container.children('ul');
            FlyPost.overlay = FlyPost.container.find('div.gamma-overlay ');
            //<li> elements
            FlyPost.singleposts = FlyPost.gallery.children('li');
            // true if any animation (including preloading an image) running
            FlyPost.isAnimating = true;
            FlyPost.svMargins = FlyPost.settings.svMarginsVH;
            FlyPost.supportTransitions = Modernizr.csstransitions;
            $window.on('resize', _svResizeImage);
        },
        _createSingleView = function ($items) {

            var $items = $items || FlyPost.singleposts.hide();

            //with every <li>
            $items.each(function () {
                //$item is <li>
                var $item = $(this),
                    $divEl = $item.children('div'),
                    sources = _getImgSources($divEl),
                    source = _chooseImgSource(sources, FlyPost.container.width()),
                    title = $divEl.data('title'),
                    postlink = $divEl.data('postlink'),
                    author = $divEl.data('author'),
                    avatar = $divEl.data('avatar'),
                    authorlink = $divEl.data('authorlink'),
                    time = $divEl.data('timepost'),
                    description = $divEl.data('description'),
                    category = $divEl.data('category'),
                    categorylink = $divEl.data('categorylink'),
                    index = $divEl.index();

                // data is saved in the <li> element
                // <li> elements are in FlyPost.singleposts
                $item.data({
                    description: description,
                    title: title,
                    postlink: postlink,
                    author: author,
                    avatar: avatar,
                    authorlink: authorlink,
                    time: time,
                    category: category,
                    categorylink: categorylink,
                    source: sources
                });

                var $post = $('<div class="single-post"><div class="content"><div class="info info-photo"><h3 class="title"></h3><small class="category"><span class="avatar"><img/></span>&nbsp;&nbsp;</small></div><div class="single-photo"><img/></div><div class="info"><div class="info-detail"><div class="description"><p></p><small><i class="fa fa-clock-o"></i>&nbsp;</small></div></div></div><div class="comment"></div></div></div>').appendTo($item);

                $post.find('h3.title').text(title);
                $post.find('span.avatar').find('img').attr('src', avatar);
                $('<span></span>').html('<a href="' + authorlink + '">' + author + '</a> post in <a href="' + categorylink + '">' + category + '</a>').insertAfter($post.find('span.avatar'));
                $post.find('div.single-photo').find('img').attr('src', source.src);
                $post.find('div.description').find('p').html(description);
                $post.find('div.description').find('small').append(time);

                $divEl.remove();
            });
            if (!FlyPost.singleview) {
                // the single view will include the image, navigation buttons and close, play, and pause buttons
                $('<div class="gamma-single-view"><div class="gamma-options gamma-options-single"><div class="gamma-buttons"><button class="gamma-btn-close"></button></div></div></div>')
                    .appendTo(FlyPost.container);
                FlyPost.singleview = FlyPost.container.children('div.gamma-single-view');
                FlyPost.svclose = FlyPost.singleview.find('button.gamma-btn-close');
                FlyPost.svclose.on('click.flypost', _closesingleview);
            }

            $items.each(function () {
                $(this).css({display:'inline-block',width:'100%'}).fadeIn("slow");
                $(this).find('div.single-photo').find('img').on('click.flypost', _singleview);
//                console.log("added");
            })
        },
    // gets all possible image sources of an element
        _getImgSources = function ($el) {

            var theSources = [];
            $el.find('div').each(function (i) {

                var $source = $(this);
                theSources.push({
                    width: $source.data('minWidth') || 0,
                    src: $source.data('src'),
                    pos: i
                });

            });

            return theSources;

        },
    // triggered when one grid image is clicked
        _singleview = function () {

            var id = $(this).closest('li').index();

            console.log(id);
            console.log(FlyPost.singleposts.size());
            var $item = FlyPost.singleposts.eq(Math.abs(id));
            console.log($item.attr('class'));

            if ($item.length) {
                _singleviewitem($item);
            }

        },
    // shows the item
        _singleviewitem = function ($item) {

            var data = $item.data(),
                $img = $item.find('div.single-photo').find('img');

            FlyPost.fly = $('<img/>').attr('src', $img.attr('src')).addClass('gamma-img-fly').css({
                width: $img.width(),
                height: $img.height(),
                left: $img.offset().left,
                top: $img.offset().top
            }).appendTo($body);

            FlyPost.current = $item.index();
            if (FlyPost.supportTransitions) {

                _setTransition(FlyPost.fly);

            }

            // need to know which source to load for the image.
            // also need to know the final size and position.
            var finalConfig = _getFinalImgConfig({

                    sources: $item.data('source'),
                    wrapper: { width: $window.width() - FlyPost.svMargins.horizontal, height: $window.height() - FlyPost.svMargins.vertical },
                    image: { width: $img.width(), height: $img.height() }

                }),
                source = finalConfig.source,
                finalSizePosition = finalConfig.finalSizePosition;

            // transition: overlay opacity
            FlyPost.overlay.show();

            if (FlyPost.settings.overlayAnimated && FlyPost.supportTransitions) {

                _setTransition(FlyPost.overlay, 'opacity');

            }

            setTimeout(function () {

                _applyAnimation(FlyPost.overlay, { 'opacity': 1 }, FlyPost.settings.speed, FlyPost.supportTransitions, function () {

                    if (FlyPost.supportTransitions) {
                        $(this).off(transEndEventName);
                    }

                    // set the overflow-y to hidden
                    //body.css('overflow-y', 'hidden');
                    // force repaint. Chrome in Windows does not remove overflow..
                    // http://stackoverflow.com/a/3485654/989439
                    var el = FlyPost.overlay[0];
                    el.style.display = 'none';
                    el.offsetHeight; // no need to store this anywhere, the reference is enough
                    el.style.display = 'block';
//                    console.log(FlyPost.overlay);

                });

                $item.css('visibility', 'hidden');

                var styleCSS = {
                        width: finalSizePosition.width,
                        height: finalSizePosition.height,
                        left: finalSizePosition.left + $window.scrollLeft() + FlyPost.svMargins.horizontal / 2,
                        top: finalSizePosition.top + $window.scrollTop() + FlyPost.svMargins.vertical / 2
                    },
                    cond = FlyPost.supportTransitions;

                _applyAnimation(FlyPost.fly, styleCSS, FlyPost.settings.speed, cond, function () {

                    if (cond) {
                        $(this).off(transEndEventName);
                    }

                    _loadSVItemFromGrid(data, finalSizePosition, source.src);

                });
            }, 25);

        },
    // sets a transition for an element
        _setTransition = function (el, property, speed, easing) {

            if (!property) {

                property = 'all';

            }
            if (!speed) {

                speed = FlyPost.settings.speed;

            }
            if (!easing) {

                easing = FlyPost.settings.easing;

            }

            el.css('transition', property + ' ' + speed + 'ms ' + easing);

        },
    // gets the position and sizes of the image given its container properties
        _getFinalImgConfig = function (properties) {

            var sources = properties.sources,
                imgMaxW = properties.imgMaxW || 0,
                imgMaxH = properties.imgMaxH || 0;
            var source = _chooseImgSource(sources, properties.wrapper.width),
            // calculate final size and position of image
                finalSizePosition = _getFinalSizePosition(properties.image, properties.wrapper);

            // check for new source
            if (finalSizePosition.checksource) {

                source = _chooseImgSource(sources, finalSizePosition.width);

            }

            // we still need to check one more detail:
            // if the source is the largest one provided in the html rules,
            // then we need to check if the final width/height are eventually bigger
            // than the original image sizes. If so, we will show the image
            // with its original size, avoiding like this that the image gets pixelated
            if (source.pos === 0 && ( imgMaxW !== 0 && finalSizePosition.width > imgMaxW || imgMaxH !== 0 && finalSizePosition.height > imgMaxH )) {

                if (imgMaxW !== 0 && finalSizePosition.width > imgMaxW) {

                    var ratio = finalSizePosition.width / imgMaxW;
                    finalSizePosition.width = imgMaxW;
                    finalSizePosition.height /= ratio;

                }
                else if (imgMaxH !== 0 && finalSizePosition.height > imgMaxH) {

                    var ratio = finalSizePosition.height / imgMaxH;
                    finalSizePosition.height = imgMaxH;
                    finalSizePosition.width /= ratio;

                }

                finalSizePosition.left = properties.wrapper.width / 2 - finalSizePosition.width / 2;
                finalSizePosition.top = properties.wrapper.height / 2 - finalSizePosition.height / 2;

            }

            return {
                source: source,
                finalSizePosition: finalSizePosition
            };

        },
    // choose a source based on the item's size and on the configuration set by the user in the initial HTML
        _chooseImgSource = function (sources, w) {
            if (w <= 0) {
                w = 1;
            }

            for (var i = 0, len = sources.length; i < len; ++i) {

                var source = sources[i];


                if (w > source.width) {

                    return source;

                }

            }

        },
    // given the wrapper's width and height, calculates the final width, height, left and top for the image to fit inside
        _getFinalSizePosition = function (imageSize, wrapperSize) {

            // image size
            var imgW = imageSize.width,
                imgH = imageSize.height,

            // container size
                wrapperW = wrapperSize.width,
                wrapperH = wrapperSize.height,

                finalW, finalH, finalL, finalT,
            // flag to indicate we could check for another source (smaller) for the image
                checksource = false;

            // check which image side is bigger
            if (imgW > imgH) {

                finalW = wrapperW;
                // calculate the height given the finalW
                var ratio = imgW / wrapperW;

                finalH = imgH / ratio;

                if (finalH > wrapperH) {

                    checksource = true;
                    ratio = finalH / wrapperH;
                    finalW /= ratio;
                    finalH = wrapperH;

                }

            }
            else {

                finalH = wrapperH;
                // calculate the width given the finalH
                var ratio = imgH / wrapperH;

                finalW = imgW / ratio;

                checksource = true;

                if (finalW > wrapperW) {

                    checksource = false;

                    ratio = finalW / wrapperW;
                    finalW = wrapperW;
                    finalH /= ratio;

                }

            }

            return {
                width: finalW,
                height: finalH,
                left: wrapperW / 2 - finalW / 2,
                top: wrapperH / 2 - finalH / 2,
                checksource: checksource
            };

        },
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
    // load new image for the new item to show
        _loadSVItemFromGrid = function (data, position, src) {

            // show single view
            FlyPost.singleview.show();

            // add description
            if (!FlyPost.svDescription) {

                FlyPost.svDescription = $('<div/>')
                    .addClass('gamma-description')
                    .appendTo(FlyPost.singleview).wrap('<div class="gamma-description-wrapper"></div>');

                if (FlyPost.supportTransitions) {

                    _setTransition(FlyPost.svDescription, 'opacity', FlyPost.settings.svImageTransitionSpeedFade / 2, FlyPost.settings.svImageTransitionEasingFade);

                }

            }
            FlyPost.svDescription.html(data.title);

            // loading status: give a little amount of time before displaying it
            var loadingtimeout = setTimeout(function () {
                FlyPost.singleview.addClass('gamma-loading');
            }, FlyPost.settings.svImageTransitionSpeedFade + 250);

            // preload the new image
            FlyPost.svImage = $('<img/>').load(function () {

                var $img = $(this);

                // remove loading status
                clearTimeout(loadingtimeout);
                FlyPost.singleview.removeClass('gamma-loading');

                setTimeout(function () {

                    _applyAnimation(FlyPost.svDescription, { 'opacity': 1 }, FlyPost.settings.svImageTransitionSpeedFade / 2, FlyPost.supportTransitions);

                }, 25);

                $img.css({
                    width: position.width,
                    height: position.height,
                    left: position.left + FlyPost.svMargins.horizontal / 2,
                    top: position.top + FlyPost.svMargins.vertical / 2
                }).appendTo(FlyPost.singleview);

                if (FlyPost.supportTransitions) {

                    _setTransition($img, 'all', FlyPost.settings.svImageTransitionSpeedResize, FlyPost.settings.svImageTransitionEasingResize);

                }

                if (FlyPost.fly) {

                    if (FlyPost.supportTransitions) {

                        _setTransition(FlyPost.fly, 'opacity', 1000);

                    }
                    setTimeout(function () {

                        _applyAnimation(FlyPost.fly, { 'opacity': 0 }, 1000, FlyPost.supportTransitions, function () {

                            var $this = $(this);

                            if (FlyPost.supportTransitions) {
                                $this.off(transEndEventName);
                            }
                            $this.remove();
                            FlyPost.fly = null;
                            FlyPost.isAnimating = false;

                        });

                    }, 25);

                }
                else {

                    FlyPost.isAnimating = false;

                }

            }).data(data).attr('src', src);

        },
    // closes the single view
        _closesingleview = function () {

            if (FlyPost.isAnimating || FlyPost.fly) {

                return false;

            }

            FlyPost.isSV = false;

            var $item = FlyPost.singleposts.eq(FlyPost.current),
                $img = $item.find('div.single-photo').find('img');

            FlyPost.singleposts.not($item).css('visibility', 'visible');

            // scroll window to item's position if item is not "partially" visible
            var wst = $window.scrollTop();

            if (!$item.is(':inViewport')) {

                wst = $item.offset().top + ( $item.outerHeight(true) - $item.height() ) / 2;

                var diff = $document.height() - $window.height();

                if (wst > diff) {

                    wst = diff;
                }

                $window.scrollTop(wst);

            }

            var l = FlyPost.svImage.position().left + $window.scrollLeft(),
                t = FlyPost.svImage.position().top + wst;

            FlyPost.svImage.appendTo($body).css({
                position: 'absolute',
                zIndex: 10000,
                left: l,
                top: t
            });

            if (FlyPost.supportTransitions) {

                _setTransition(FlyPost.svImage);

            }

            FlyPost.singleview.hide();
            FlyPost.svDescription.empty().css('opacity', 0);
            $body.css('overflow-y', 'scroll');

            setTimeout(function () {

                var styleCSS = {
                    width: $img.width(),
                    height: $img.height(),
                    left: $img.offset().left,
                    top: $img.offset().top
                }
//                console.log(styleCSS);
                _applyAnimation(FlyPost.svImage, styleCSS, FlyPost.settings.speed, FlyPost.supportTransitions, function () {

                    $item.css('visibility', 'visible');
                    $(this).remove();
                    FlyPost.svImage = null;

                });

                // transition: overlay opacity
                if (FlyPost.settings.overlayAnimated) {

                    if (FlyPost.supportTransitions) {

                        _setTransition(FlyPost.overlay, 'opacity');

                    }

                    _applyAnimation(FlyPost.overlay, { 'opacity': 0 }, FlyPost.settings.speed, FlyPost.supportTransitions, function () {

                        var $this = $(this);

                        if (FlyPost.supportTransitions) {
                            $this.off(transEndEventName);
                        }

                        $this.hide();

                    });

                }
                else {

                    FlyPost.overlay.hide();

                }
            }, 25);

        },
    // resize and chooses (if necessary) a new source for the image in the single view
        _svResizeImage = function (callback) {

            // need to know which source to load for the image.
            // also need to know the final size and position.
            var finalConfig = _getFinalImgConfig({

                    sources: FlyPost.svImage.data('source'),
                    wrapper: { width: $window.width() - FlyPost.svMargins.horizontal, height: $window.height() - FlyPost.svMargins.vertical },
                    image: { width: FlyPost.svImage.width(), height: FlyPost.svImage.height() }

                }),
                source = finalConfig.source,
                finalSizePosition = finalConfig.finalSizePosition,

                currentSrc = FlyPost.svImage.attr('src'),

                finalStyle = {
                    width: finalSizePosition.width,
                    height: finalSizePosition.height,
                    left: finalSizePosition.left + FlyPost.svMargins.horizontal / 2,
                    top: finalSizePosition.top + FlyPost.svMargins.vertical / 2
                };

            _applyAnimation(FlyPost.svImage, finalStyle, FlyPost.settings.svImageTransitionSpeedResize, FlyPost.supportTransitions, function () {

                if (FlyPost.supportTransitions) {
                    $(this).off(transEndEventName);
                }

                // if source changes, change reset Gamma.svImage
                if (currentSrc !== source.src) {

                    // going to load a new image..
                    FlyPost.isAnimating = true;

                    var w = FlyPost.svImage.width(),
                        h = FlyPost.svImage.height(),
                        l = FlyPost.svImage.position().left,
                        t = FlyPost.svImage.position().top;

                    FlyPost.svImage = $('<img/>').load(function () {

                        var $img = $(this);

                        if (FlyPost.supportTransitions) {

                            _setTransition($img, 'all', FlyPost.settings.svImageTransitionSpeedResize, FlyPost.settings.svImageTransitionEasingResize);

                        }

                        _applyAnimation($img.next(), { opacity: 0 }, 500, FlyPost.supportTransitions, function () {

                            var $img = $(this);
                            if (FlyPost.supportTransitions) {
                                $(this).off(transEndEventName);
                            }
                            $img.remove();
                            FlyPost.isAnimating = false;

                        });

                    })
                        .css({ width: w, height: h, left: l, top: t })
                        .data(FlyPost.svImage.data())
                        .insertBefore(FlyPost.svImage)
                        .attr('src', source.src);

                }

                if (callback) {

                    callback.call();

                }

            });
        },
        add = function (data) {
//            console.log(data);
            if (data) {
                //var $newitems = $('<li></li>').attr('id', data.id),
                var $newitems = $('<li></li>').attr('id', new Date().getSeconds().toString()),
                    $divEl = $('<div></div>');
                $divEl.data(data.data[0]);
                $.each(data.sources, function(k, v){
                    $.each(v, function(kk,vv){
                        var $sourceDiv = $('<div></div>');
                        $sourceDiv.data({minWidth:kk,src:vv});
                        $divEl.append($sourceDiv);
//                        console.log(kk + " " + vv);
                    })
                });
                $newitems.append($divEl);

                FlyPost.gallery.append($newitems);
                //<li> element
                FlyPost.singleposts = FlyPost.gallery.find('li');
                _createSingleView($newitems);
            }
        }
    return{
        init: init,
        add: add
    }
})();
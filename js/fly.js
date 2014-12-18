/**
 * Created by plthan on 12/18/2014.
 */
var Posts = (function() {
    var $body = $( 'body' ),
        init = function(){
            Posts.container = $('#content-container');
            Posts.singleposts = Posts.container.children('div.single-post');
            Posts.photos = Posts.singleposts.find('div.single-photo');
            addClickHandler();
        },
        addClickHandler = function(){
            Posts.photos.each(function(){
                $(this).find('img').on( 'click',show );
                console.log($(this).find('img'));
            });
        },
        getData = function( $post ){
                var img = $post.find('div.single-photo').find('img'),
                    info = $post.find('.info');
            return {img : img, info : info};
        },
        show = function(){
            var post = $(this).closest('div.single-post'),
                data = getData(post);
            prepareFly(data.img);
        },
        prepareFly = function( $img ){
            Posts.fly = $( '<img/>' ).attr( 'src', $img.attr( 'src' ) ).addClass( 'gamma-img-fly' ).css( {
                width : $img.width(),
                height : $img.height(),
                left : $img.offset().left + ( $img.outerWidth( true ) - $img.width() ) / 2,
                top : $img.offset().top + ( $img.outerHeight( true ) - $img.height() ) / 2
            } ).appendTo( $body );
        };
    return {
        init : init
    }
})();
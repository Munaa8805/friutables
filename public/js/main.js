(function ($) {
    "use strict";

    // Page spinner: show before navigation/submits, hide on load
    var $spinner = $('#spinner');
    var showSpinner = function () {
        if ($spinner.length) {
            $spinner.addClass('show');
        }
    };
    var hideSpinner = function () {
        if ($spinner.length) {
            $spinner.removeClass('show');
        }
    };
    hideSpinner();
    $(window).on('load pageshow', hideSpinner);

    $(document).on('submit', 'form', function () {
        if (!$(this).is('[data-no-spinner]')) {
            showSpinner();
        }
    });

    $(document).on('click', 'a[href]', function (e) {
        if (e.which && e.which !== 1) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if ($(this).is('[data-no-spinner]') || $(this).attr('target') === '_blank' || $(this).attr('download')) return;
        var href = $(this).attr('href') || '';
        if (!href || href === '#' || href.indexOf('javascript:') === 0 || href.indexOf('#') === 0) return;
        if (href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0) return;
        showSpinner();
    });

    // Fixed Navbar
    $(window).scroll(function () {
        if ($(window).width() < 992) {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow');
            } else {
                $('.fixed-top').removeClass('shadow');
            }
        } else {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow').css('top', -55);
            } else {
                $('.fixed-top').removeClass('shadow').css('top', 0);
            }
        } 
    });
    
    
   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // vegetable carousel (only on pages that include .vegetable-carousel — avoids Owl errors on Contact, etc.)
    var $vegCarousel = $(".vegetable-carousel");
    if ($vegCarousel.length) {
        $vegCarousel.owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            center: false,
            dots: true,
            loop: true,
            margin: 25,
            nav: true,
            navText: [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0: { items: 1 },
                576: { items: 1 },
                768: { items: 2 },
                992: { items: 3 },
                1200: { items: 4 }
            }
        });
    }

    // Product detail: image thumbnails
    $(document).on('click', '.product-thumb', function () {
        var url = $(this).data('img');
        var $main = $('#productMainImg');
        if ($main.length && url) {
            $main.attr('src', url);
        }
        $('.product-thumb').removeClass('border-primary');
        $(this).addClass('border-primary');
    });

    // Modal Video (home / shop templates with #videoModal only)
    $(document).ready(function () {
        var $videoSrc;
        var $modal = $('#videoModal');
        if (!$modal.length) {
            return;
        }
        $('.btn-play').on('click', function () {
            $videoSrc = $(this).data("src");
        });
        $modal.on('shown.bs.modal', function () {
            if ($videoSrc) {
                $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
            }
        });
        $modal.on('hide.bs.modal', function () {
            $("#video").attr('src', $videoSrc || '');
        });
    });

})(jQuery);


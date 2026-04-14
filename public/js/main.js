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

    // Product detail: same-category products (prev/next scroll)
    var $relatedCarousel = $(".related-products-carousel");
    if ($relatedCarousel.length) {
        var relatedCount = $relatedCarousel.children().length;
        $relatedCarousel.owlCarousel({
            autoplay: false,
            smartSpeed: 500,
            center: false,
            dots: false,
            loop: relatedCount > 4,
            margin: 24,
            nav: true,
            navText: [
                '<i class="bi bi-arrow-left" aria-hidden="true"></i>',
                '<i class="bi bi-arrow-right" aria-hidden="true"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0: { items: 1 },
                576: { items: 2 },
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
        var gIdx = parseInt($(this).attr('data-gallery-index'), 10);
        if (!isNaN(gIdx)) {
            $('#productDetailGallery').attr('data-current-index', String(gIdx));
        }
        $('.product-thumb')
            .removeClass('border-primary border-2')
            .addClass('border-secondary')
            .attr('aria-pressed', 'false');
        $(this)
            .removeClass('border-secondary')
            .addClass('border-primary border-2')
            .attr('aria-pressed', 'true');
    });

    // Product detail: open Lightbox2 at current image (multi-photo); prev/next inside modal scrolls album
    $(document).on('click', '.product-detail-gallery-opener', function (e) {
        e.preventDefault();
        var idx = parseInt($('#productDetailGallery').attr('data-current-index'), 10) || 0;
        var anchor = document.getElementById('product-gallery-anchor-' + idx);
        if (anchor) {
            anchor.click();
        }
    });

    $(document).on('keydown', '.product-detail-gallery-opener', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).trigger('click');
        }
    });

    if ($('#productDetailGallery').length && typeof lightbox !== 'undefined') {
        var gc = parseInt($('#productDetailGallery').attr('data-gallery-count'), 10) || 0;
        if (gc > 1) {
            lightbox.option({ wrapAround: true });
        }
    }

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


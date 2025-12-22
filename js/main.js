    let fix_top = $(".fix_form_wrap").offset().top;
    let win_height = $(window).height();
    let s_top = $("html").scroll();
    let formHeight = $(".fix_form").outerHeight();
    if (s_top + win_height - formHeight >= fix_top) {
        $(".fix_form").css("position", "relative");
    } else {
        $(".fix_form").css("position", "fixed");
    }
    $(window).on("scroll", function () {
        s_top = $("html").scrollTop();
        console.log(s_top);
        console.log(fix_top);
        if (s_top + win_height - formHeight >= fix_top) {
            $(".fix_form").css("position", "relative");
        } else {
            $(".fix_form").css("position", "fixed");
        }
    });
    $("#gnb ul li").on("mouseenter", function () {
        $(this).find(".info").stop(true).fadeIn(300);
    });
    $("#gnb ul li").on("mouseleave", function () {
        $(this).find(".info").fadeOut(300);
    });
    
    $(".scroll_top").on("click", function (e) {
        e.preventDefault();

    $("html, body").animate(
        {
        scrollTop: 0,
        },
        500
    ); // 0.5초
    });
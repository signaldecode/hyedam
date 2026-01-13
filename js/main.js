
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
    $('#mob_nav em a').on('click',function(){
        $(this).parents('.mob_menu').find('ul').stop(true).slideToggle();
        $('#mob_nav em a').not(this).parents('.mob_menu').find('ul').stop(true).slideUp();
    });
    $('#mob_nav .close_btn').on('click',function(){
        $('#mob_nav').fadeOut();
    });
    $('#mob_header .nav_btn').on('click',function(){
        $('#mob_nav').fadeIn();
    });
    $('.quick_open').on('click',function(){
        $(this).parents('.mob_quick').find('ul').stop(true,true).fadeToggle();
        $(this).parents('.mob_quick').toggleClass('on');
    });
    $(document).on('click','.sucsess_close,.form_success_wrap',function(){
        $('.form_success_wrap').remove();
    });

    $(document).on('click', '.form_success', function (e) {
    e.stopPropagation();
    });
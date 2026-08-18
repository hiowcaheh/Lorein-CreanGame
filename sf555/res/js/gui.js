var youtube_width = '560';
var player;
var isLayerLogin = true;
var playerclass = 1;

function setPlayerclass(pc){
  playerclass = pc;
  chosen_world_link = $('#act_world_p').attr('rel');
}



function gotoGame(addPlayerClass){
  //alert(playerclass);
  var link = chosen_world_link;
  if(addPlayerClass == true){
    link += '?playerclass=' + playerclass;
  } else {
    //link +='?login';
  }
  if (query){
    if(!link.match(/\?/)){
      link += "?";
    } else if(!link.match(/&/)){
      link += "&";
    }
    
    link += query;
  }
  var a = document.createElement('a');
  a.href = link;

  setCookieValue("server", a.host);

  rfa_click(link, 'lp_b_neu');

  location.href = link;

  /*
   $.ajaxSetup({timeout:3000});
   $.get("pixel.php" + query).always(function(){
   location.href = link;
   });
   */
  return false;
};

function createChar(){
  //event.preventDefault();
  $("").toggle_overlay();
  $(".overlays").css("top",$(document).scrollTop()+50);
  $("#layer_world").fadeIn();
  isLayerLogin = false;
};


function onYouTubeIframeAPIReady() {
  player = new YT.Player('trailer_id', {
    // height: '358' ,
    // width: youtube_width,
    videoId: 'jPilXs_G5hw',
    playerVars: {
      controls: 0,
      showinfo: 0 ,
      modestbranding: 1,
      wmode: "opaque"
    }

  });
}

function getCookieValue(key){
  var a = document.cookie;
  if (a == ""){
    return "";
  }
  res = '';
  pairs = a.split(';');
  for(i=0;i<pairs.length;i++){
    value = pairs[i].split('=');
    value[0] = value[0].replace(new RegExp("^[\\s]+", "g"), "");
    if(value.length > 1 && value[0] == key){
      return value[1];
    }
  }

}
function setCookieValue(key, value){
  if (value == ""){
    return;
  }
  var date = new Date();
  date.setTime(date.getTime()+(365*24*60*60*1000));
  var expires = "; expires="+date.toGMTString();
  //console.log("set cookie: " + value);
  document.cookie = key + '=' + value + expires;
}

/** JS for GUI animation **/
$(document).ready(function(e) {
  if(is_ie_lt9  && ($(window).width() <= 1024)) {

    $("head").append('<link href="res/css/ie2spaltig.css" rel="stylesheet" name="iespalten" type="text/css" />');
  } else if (is_ie_lt9 && ($(window).width() >= 1024)) {
    $("link[name=iespalten]").remove();
  }


  var toogleLayer = 0;
  var screens_loaded=0;
  var tmp;

  $.fn.hasAncestor = function(a) {
    return this.filter(function() {
      return !!$(this).closest(a).length;
    });
  };

  // Choose last chosen world
  if (getCookieValue("server")){
    $.each($("a.choose_world_click"), function(key, value){
      if (value.host == getCookieValue("server")){
        change_world(null, $(this));
      }
    });
  }

  chosen_world_link = $('#act_world_p').attr('rel');

  $('body').on('click touchstart',function(e) {
    var target = $(e.target);

    if((!target.hasAncestor('.dropdown').length) && (!target.parent("div").hasClass("arrow"))) {
      //alert(target.attr('class'));
      $('.dropdown div.scrollable').fadeOut();
    }
  });


  $('#layer_world .choose_world ul li').first().find('a').addClass('new_flag');
  $('#header #language').css({
    right: '+='+ $('#header #language .inside').width()
  });
  $('.lang_dropdown a').wrap('<span class="lang_ticker" />');
  $('.choose_world .lang_dropdown a').unwrap('<span class="lang_ticker" />');


  $('#login a').attr('rel',chosen_world_link);
  if((navigator.userAgent.match(/MSIE\s(?!9.0)/)) && ($(document).width() <= 1024)) {
    $("head").append('<link href="res/css/ie2spaltig.css" rel="stylesheet" type="text/css" />');
  }
  if( /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent) ) {


    $("head").append('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">');
    //$("body").css("overflow-x","hidden");
  } else {

  }
  var dropdown_header, dropdown_lang, dropdown_world;
  $.fn.dropdown_fadeout = function(el) {

    $(this).children('div.scrollable').fadeOut();
  };
  $("#header .dropdown, #header .arrow").hover(function() {
    window.clearTimeout(dropdown_header);
  },function() {
    if(!$(this).hasAncestor('.mobile_dropdown').length) {
      dropdown_header = window.setTimeout('$("#header .dropdown").dropdown_fadeout()',500);
    }
  });
  $("#layer_world .choose_lang").hover(function() {
    window.clearTimeout(dropdown_lang);
  },function() {
    if(!$(this).hasAncestor('.mobile_dropdown').length) {
      dropdown_lang = window.setTimeout('$("#layer_world .choose_lang").dropdown_fadeout()',500);
    }
  });
  $("#layer_world .choose_world").hover(function() {
    window.clearTimeout(dropdown_world);
  },function() {
    if(!$(this).hasAncestor('.mobile_dropdown').length) {
      dropdown_world = window.setTimeout('$("#layer_world .choose_world").dropdown_fadeout()',500);
    }
  });
  $(".dropdown p, .dropdown img.flag, .dropdown div.inside, #header .arrow").click(function(event) {
    event.preventDefault();
    if(!$(this).hasClass('mobile_dropdown')) {

      $('.dropdown div.scrollable').fadeOut();
      var ele;
      if($(this).hasClass('arrow')) {
        ele = $(this).parent("div").find("#language div.scrollable");
      } else {
        ele = $(this).parent("div").children("div.scrollable");
      }
      if(ele.css("display") == "none")
      {ele.fadeIn();}
      else {
        ele.fadeOut();
      }
      $(ele).mCustomScrollbar("update");
    }
  });
  $(".mobile_dropdown").click(function(event) {
    event.preventDefault();

    $('.dropdown div.scrollable').fadeOut();
    var ele = $(this).children("div.scrollable");
    if(ele.css("display") == "none"){
      ele.fadeIn();
    } else {
      ele.fadeOut();
    }
    $(ele).mCustomScrollbar("update");

  });
  $("#layer_world .choose_lang li, #layer_world .choose_lang li a").click(function(event) {

    event.preventDefault();
    var a_ele = $(this);
    if($(this).is('li')) {
      var a_ele = $(this).find('a');
    }
    var lang = $(a_ele).attr('class').substr(5);
    var game_id = 1;
    var country_name = $(a_ele).html();
    $('#layer_world .choose_lang p span')
      .removeClass($('#layer_world .choose_lang p span').attr('class').substr(9));
    $('#layer_world .choose_lang p span').addClass('flag_'+lang);
    $('#layer_world .choose_lang div.scrollable').fadeOut();

    $.ajax({
      type: "POST",
      url: 'get_new_worldlist.php',
      data: { country: lang, id: game_id, language: 'de' },
      dataType:"html"
    }).done(function ( html ) {
        $('.choose_world').html(html);
        $('#layer_world .choose_lang p a')
          .html(country_name + '');
        chosen_world_link = $('#act_world_p').attr('rel');

        $('.choose_world_click').click(function(event) {
          change_world(event, $(this));
        });
        $("#layer_world .choose_world div.scrollable").mCustomScrollbar({
          autoDraggerLength: false,
          set_height: $('#layer_world .choose_world li').size() * 30+14
        });
        $('.choose_world .mCustomScrollbar')
          .prepend('<div class="dropdown_sprite before_dropdown"></div>');
        $('.choose_world .mCustomScrollbar')
          .append('<div class="dropdown_sprite after_dropdown"></div>');
        $("#layer_world .choose_world div.scrollable")
          .mCustomScrollbar('update');
        $('#layer_world .choose_world .mCSB_dragger_bar')
          .addClass('dropdown_sprite');
        $('#layer_world .choose_world .mCustomScrollBox').css('height',
          $('#layer_world .choose_world li').size() * 30 +24+ 'px !important');
        $('#layer_world .choose_world ul li').first().find('a').addClass('new_flag');

        if($('#layer_world .choose_world li').size() <= 10) {
          $('.choose_world .after_dropdown').css("top" , "-45px");
        } else {
          $('.choose_world .after_dropdown').css("top" , "-33px");
        }

        $(".choose_world p").click(function(event) {
          event.preventDefault();
          $('.dropdown div.scrollable').fadeOut();
          var ele2 = $(this).parent("div").children("div.scrollable");
          if(ele2.css("display") == "none")
          {ele2.fadeIn();}
          else {
            ele2.fadeOut();
          }
          $(ele2).mCustomScrollbar("update");
        });
      });
  });

  $("#overlay_wrapper").css({
    //width: $(document).width(),
    //height: $(document).height()
    width: "100%",
    height: "100%"
  });



  $(window).resize(function() {
    resize_background();
    apply_rtl();
    smartphone_layer();
    $("#overlay_wrapper").css({
      //width: $(document).width(),
      //height: $(document).height()
      width: "100%",
      height: "100%"
    });

    if(is_ie_lt9  && ($(window).width() <= 1024)) {

      $("head").append('<link href="res/css/ie2spaltig.css" rel="stylesheet" name="iespalten" type="text/css" />');
    } else if (is_ie_lt9 && ($(window).width() >= 1024)) {
      $("link[name=iespalten]").remove();
    }

  });
  $.fn.toggle_overlay = function() {
    if($("body").hasClass("scroll_lock")) {
      $("#overlay_wrapper").fadeOut();
      $("body").removeClass("scroll_lock");
    } else {
      $("#overlay_wrapper").fadeIn();
      $("body").addClass("scroll_lock");
    }
  }
  $("#screenshot_box").click(function(){
    if(!screens_loaded) {
      $('#layer_screenshot .screenshots').append('<img src="'+base_path+'/screens/screenshots_2.jpg" alt="2" id="img2" />\
   <img src="'+base_path+'/screens/screenshots_3.jpg" alt="3" id="img3" />\
   <img src="'+base_path+'/screens/screenshots_4.jpg" alt="4" id="img4" />\
   <img src="'+base_path+'/screens/screenshots_5.jpg" alt="5" id="img5" />\
   <img src="'+base_path+'/screens/screenshots_6.jpg" alt="6" id="img6" />\
   <img src="'+base_path+'/screens/screenshots_7.jpg" alt="7" id="img7" />\
   <img src="'+base_path+'/screens/screenshots_8.jpg" alt="8" id="img8" />\
   <img src="'+base_path+'/screens/screenshots_9.jpg" alt="9" id="img9" />');
      slider = $('.screenshots').fadeSlideShow({
        width: 560,
        height: 320,
        speed:'slow', // Geschwindigkeit der Übergangsanimation
        autoplay: false // Zeit, bis ein neues Bild eingeblendet wird (1000 = 1 Sekunde)
      });
      screens_loaded = 1;
    }
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_screenshot").fadeIn();
  });
  $("#trailer_box").click(function(){
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_trailer").fadeIn();
    $('.trailer').html('<div id="trailer_id" ></div>');

    var videoId = videoIds["en"];

    if (language != "" && videoIds[language]){
      videoId = videoIds[language];
    }
    //if(isMobile == true){
    player = new YT.Player('trailer_id', {
      height: '358' ,
      width: youtube_width,
      videoId: videoId,
      playerVars: {
        controls: 0,
        showinfo: 0 ,
        modestbranding: 1,
        wmode: "opaque"
      }
    });
    //}
  });
  $("#login").click(function(event) {
    event.preventDefault();
    isLayerLogin = true;
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_world").fadeIn();
  });
  $(".terms").click(function(event) {
    event.preventDefault();
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    //console.log($("#layer_terms").attr("data"));
    $("#layer_terms iframe:first").attr("src", $("#layer_terms iframe:first").attr("data"))
    $("#layer_terms").fadeIn();
    //$("#layer_terms .text .inside").mCustomScrollbar('update');
  });
  $(".imprint").click(function(event) {
    event.preventDefault();
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_imprint iframe:first").attr("src", $("#layer_imprint iframe:first").attr("data"))
    $("#layer_imprint").fadeIn();
    //$("#layer_imprint .text .inside").mCustomScrollbar('update');
  });
  $(".privacy").click(function(event) {
    event.preventDefault();
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_privacy iframe:first").attr("src", $("#layer_privacy iframe:first").attr("data"))
    $("#layer_privacy").fadeIn();
    //$("#layer_privacy .text .inside").mCustomScrollbar('update');
  });
  $('a.choose_world_click').click(function(event) {
    change_world(event, $(this));
  });
  $(".overlays .button, .overlays .footer .inside").click(function(event) {
    event.preventDefault();
    //alert(playerclass);
    if(isLayerLogin == false){
      gotoGame(true);
    } else {
      gotoGame(false);
    }
    //location.href = chosen_world_link  + '?playerclass=' + playerclass;
  });

  $("#header #language ul li, .mobile_dropdown ul li").click(function(event) {
    event.preventDefault();
    location.href = $(this).find('a').attr('href');
  });
  $("#char_button").click(function(event) {
    event.preventDefault();
    $("").toggle_overlay();
    $(".overlays").css("top",$(document).scrollTop()+50);
    $("#layer_world").fadeIn();
  });
  $(".close_button").click(function(event) {
    event.preventDefault();
    if($("body").hasClass("scroll_lock")) {
      $("").toggle_overlay();
      $(".overlays").fadeOut();

      // player.stopVideo();
    }
  });

  $("#layer_trailer .close_button").click(function(event) {
    //alert("video layer");
    event.preventDefault();
    //if($("body").hasClass("scroll_lock")) {
    //$("").toggle_overlay();
    $(".overlays").fadeOut();
    //if(isMobile == true){
    $('.trailer').html("");
    //}
    //player.stopVideo();

    //}
  });


  $("#overlay_wrapper").click(function(){
    if($("body").hasClass("scroll_lock")) {
      $("").toggle_overlay();
      $(".overlays").fadeOut();
      //if(isMobile == false){
      $('.trailer').html("");
      //player.stopVideo();
      //}
    }
  });
  $("#content .element p.first").initialLetter({
    initialLetter: "dropped"
  });
  $(document).bind('mousewheel DOMMouseScroll', function(event) {
    if($("body").hasClass("scroll_lock")) {
      event.preventDefault();
    }
  });


  $("#header .dropdown div.scrollable, .choose_lang div.scrollable, .mobile_dropdown div.scrollable").mCustomScrollbar({
    autoDraggerLength: false
  });
  if($('#layer_world .choose_world li').size() <= 10) {
    $('.choose_world .after_dropdown').css("top" , "-45px");
    $(".choose_world div.scrollable").mCustomScrollbar({

      autoDraggerLength: false,
      set_height: $('#layer_world .choose_world li').size() * 30 +24
    });
  } else {
    $('.choose_world .after_dropdown').css("top" , "-33px");
    $(".choose_world div.scrollable").mCustomScrollbar({
      autoDraggerLength: false
    });
  }
  /*$(".overlays .text .inside").mCustomScrollbar({
   autoDraggerLength: false
   });*/
  $('.mCSB_dragger_bar').addClass('dropdown_sprite');
  $('.dropdown .mCustomScrollbar').prepend('<div class="dropdown_sprite before_dropdown"></div>');
  $('.dropdown .mCustomScrollbar').append('<div class="dropdown_sprite after_dropdown"></div>');
  $('.overlays .container').before('<div class="layer_sprite before_layer"></div>');
  $('.overlays .container').after('<div class="layer_sprite after_layer"></div>');

  $('.mCSB_dragger_bar').hover(function() {
    $(this).css("background-position","-204px -2px");
  },function() {
    $(this).css("background-position","-204px -74px");
  });
  $('#header .arrow').hover(function() {
    $('#header #language .inside .before_btn').css('background-position','-108px -2px');
    $('#header #language .inside .after_btn').css('background-position','-2px -2px');
    $('#header #language .inside .center_btn').css({
      backgroundImage: $('#header #language .inside .center_btn').css('background-image')
        .replace('out','over')
    });

  },function() {
    $('#header #language .inside .before_btn').css('background-position','-161px -2px');
    $('#header #language .inside .after_btn').css('background-position','-55px -2px');
    $('#header #language .inside .center_btn').css({
      backgroundImage: $('#header #language .inside .center_btn').css('background-image')
        .replace('over','out')
    });
  });



  $('#layer_screenshot .prev').hover(function() {
    if(isMobile == false){
      $('#layer_screenshot .prev .arrowbutton').show();
    }
  },function() {
    if(isMobile == false){
      $('#layer_screenshot .prev .arrowbutton').hide();
    }
  });

  $('#layer_screenshot .next').hover(function() {
    if(isMobile == false){
      $('#layer_screenshot .next .arrowbutton').show();
    }
  },function() {
    if(isMobile == false){
      $('#layer_screenshot .next .arrowbutton').hide();
    }
  });

  $('.fb-like .fb_ltr').load(function(){
    alert("fb loaded");
  });





//, .overlays .inside
  $('#char_button	.inside, #header .inside, #header .arrow, #login .inside, .overlays .inside').hover(function() {
    $(this).children('.before_btn').each(function(index, element) {
      if($(element).hasClass('gross')) {
        $(element).css('background-position','-391px -2px');
      } else if ($(element).hasClass('klein')) {
        $(element).css('background-position','-2px -372px');
      } else if ($(element).hasClass('header')) {
        $(element).css('background-position','-108px -2px');
      } else if ($(element).hasClass('layer')) {
        $(element).css('background-position','-69px -69px');
      }

    });
    $(this).children('.after_btn').each(function(index, element) {
      if($(element).hasClass('gross')) {
        $(element).css('background-position','-80px -3px');
      } else if ($(element).hasClass('klein')) {
        $(element).css('background-position','-3px -77px');
      } else if ($(element).hasClass('header')) {
        $(element).css('background-position','-2px -2px');
      } else if ($(element).hasClass('layer')) {
        $(element).css('background-position','-2px -69px');
      }
    });
    $(this).children('.center_btn').each(function(index, element) {
      $(element).css({
        backgroundImage: $(this).css('background-image')
          .replace('out','over')
      });
    });
  }, function() {
    $(this).children('.before_btn').each(function(index, element) {
      if($(element).hasClass('gross')) {
        $(element).css('background-position','-547px -2px');
      } else if ($(element).hasClass('klein')) {
        $(element).css('background-position','-2px -520px');
      } else if ($(element).hasClass('header')) {
        $(element).css('background-position','-161px -2px');
      } else if ($(element).hasClass('layer')) {
        $(element).css('background-position','-69px -2px');
      }
    });
    $(this).children('.after_btn').each(function(index, element) {
      if($(element).hasClass('gross')) {
        $(element).css('background-position','-236px -3px');
      } else if ($(element).hasClass('klein')) {
        $(element).css('background-position','-3px -225px');
      } else if ($(element).hasClass('header')) {
        $(element).css('background-position','-55px -2px');
      } else if ($(element).hasClass('layer')) {
        $(element).css('background-position','-2px -2px');
      }
    });
    $(this).children('.center_btn').each(function(index, element) {
      $(element).css({
        backgroundImage: $(this)
          .css('background-image')
          .replace('over','out')
      });
    });
  });

  function resize_background() {
    //console.log("resize");
    var browserwidth = $(window).width();
    var browserheight = $(window).height();

    // use container dimensions when inlinemode is on


    // calculate ratio
    var ratio = 1.223709369024857;

    // calculate new size
    var newheight = 0; var newwidth = 0;
    if ((browserheight / browserwidth) > ratio) {
      newheight = browserheight;
      newwidth = Math.round(browserheight / ratio);
    } else {
      newheight = Math.round(browserwidth * ratio);
      newwidth = browserwidth;
    }

    if(newwidth > 1700){
      newwidth = 1700;
    }

    // background
    $('#background_wrapper img').css('width', newwidth+"px");

    //sword
    var newwidth_sword = newwidth * 0.19;
    if(newwidth_sword < 225) newwidth_sword = 225;
    $('.parallax_pic_sword').css('width', newwidth_sword+"px");

    //shield
    var newwidth_shield = newwidth * 0.19;
    if(newwidth_shield < 225) newwidth_shield = 225;
    $('.parallax_pic_shield').css('width', newwidth_shield+"px");


  }
  function change_world(event, akt_world) {
    if (event){
      event.preventDefault();
    }
    $('#act_world_p').attr('rel', akt_world.attr('href'));
    $("#act_world_p")
      .html('<img src="'+base_path+'/new_flag.png" id="new_flag_top" /><span id="act_world">' + $(akt_world)
        .children("span")
        .html() + '</span> <img src="'+base_path+'/dropdown_arrow.png" class="arrow" />');

    chosen_world_link = $('#act_world_p').attr('rel');

    if($(akt_world).hasClass('new_flag')) {
      $('#new_flag_top').css('visibility','visible');
    } else {
      $('#new_flag_top').css('visibility','hidden');
    }
    $('#layer_world .choose_world div.scrollable').fadeOut();

  }

  smartphone_layer();

  function smartphone_layer() {
    if($("body").hasClass("mobile")) {
      if($(window).width() <= 620) {

        $("head").append("\
	<style class='min_layer_class'>\
	.overlays \{ \
		top: 0; \
		left: 0; \
		width: 100%;\
		height: 100% !important; \
		margin: 0 \}\
		.before_layer, .after_layer { \
		display: none; \
		\} \
		div.overlays div.container  \{ \
		background: none; \
		padding: 26px 0 0 0 !important; \
		margin: 10px 0 0 0; \
		height: 100% !important; \
		\}\
		.overlays .inside \{ \
			width: 100% !important; \
			\
			position: static !important; \
			max-width: none; \
			\
			\}\
			.overlays .inside img \{ \
			width: 100% !important; \
			height: auto !important; \
			\}\
		#layer_screenshot .next, #layer_screenshot .prev \{ \
			position: absolute; \
			top: 25%; \
			\}\
			#layer_screenshot .prev \{ \
			left: 5%;\
			\}\
			#layer_screenshot .next \{ \
			\
			left: 85%;\
			\}\
		");
        toogleLayer = 1;
      } else if(($(window).width() >= 620)) {

        toogleLayer = 0;
        $(".min_layer_class").remove();
      }
    }
  }
//apply text direction RTL
  apply_rtl();
  function apply_rtl() {
    if($('html').attr('dir') == 'rtl') {
      $('.lang_ticker').css('text-align','right');
      $('.game_description').insertBefore('#after').addClass("ele_first");
      $('#after').css("clear","none");
      $('#after ul li, #before ul li').css({
        backgroundPosition: 'right 10px',
        padding: '0px 25px 0 0'
      });
      $("#facebook_box").removeClass("box_first").addClass("box_last");
      $(".close_button").css({
        left: "0",
        right: "auto"
      });
      $('.overlays .headline').css({
        right: 30,
        left: "auto",
        textAlign: "right"
      });
      $("#after, #before").removeClass("ele_first");

      if($(window).width() <= 1024) {
        $('#before').insertAfter('#facebook_box');
        $('#before').css("clear","none");
        $("#content .cut_line").css("left","-174px");
        $("#facebook_box").removeClass("box_last").addClass("box_first");

      }
      if($(window).width() <= 610 && $("body").hasClass("mobile")) {
        $("#facebook_box").insertAfter(".before");

      }
      $("div.layer_text div.inside div").css("text-align","right");
      $('#content .element .features span.sprite').css('background-image',"url('+base_path+'/sprites/features_flag_rtl.png)");
      $('.features span.before_btn').css({
        width:'26px',
        height:'48px',
        backgroundPosition: '-94px -2px'
      });
      $('.features span.after_btn').css({
        width:'90px',
        height:'48px',
        backgroundPosition: '-2px -2px'
      });
      $('#content .element .features span span').css({
        margin: '0 -76px 0 0px',
        position: 'relative',
        left: '3px'
      });
      $('#content .cut_line_small').css({
        'background-image':"url('+base_path+'/cut_line_small_rtl.png)",
        "left":"-22px"
      });
      $('#content .cut_line').css({
        'background-image':"url('+base_path+'/cut_line_rtl.png)",
        "left":"-164px"
      });
      $('.border span span').css({
        margin: '0 -3px 0 0px !important'
      });
      $('.border span.before_btn').css({
        float: 'right'
      });



    }
  }
  if($("body").hasClass("mobile")) {
    youtube_width= '100%'
  } else {
    youtube_width= '560'
  }
  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // 3. This function creates an <iframe> (and YouTube player)
  //    after the API code downloads.



});

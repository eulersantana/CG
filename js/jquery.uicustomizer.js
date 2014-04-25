$(function() {

  $("#ui-customizer .head").click( function(event){
    event.preventDefault();
    if ($("#ui-customizer").hasClass("isDown") ) {
      $("#ui-customizer").animate({right:"-266px"}, 800);      
      $("#ui-customizer").removeClass("isDown");
    } else {
      $("#ui-customizer").animate({right:"0px"}, 800); 
      $("#ui-customizer").addClass("isDown");
    }
    return false;
  });

  $(".each-item").click( function() {
    var type = $(this).attr("data-type");
    if(type=="theme_color") {
      var theme_color = $(this).css("background-color");
      $("#letter-head").css("background-color", theme_color);
      $(this).css("border", "1px solid #1F1F1F");
      $(this).siblings(".each-item").css("border", "1px solid white");
      var theme_color = rgb2hex(theme_color);
      if(theme_color=="#1abc9c") { var darken = "#17A689"; } else
      if(theme_color=="#f1c40f") { var darken = "#DAB10D"; } else
      if(theme_color=="#2ecc71") { var darken = "#29B765"; } else
      if(theme_color=="#e67e22") { var darken = "#D67118"; } else
      if(theme_color=="#3498db") { var darken = "#258CD1"; } else
      if(theme_color=="#e74c3c") { var darken = "#E43725"; } else
      if(theme_color=="#9b59b6") { var darken = "#8F4BAB"; } else { }
      $("#letter-head").css("border-color", darken);
      $("#personal-info #each-holder .top-decorator").css("background", theme_color);
      $("#personal-info #each-holder .each > .icon").css("color", darken);
      $("#educational-attainment .section-content table tr td:nth-child(1) .date, #working-experience .section-content table tr td:nth-child(1) .date").css("background", darken);// 
      $("#skills .each .base .percentage").css({"background": theme_color, "border-color": darken});
      $("#portfolio #category > div, #contact #form button[type=submit]").css({"background": theme_color, "border-color": darken});
      $("#portfolio .da-thumbs .mix article a.thumbnail").css({"background": theme_color});
      $("#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmicon, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmicon").css({"background": theme_color});
      $("#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmtime span:last-child, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmtime span:last-child").css({"color": theme_color});
      $("#contact #form div:nth-child(1)").css("color", theme_color);
      $("#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmlabel p, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmlabel p").css("background", theme_color);
      $("#ui-customizer").attr({"data-theme-color": theme_color, "data-darken-theme-color": darken});
      
    } else if(type=="bg_image") {

      var background_image = $(this).css("background-image");
      $(".full").css("background-image", background_image);
      $(".full").css("background-attachment", "fixed");
      $(".full").css("background-repeat", "no-repeat");
      $(".full").css("background-position", "center center");
      $(".full").css("-webkit-background-size", "cover");
      $(".full").css("background-size", "cover");
      $(".bg-pattern .each-item, .bg-image .each-item").siblings(".each-item").css("border", "1px solid white");
      $(this).css("border", "1px solid #1F1F1F");
      $("#ui-customizer").attr({"data-bg-type": "image", "data-bg-url": changeUrl(background_image)});
           
    } else if(type=="bg_pattern") {

      var background_image = $(this).css("background-image");
      $(".full").css("background-image", background_image);
      $(".full").css("background-attachment", "fixed");
      $(".full").css("background-repeat", "repeat");
      $(".full").css("background-position", "center center");
      $(".full").css("-webkit-background-size", "initial");
      $(".full").css("background-size", "initial");
      $(".bg-pattern .each-item, .bg-image .each-item").siblings(".each-item").css("border", "1px solid white");
      $(this).css("border", "1px solid #1F1F1F");
      $("#ui-customizer").attr({"data-bg-type": "pattern", "data-bg-url": changeUrl(background_image)});
      
    } else { }

  });

  $("#generate-css-code").click( function() {
    var theme_color = $("#ui-customizer").attr("data-theme-color");
    var darken = $("#ui-customizer").attr("data-darken-theme-color");
    var bg_type = $("#ui-customizer").attr("data-bg-type");
    var bg_url = $("#ui-customizer").attr("data-bg-url");
    var head_comment = "/********* Customized CSS *********/ \n";
    var theme_color = "#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmlabel p, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmlabel p { background-color: "+theme_color+"; } \n#portfolio .da-thumbs .mix article a.thumbnail { background-color: "+theme_color+"; } \n#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmicon, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmicon { background-color: "+theme_color+"; } \n#educational-attainment .section-content ul.cbp_tmtimeline > li .cbp_tmtime span:last-child, #working-experience .section-content ul.cbp_tmtimeline > li .cbp_tmtime span:last-child { color: "+theme_color+"; } \n#personal-info #each-holder .top-decorator { background-color: "+theme_color+"; } \n#letter-head { background-color: "+theme_color+"; } \n#letter-head { border-color: "+darken+"; } \n#personal-info #each-holder .each > .icon { color: "+darken+"; } \n#educational-attainment .section-content table tr td:nth-child(1) .date, #working-experience .section-content table tr td:nth-child(1) .date { background: "+darken+"; } \n#skills .each .base .percentage { background: "+theme_color+"; border-color: "+darken+"; } \n#portfolio #category > div, #contact #form button[type=submit] { background: "+theme_color+"; border-color: "+darken+"; } \n#contact #form div:nth-child(1) { color: "+theme_color+"; } \n";
    if(bg_type=="image") {
      var bg = ".full { background-image: "+bg_url+"; background-attachment: fixed; background-repeat: no-repeat; background-position: center center; -webkit-background-size: cover; background-size: cover; }";
    } else if(bg_type=="pattern") {
      var bg = ".full { background-image: "+bg_url+"; background-attachment: fixed; background-repeat: repeat; background-position: center center; -webkit-background-size: initial; background-size: initial; }";
    } else { }
    $("#css-code").val(head_comment+theme_color+bg);
  });
  
});

function changeUrl(background_image) {
  var a = background_image.indexOf('url(') ; 
  var b = background_image.indexOf('img') ;
  var c = background_image.slice (a,b) ;
  var d = background_image.replace(c, '');
  var e = "url(../"+d.replace(')', '')+")";
  return e;
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}
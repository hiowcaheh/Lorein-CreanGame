try {
  console.log('init console... done');
}
catch (e) {
  console = { log:function () {
  } }
}

if (getTitle() && /\(([^\)]+)\)$/.exec(getTitle())) {
  servernameshort = (RegExp.$1);
}
var body = document.getElementsByTagName("body")[0];
var html = document.getElementsByTagName("html")[0];

var isIE = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
var isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;
var servernameshort = "";
var brandEngageJS = null;
var brandEngageVideo = [];
var brandEngageVideoIsShowing = [];
var brandEngageVideoIsLoaded = [];
var jsloader = {};

function reload() {
  window.location.reload();
}
function reload_iframe(id) {
  var iframe = document.getElementById(id);
  var url = iframe.src;
  if (url.match(/[^a-z]rnd=[0-9.]+/i)) {
    url.replace(/rnd=[0-9.]+/i, "rnd=" + Math.random());
  } else if (url.match(/[?]/)) {
    url = url + "&rnd=" + Math.random();
  } else {
    url = url + "?rnd=" + Math.random();
  }

  iframe.src = url;
}
function reload_rtl() {
  reload_iframe("branding_rtl");
}
function loadpixel(url) {
  var iframe;
  iframe = document.createElement('iframe');
  iframe.style.width = 0;
  iframe.style.height = 0;
  iframe.style.frameborder = 0;
  iframe.style.display = 'none';
  iframe.style.scrolling = 0;
  iframe.setAttribute("src", url);
  document.getElementById('body').appendChild(iframe);
}

function set_title(text) {
  var titleNode = document.getElementById("title");
  if ((servernameshort || branding_url) && /\(([^\)]+)\)$/.exec(text)) {
    if (branding_url != ""){
      text = text.replace("(" + RegExp.$1 + ")", "(" + serverid + " "+ country + ")");
    } else {
      text = text.replace("(" + RegExp.$1 + ")", "(" + servernameshort + ")");
    }
  }
  if (!isIframe) {
    document.title = text;
  } else if (titleNode) {
    text =  text + " - " + (branding_url!=""?branding_url:document.location.host);
    try{
      titleNode.replaceChild(document.createTextNode(text), titleNode.firstChild);
    } catch (e){
    }
  }

}


function getUniqueId(size)
{
	var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
	var str = "";
	for(var i = 0; i < size; i++)
	{
	
		str += chars.substr( Math.floor(Math.random() * 62), 1 );
	}
	return str;
}


function getTitle() {
  if (isIframe) {
    if (document.getElementById("title")) {
      return "" + document.getElementById("title").firstChild;
      
    } else if (!document.title) {
      return "";
    }
  }
  return document.title;
}

function send(cmd) {
  try {
    var args = Array.prototype.slice.call(send.arguments);
    document.getElementById(project).doSend(cmd, args);
  }
  catch (err) {
    console.log(err);
  }
}

function showSocial(socialName) {
  if (sociallinks[project] && sociallinks[project][socialName]) {
    window.open(sociallinks[project][socialName], '_newtab');
  }
}

function require(file, callback) {
   var script = document.getElementsByTagName('script')[0],
   newjs = document.createElement('script');

  // IE
  newjs.onreadystatechange = function () {
     if (newjs.readyState === 'loaded' || newjs.readyState === 'complete') {
        newjs.onreadystatechange = null;
        callback();
     }
  };
  // others
  newjs.onload = function () {
     callback();
  }; 
  newjs.src = file;
  script.parentNode.insertBefore(newjs, script);
}

function ControlVersion() {
  var version;
  var axo;
  var e;
  // NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
  try {
    // version will be set for 7.X or greater players
    axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
    version = axo.GetVariable("$version");
  } catch (e) {
  }
  if (!version) {
    try {
      // version will be set for 6.X players only
      axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");

      // installed player is some revision of 6.0
      // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
      // so we have to be careful.

      // default to the first public version
      version = "WIN 6,0,21,0";
      // throws if AllowScripAccess does not exist (introduced in 6.0r47)
      axo.AllowScriptAccess = "always";
      // safe to call for 6.0r47 or greater
      version = axo.GetVariable("$version");
    } catch (e) {
    }
  }
  if (!version) {
    try {
      // version will be set for 4.X or 5.X player
      axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
      version = axo.GetVariable("$version");
    } catch (e) {
    }
  }
  if (!version) {
    try {
      // version will be set for 3.X player
      axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
      version = "WIN 3,0,18,0";
    } catch (e) {
    }
  }
  if (!version) {
    try {
      // version will be set for 2.X player
      axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      version = "WIN 2,0,0,11";
    } catch (e) {
      version = -1;
    }
  }

  return version;
}
// JavaScript helper required to detect Flash Player PlugIn version information
function GetSwfVer() {
  // NS/Opera version >= 3 check for Flash plugin in plugin array
  var flashVer = -1;

  if (navigator.plugins != null && navigator.plugins.length > 0) {
    if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
      var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
      var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
      var descArray = flashDescription.split(" ");
      var tempArrayMajor = descArray[2].split(".");
      var versionMajor = tempArrayMajor[0];
      var versionMinor = tempArrayMajor[1];
      var versionRevision = descArray[3];
      if (versionRevision == "") {
        versionRevision = descArray[4];
      }
      if (versionRevision[0] == "d") {
        versionRevision = versionRevision.substring(1);
      } else if (versionRevision[0] == "r") {
        versionRevision = versionRevision.substring(1);
        if (versionRevision.indexOf("d") > 0) {
          versionRevision = versionRevision.substring(0, versionRevision.indexOf("d"));
        }
      }
      var flashVer = versionMajor + "." + versionMinor + "." + versionRevision;
    }
  }
  // MSN/WebTV 2.6 supports Flash 4
  else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.6") != -1) flashVer = 4;
  // WebTV 2.5 supports Flash 3
  else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.5") != -1) flashVer = 3;
  // older WebTV supports Flash 2
  else if (navigator.userAgent.toLowerCase().indexOf("webtv") != -1) flashVer = 2;
  else if (isIE && isWin && !isOpera) {
    flashVer = ControlVersion();
  }
  return flashVer;
}
// When called with reqMajorVer, reqMinorVer, reqRevision returns true if that version or greater is available
function DetectFlashVer(reqMajorVer, reqMinorVer, reqRevision) {
  versionStr = GetSwfVer();
  if (versionStr == -1) {
    return false;
  } else if (versionStr != 0) {
    if (isIE && isWin && !isOpera) {
      // Given "WIN 2,0,0,11"
      tempArray = versionStr.split(" "); 	// ["WIN", "2,0,0,11"]
      tempString = tempArray[1];			// "2,0,0,11"
      versionArray = tempString.split(",");	// ['2', '0', '0', '11']
    } else {
      versionArray = versionStr.split(".");
    }
    var versionMajor = versionArray[0];
    var versionMinor = versionArray[1];
    var versionRevision = versionArray[2];
    // is the major.revision >= requested major.revision AND the minor version >= requested minor
    if (versionMajor > parseFloat(reqMajorVer)) {
      return true;
    } else if (versionMajor == parseFloat(reqMajorVer)) {
      if (versionMinor > parseFloat(reqMinorVer))
        return true;
      else if (versionMinor == parseFloat(reqMinorVer)) {
        if (versionRevision >= parseFloat(reqRevision))
          return true;
      }
    }
    return false;
  }
}
function AC_AddExtension(src, ext) {
  if (src.indexOf('?') != -1)
    return src.replace(/\?/, ext + '?');
  else
    return src + ext;
}
function AC_Generateobj(objAttrs, params, embedAttrs) {
  var str = '';
  if (isIE && isWin && !isOpera) {
    str += '<object ';
    for (var i in objAttrs) {
      str += i + '="' + objAttrs[i] + '" ';
    }
    str += '>';
    for (var i in params) {
      str += '<param name="' + i + '" value="' + params[i] + '" /> ';
    }
    str += '</object>';
  }
  else {
    str += '<embed ';
    str += 'style="z-index:0;" '
    for (var i in embedAttrs) {
      str += i + '="' + embedAttrs[i] + '" ';
    }
    str += '> </embed>';
  }
  document.write(str);
}
function AC_FL_RunContent() {
  var ret =
    AC_GetArgs
      (arguments, ".swf", "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        , "application/x-shockwave-flash"
      );
  AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
}
function AC_SW_RunContent() {
  var ret =
    AC_GetArgs
      (arguments, ".dcr", "src", "clsid:166B1BCA-3F9C-11CF-8075-444553540000"
        , null
      );
  AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
}
function AC_GetArgs(args, ext, srcParamName, classid, mimeType) {
  var ret = new Object();
  ret.embedAttrs = new Object();
  ret.params = new Object();
  ret.objAttrs = new Object();
  for (var i = 0; i < args.length; i = i + 2) {
    var currArg = args[i].toLowerCase();
    switch (currArg) {
      case "classid":
        break;
      case "pluginspage":
        ret.embedAttrs[args[i]] = args[i + 1];
        break;
      case "src":
      case "movie":
        args[i + 1] = AC_AddExtension(args[i + 1], ext + window.location.search);
        ret.embedAttrs["src"] = args[i + 1];
        ret.params[srcParamName] = args[i + 1];
        break;
      case "onafterupdate":
      case "onbeforeupdate":
      case "onblur":
      case "oncellchange":
      case "onclick":
      case "ondblclick":
      case "ondrag":
      case "ondragend":
      case "ondragenter":
      case "ondragleave":
      case "ondragover":
      case "ondrop":
      case "onfinish":
      case "onfocus":
      case "onhelp":
      case "onmousedown":
      case "onmouseup":
      case "onmouseover":
      case "onmousemove":
      case "onmouseout":
      case "onkeypress":
      case "onkeydown":
      case "onkeyup":
      case "onload":
      case "onlosecapture":
      case "onpropertychange":
      case "onreadystatechange":
      case "onrowsdelete":
      case "onrowenter":
      case "onrowexit":
      case "onrowsinserted":
      case "onstart":
      case "onscroll":
      case "onbeforeeditfocus":
      case "onactivate":
      case "onbeforedeactivate":
      case "ondeactivate":
      case "type":
      case "codebase":
        ret.objAttrs[args[i]] = args[i + 1];
        break;
      case "width":
      case "height":
      case "align":
      case "vspace":
      case "hspace":
      case "class":
      case "title":
      case "accesskey":
      case "name":
      case "tabindex":
      case "id":
        ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i + 1];
        break;
      default:
        ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i + 1];
    }
  }
  ret.objAttrs["classid"] = classid;
  if (mimeType) ret.embedAttrs["type"] = mimeType;
  return ret;
}
function encode_utf8(raw) {
  // dient der Normalisierung des Zeilenumbruchs
  var utftext = "";
  for (var n = 0; n < raw.length; n++) {
    var c = raw.charCodeAt(n);
    if (c < 0x80) {
      utftext += encodeURI(String.fromCharCode(c));
    } else if (c < 0xc2) {
    } else if (c <= 0xdf) {
      unicode = ((c & 0x1f) << 6 ) | (raw.charCodeAt(n + 1) & 0x3f);
      if (unicode <= 0xff) {
        utftext += "%" + (new Array(2 + 1).join('0') + unicode.toString(16)).slice(-2);
      } else {
        utftext += "%u" + (new Array(4 + 1).join('0') + unicode.toString(16)).slice(-4);
      }
      n += 1;
    } else if (c <= 0xef) {
      unicode = (c & 0x0f) << 12 |
        (raw.charCodeAt(n + 1) & 0x3f) << 6 |
        (raw.charCodeAt(n + 2) & 0x3f);
      utftext += "%u" + (new Array(4 + 1).join('0') + unicode.toString(16)).slice(-4);
      n += 2;
    } else if (c <= 0xf4) {
      unicode = (c & 0x0f) << 18 |
        (raw.charCodeAt(n + 1) & 0x3f) << 12 |
        (raw.charCodeAt(n + 2) & 0x3f) << 6 |
        (raw.charCodeAt(n + 3) & 0x3f);
      utftext += "%u" + (new Array(4 + 1).join('0') + unicode.toString(16)).slice(-4);
      n += 3;
    } else {
      utftext += escape(String.fromCharCode(c));
    }
  }
  return utftext;
}

function openUrl(url) {
  var basetarget = "_blank";
  url = encode_utf8(url);

  if (isIframe && !url.match(/^(http[s]?:\/\/)?forum./i)) {
    basetarget = "_self";
  }

  window.open(url, basetarget);
}
var hasRightVersion = DetectFlashVer(requiredMajorVersion, requiredMinorVersion, requiredRevision);

if (hasRightVersion) {  // if we've detected an acceptable version
  // embed the flash movie
  AC_FL_RunContent(
    'codebase', 'http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,124,0',
    'width', swfwidth,
    'height', swfheight,
    'src', project,
    'quality', swfquality,
    'pluginspage', 'http://www.adobe.com/go/getflashplayer',
    'align', 'middle',
    'play', 'true',
    'loop', 'true',
    'scale', swfscale,
    //'wmode', 'window',
    'wmode', 'opaque',
    'devicefont', 'false',
    'id', project,
    'bgcolor', '#000000',
    'name', project,
    'menu', 'true',
    'allowFullScreen', 'false',
    'allowScriptAccess', 'always',
    'movie', movie,
    'salign', 't'
  ); //end AC code
}
else {

  document.write('<style type="text/css">');
  document.write('body {background:url(' + bgimage + '); background-repeat:no-repeat; background-position:top center; background-color:#000000;}');
  document.write('a:link { text-decoration:none; color:#ffd9aa; }');
  document.write('a:visited { text-decoration:none; color:#ffd9aa; }');
  document.write('a:hover { text-decoration:underline; color:#ffd9aa; }');
  document.write('a:active { text-decoration:none; color:#ffd9aa; }');
  document.write('a:focus { text-decoration:none; color:#ffd9aa; }');
  document.write('</style> ');
  document.write('<table align="center" width="550px" style="font-family: Tahoma, Arial, Helvetica, sans-serif; color: #FFFFFF;"> ');
  document.write('<tr>');
  document.write('<td>');
  document.write('<BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR>');
  document.write('<B>' + message1 + ': <A href="http://www.adobe.com/go/getflashplayer/">' + message2 + '</A></B> ');
  document.write('</td>');
  document.write('</tr>');
  document.write('</table>');

}

function getOffset( el ) {
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    try{
      _x += el.offsetLeft - el.scrollLeft;
      _y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    } catch(e){
    }
  }
  return { top: _y, left: _x };
}
function setOpacity (myElement, opacityValue) {
    if (window.ActiveXObject) {
        myElement.style.filter = "alpha(opacity="
             + opacityValue*100 + ")"; // IE
    } else {
        myElement.style.opacity = opacityValue; // Gecko/Opera
    }
}

function clearBrandEngageGarbage(){
	var els = document.getElementsByTagName("object");
	if(els && els.length > 0){
	  for (var n = 0; n < els.length; n++){
	    if (els[n].getAttribute("id") != null && els[n].getAttribute("id").match(/^flXHR_swf/i)){
	      els[n].parentNode.removeChild(els[n]);
			}
	  }
	}
	var els = document.getElementsByTagName("div");
	if(els && els.length > 0){
	  for (var n = 0; n < els.length; n++){
	    if (els[n].getAttribute("id") != null && els[n].getAttribute("id").match(/^sp_fade_background$/i)){
	      els[n].parentNode.removeChild(els[n]);
			}
	  }
	}
	var els = document.getElementsByTagName("iframe");
	if(els && els.length > 0){
	  for (var n = 0; n < els.length; n++){
	    if (els[n].getAttribute("id") != null && els[n].getAttribute("id").match(/^sp-bexdm-iframe$/i)){
	      els[n].parentNode.removeChild(els[n]);
	    } else if (els[n].getAttribute("id") != null && els[n].getAttribute("id").match(/^sponsorpay_proxy_[0-9]+$/i)){
	      els[n].parentNode.removeChild(els[n]);
			} else if(els[n].getAttribute("src") != null && els[n].getAttribute("src").match(/\.sponsorpay\.$/i)){
			}
	  }
	}
}

function showBrandEngageVideo(playerid, appid, mode){
  if (brandEngageVideo[appid] == null){
    brandEngageVideo[appid] = new SPONSORPAY.Video.Iframe({
        appid: appid,
        uid: playerid,
        pub0: 'b',
        display_format: 'bare_player',
        callback_on_start: function(offer) {
            //showClickableIconFromCustomUrl(offer.icon_small);
            if (mode == "show"){ 
	            var popup = document.getElementById("popupCloseButtonbrandengageNoOffers");
	            if(popup){
	              popup.click();
							}
						} else {
							brandEngageVideoIsLoaded[appid] = true;
						}
            
        },
        callback_no_offers: function(){
            //hideClickableIcon();
            var text = "Sorry, no offer available";
            if (strings["brandengage.no_offers"]){
              text = strings["brandengage.no_offers"];
            }
            clearBrandEngageGarbage();
            if (mode == "show") {
              createTextPopup("brandengageNoOffers", text, 200, 40, 1);
            } else {
							brandEngageVideoIsLoaded[appid] = false;
						}
            brandEngageVideoIsShowing[appid] = false;
        },
        callback_on_close: function(){
          clearBrandEngageGarbage();
          brandEngageVideoIsShowing[appid] = false;
					brandEngageVideoIsLoaded[appid] = false;
          
        },
        callback_on_conversion: function(){ 
            //rewardTheUser(); 
        }
    });
    if (mode=="load"){
      if (!brandEngageVideoIsLoaded[appid] && !brandEngageVideoIsShowing[appid]){
        brandEngageVideo[appid].backgroundLoad();
      }
    } else {
      brandEngageVideoIsShowing[appid] = true;
      brandEngageVideo[appid].loadAndShow();
		}
   } else if (!brandEngageVideoIsShowing[appid]){
    if (mode=="load"){
      if (brandEngageVideoIsLoaded[appid] && !brandEngageVideoIsShowing[appid]){
        brandEngageVideoIsShowing[appid] = true;
        brandEngageVideoIsLoaded[appid] = false;
        brandEngageVideo[appid].showVideo();
      } else if(!brandEngageVideoIsLoaded[appid] && !brandEngageVideoIsShowing[appid]){
        brandEngageVideo[appid].backgroundLoad();
      }
    } else {
      brandEngageVideoIsShowing[appid] = true;
      brandEngageVideo[appid].loadAndShow();
		}
   }
}
function paymentUltimatepay(param){
	var if_ulp = document.createElement('iframe');
	if_ulp.setAttribute("id", "if_ulp"); 
	if_ulp.setAttribute("src", "../../payment/ultimatepay.php?"+param);
	//if_ulp.style.display = "none";
	//if_ulp.style.padding = "10px";
	if_ulp.style.position = "absolute";
	if_ulp.style.top = "50%";
	if_ulp.style.left = "50%"; 
	if_ulp.style.marginLeft = "-351px";
	if_ulp.style.marginTop = "-212px"; 
	if_ulp.scrolling = "no";
	if_ulp.width = "715px";
	if_ulp.height = "450px";
	if_ulp.frameBorder = "0";
	if_ulp.style.border = "0px";
	if_ulp.style.zIndex = "500";
	if (document.getElementById("if_ulp")){
		(elem=document.getElementById("if_ulp")).parentNode.replaceChild(if_ulp);
	} else {
		document.getElementById('body').appendChild(if_ulp);
	}
}

function initBrandEngage(playerid, appid, mode){
  if (!brandEngageJS){
    brandEngageJS = document.createElement('script');
    brandEngageJS.setAttribute("type","text/javascript");
    brandEngageJS.setAttribute("src", "//be.sponsorpay.com/assets/web_client.js");
    brandEngageJS.onreadystatechange = function(){
      if (this.readyState == 'complete'){
        showBrandEngageVideo(playerid, appid, mode);
      }
    }
    
    brandEngageJS.onload = function(){showBrandEngageVideo(playerid, appid, mode);}
    
    if (typeof brandEngageJS != "undefined"){
      document.getElementsByTagName("head")[0].appendChild(brandEngageJS);
    }
  } else {
    showBrandEngageVideo(playerid, appid, mode);
  }
}

function paymentBrandEngage(playerid){
  initBrandEngage(playerid, 10867, "show");
}
function createPopup(name, url, width, height, closebuttonposition, scrolling){
  var iframe = document.getElementById(name);
  if (!iframe) {
    var docmode = 0;
    if(window.navigator.appName == "Microsoft Internet Explorer" && document.documentMode){
      docmode = parseInt(document.documentMode);
    }
    iframe = document.createElement("iframe");
    iframe.id = name;
    iframe.setAttribute("name", name);
    iframe.setAttribute("allowTransparency", "true");
    iframe.setAttribute("width", width);
    iframe.setAttribute("height", height);
    iframe.setAttribute("frameborder", 0);
    iframe.setAttribute("border", 0);
    iframe.setAttribute("scrolling", (scrolling==true?"yes":"no"));

    iframe.style.border = "0px";
    iframe.style.position = "absolute";

    if (docmode == 9){
      iframe.style.display = "block";
    } else {
      iframe.style.display = "table";
    }
    
    iframe.style.zIndex = "499";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.margin = "-"+Math.round(height/2)+"px 0 0 -" + Math.round(width/2)+"px";
    //iframe.style.backgroundColor= "#ffffff";

    body.insertBefore(iframe, body.lastChild);
  }
  iframe.src=url;

  if (closebuttonposition > 0){ 
	  var closeButton = document.createElement('img');
	  var position = getOffset(iframe);
    closeButton.src="http://img.playa-games.com/start/close.png";
    closeButton.id = "popupCloseButton";
    closeButton.className = "popupCloseButton" + (closebuttonposition).toString();
    closeButton.className +=" id"+name;
    closeButton.style.zIndex = "500";
    closeButton.style.position = "absolute";
    closeButton.style.top = (position.top-20) + "px";
	  if (closebuttonposition == 1){
      closeButton.style.left = (position.left-20) + "px";
	  } else {
      closeButton.style.right = (position.left-20) + "px";
	  }

    closeButton.style.cursor = "pointer";
    closeButton.onclick = function(){
	    el = document.getElementById(name);
	    el.parentNode.removeChild(el);
	    el = this;
	    el.parentNode.removeChild(el);
	  }
	  body.insertBefore(closeButton, body.lastChild);
  }
}

function createTextPopup(name, text, width, height, closebuttonposition){
  var div = document.getElementById(name);
  if (!div) {
    var docmode = 0;
    if(window.navigator.appName == "Microsoft Internet Explorer" && document.documentMode){
      docmode = parseInt(document.documentMode);
    }
    div = document.createElement("div");
    div.id = name;
    div.setAttribute("name", name);

    div.style.border = "0px";
    div.style.position = "absolute";
    div.style.width = width;
    div.style.height = height;
    div.style.color = "#000000"
    div.style.backgroundColor="#ffffff"

    div.style.display = "block";
    div.style.padding = "10px"
    
    setOpacity(div, .8);

    
    if (docmode == 9){
//      div.style.display = "block";
    } else {
//      div.style.display = "table";
    }
    
    div.style.zIndex = "499";
    //div.style.top = "50%";
    div.style.bottom = "5px";
    div.style.left = "50%";
    div.style.margin = "-"+Math.round(height/2)+"px 0 0 -" + Math.round(width/2)+"px";
		div.appendChild(document.createTextNode(text));
    body.insertBefore(div, body.lastChild);
    
	  if (closebuttonposition > 0){ 
		  var closeButton = document.createElement('img');
		  var position = getOffset(div);
	    closeButton.src="http://img.playa-games.com/start/close.png";
	    closeButton.id = "popupCloseButton" + name;
	    closeButton.className = "popupCloseButton" + (closebuttonposition).toString();
	    closeButton.className +=" id"+name;
	    closeButton.style.zIndex = "500";
	    closeButton.style.position = "absolute";
	    closeButton.style.top = (position.top-20) + "px";
		  if (closebuttonposition == 1){
	      closeButton.style.left = (position.left-20) + "px";
		  } else {
	      closeButton.style.right = (position.left-20) + "px";
		  }
	
	    closeButton.style.cursor = "pointer";
	    closeButton.onclick = function(){
		    el = document.getElementById(name);
		    el.parentNode.removeChild(el);
		    el = this;
		    el.parentNode.removeChild(el);
		  }
		  var textPopupTimeout = window.setTimeout(function(){
		    el = document.getElementById(name);
		    if(el){
		      el.parentNode.removeChild(el);
		    }
		    el = document.getElementById("popupCloseButton" + name);
		    if (el){
		      el.parentNode.removeChild(el);
		    }
			}, 3000)
		  
		  body.insertBefore(closeButton, body.lastChild);
	  }
  }

}

function loadJs(file, params, callbacks, overwrite){

  if (overwrite || !jsloader[file]){
    jsloader[file] = document.createElement('scr' + 'ipt');
    
  }
  jsloader[file].setAttribute("type","text/javascript");
  jsloader[file].setAttribute("sr" + "c", file + "?" + params);
  jsloader[file].onreadystatechange = function(){
    if (this.readyState == 'complete'){
      callbacks["onComplete"].call();
    }
  }
  
  jsloader[file].onload = function(){callbacks["onComplete"].call();}
  
  if (typeof jsloader[file] != "undefined"){
    document.getElementsByTagName("head")[0].appendChild(jsloader[file]);
  }
}

function paymentSponsorpay(url){
	createPopup("paymentSponsorpay", url, 550, 400, 1, true);
}
function paymentMopay(url){
	createPopup("paymentMopay", url, 550, 400, 1, false);
}
function paymentZong(urlParams){
	var url = "http://" + window.location.hostname + "/payment/zong.php?" + urlParams;
	createPopup("paymentZong", url, 490, 350, 2, false);
}
function paymentBoacompra(urlParams){
	var url = "http://" + window.location.hostname + "/payment/boacompra.php?" + urlParams;
	createPopup("paymentBoacompra", url, 1024, 700, 2, false);
}

function paymentWiretransfer(url){
	createPopup("paymentWiretransfer", url, 600, 400, 2, false);
}

var flimmerkisteSponsorpay = new function() {
		var libLoadState = "uninitialized";
		var api = null;
		var userid = "";
		var gender = "m";
		var lastCheck = 0;
		var offerState = 0; // 0 = init; 1 = offer; 2 = no offer
		
		var getCookie = function(name){
	    var i, n, v, cookies=document.cookie.split(";");
	
	    for (i=0;i<cookies.length;i++){
        n = cookies[i].substr(0, cookies[i].indexOf("="));
        v = cookies[i].substr(cookies[i].indexOf("=") + 1);
        n = n.replace(/^\s+|\s+$/g,"");
        if (n == name){
          return unescape(v);
        }
	    }
	    return "";
		}
		var setCookie = function (name,value){
			var d = new Date();
			d = new Date(d.getTime() + 1000 * 60 * 60 * 24 * 1); 
			document.cookie=name + "=" + escape(value) + "; expires=" + d.toGMTString()+";";
		}
		var loadApi = function(){
			if (api){
				return;
			}
			api=new SPONSORPAY.Video.Iframe({
	        appid: '17971',
	        uid: instance.userid,
	        gender: instance.gender,
	        callback_on_start: function(offer) {
						offerState = 1;
						//console.log("has offer", offerState)
	        },
	        callback_no_offers: function(){
						offerState = 2; 
						//console.log("no offer", offerState)
            clearBrandEngageGarbage();
	        },
	        callback_on_close: function(){ 
						offerState = 0; 
            clearBrandEngageGarbage();
	        },
	        callback_on_conversion: function(){ 
	        }
	    });
	    backgroundLoad();
		};
    var loadLibs = function(){
    	if (libLoadState != "uninitialized"){
    		return;
			}
			
			libLoadState = "initializing"
	  	loadJs("http://be.sponsorpay.com/assets/web_client.js", "", {
	  		"onComplete": function (){
					libLoadState = "initialized"
	  			loadApi();
	  		}
	  	}, false);
		};
		var backgroundLoad = function(){
			if (!api){
				return;
			}
			//console.log("offerState = ", offerState);
			if (offerState == 1){
				return;
			}
			if (!lastCheck){
				lastCheck = getCookie("to_flimmerkiste");
			}
			if (!lastCheck){
				lastCheck = new Date().getTime();
				api.backgroundLoad();
				setCookie("to_flimmerkiste", lastCheck);
			} else if (new Date().getTime() - lastCheck > flimmerkistePoll * 1000){
				lastCheck = new Date().getTime();
				setCookie("to_flimmerkiste", lastCheck);
				api.backgroundLoad();
			}
		}
		this.initialize = function(userid, gender){
			if (!api){
				this.userid = userid;
				this.gender = (gender==2)?"f":"m";
				loadLibs();
			} else {
    		backgroundLoad()
			}
		};
    this.isAvailable = function(){
    	if (offerState == 1){
				return 1;
			}
			return 0;
		};
    this.show = function () {
      if (offerState == 1){
      	api.showVideo();
			}
    };
		var instance = this;
}

var flimmerkisteMothership = new function() {
		var libLoadState = "uninitialized";
		var api = null;
		var userid = "";
		var gender = "m";
		var lastCheck = 0;
		var offerState = 0; // 0 = init; 1 = offer; 2 = no offer
		var videoID = 0;
		
		var getCookie = function(name){
	    var i, n, v, cookies=document.cookie.split(";");
	
	    for (i=0;i<cookies.length;i++){
        n = cookies[i].substr(0, cookies[i].indexOf("="));
        v = cookies[i].substr(cookies[i].indexOf("=") + 1);
        n = n.replace(/^\s+|\s+$/g,"");
        if (n == name){
          return unescape(v);
        }
	    }
	    return "";
		}
		var setCookie = function (name,value){
			var d = new Date();
			d = new Date(d.getTime() + 1000 * 60 * 60 * 24 * 1); 
			document.cookie=name + "=" + escape(value) + "; expires=" + d.toGMTString()+";";
		}
		var loadApi = function(){
			if (api){
				return;
			}
			api=mship_video;
	    backgroundLoad();
		};
    var loadLibs = function(){
    	if (libLoadState != "uninitialized"){
    		return;
			}
			
			libLoadState = "initializing"
	  	loadJs("http://video.mship.de/video.php", "s=1&r="+Math.floor(Math.random()*99999999999), {
	  		"onComplete": function (){
					libLoadState = "initialized"
	  			loadApi();
	  		}
	  	}, false);
		};
		var backgroundLoad = function(){
			if (!api){
				return;
			}
			//console.log("offerState = ", offerState);
			if (offerState == 1){
				return;
			}
			if (!lastCheck){
				lastCheck = getCookie("to_flimmerkiste");
				console.log("lastCheck from cookie", lastCheck);
			}
			if (!lastCheck){
				lastCheck = new Date().getTime();
				setCookie("to_flimmerkiste", lastCheck);
			} else if (new Date().getTime() - lastCheck > flimmerkistePoll * 1000){

				lastCheck = new Date().getTime();
				setCookie("to_flimmerkiste", lastCheck);
			} else {
				return;
			}
			
			console.log("Request video");
			
			loadJs("payment/mosh.php", "?rnd=" + Math.floor(Math.random()*99999999999), {
		    	"onComplete": function (){
		    		var moshvideoid = moshid + "&uid=" + instance.userid + "_" + getUniqueId(5) + "&gender=" + instance.gender ;
			  		console.log("moshvideoid", moshvideoid);
						api.video_request({
						  onAvailable: function(id) {
						  	console.log("Mosh available");
						  	videoID = id;
						  	offerState = 1;
							},
						  onNotAvailable: function(){
						  	console.log("Mosh not available");
						  	offerState = 2;
							}
						}, moshvideoid);
			  		
					}
				}, true);
			
		}
		this.initialize = function(userid, gender){
			if (!api){
				this.userid = userid;
				this.gender = (gender==2)?"f":"m";
				loadLibs();
			} else {
    		backgroundLoad()
			}
		};
    this.isAvailable = function(){
    	if (offerState == 1){
				return 1;
			}
			return 0;
		};
    this.show = function () {
      if (offerState == 1){
      	api.video_play({
	  			onVideoEnd: function() {
	  				videoID = 0;
	  				offerState = 0;
					}
				}, videoID);
			}
    };
		var instance = this;
}


function paymentFlimmerkiste(mode, playerid, gender){
	switch (mode){
		case "requesttv":
			flimmerkisteSponsorpay.initialize(playerid, gender);
			if (flimmerkisteSponsorpay.isAvailable()){
				return 1;
			}
			break;
		case "showtv":
			if (flimmerkisteSponsorpay.isAvailable()){
				flimmerkisteSponsorpay.show();
			}
			break;
	}
	return 0;
}

function paymentFlimmerkiste2(mode, playerid, gender){
	switch (mode){
		case "requesttv":
			flimmerkisteMothership.initialize(playerid, gender);
			if (flimmerkisteMothership.isAvailable()){
				return 1;
			}
			break;
		case "showtv":
			if (flimmerkisteMothership.isAvailable()){
				flimmerkisteMothership.show();
			}
			break;
	}
	return 0;
}

if (body && html) {
  body.onload = function () {
    if (isIframe) {
      var div1 = document.createElement("div");
      var text = document.createTextNode(document.title);
      div1.setAttribute("id", "title");
      //div1.style.color = "#ffffff";
      div1.style.height = "20px";
      div1.style.width = "100%";
      div1.style.textAlign = "center";
      div1.style.display = "block";
      div1.style.zIndex = "1000";
      div1.style.top = "0";
      div1.style.left = "0";
      div1.style.fontFamily = "arial, helvetica, sans-serif";
      div1.appendChild(text);
      body.insertBefore(div1, body.lastChild);
      body.style.height = (html.offsetHeight - 20) + "px";
      set_title(document.title);
    }
  };
  window.onresize = function () {
    if (isIframe) {
      var body = document.getElementsByTagName("body")[0];
      var html = document.getElementsByTagName("html")[0];
      body.style.height = (html.offsetHeight - 20) + "px";
    }

    var closeButton = document.getElementById("popupCloseButton");
    if (closeButton){
      var classNames = closeButton.className.split(' ');
      var popupElementId = "";
      var closeButtonClass = "";
      for ( var i in classNames){
        if (classNames[i].match(/^id.+/)){
          popupElementId = classNames[i].substr(2);
        } else if (classNames[i].match(/^popupCloseButton[0-9]+/)){
          closeButtonClass = classNames[i];
        }
      }

      if (popupElementId == ""){
        return;
      }

      var popupElement = document.getElementById(popupElementId);
      if (!popupElement){
        return;
      }

      var position = getOffset(popupElement);
      closeButton.style.top = (position.top-20) + "px";
      switch (closeButtonClass){
        case "popupCloseButton1":
          closeButton.style.left = (position.left-20) + "px";
          break;
        case "popupCloseButton2":
          closeButton.style.right = (position.left-20) + "px";
          break;
        default:
          return;
      }
    }
  }
}
"use strict";

const php_file = "chat.php";
let chatTimer = null;
let isRefreshLoopRunning = false;

function postData(url, data = {}) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data)
    }).then(response => {
        if (!response.ok) throw new Error("Błąd sieci serwera.");
        return response.json(); 
    });
}

function toggleLoader(show) {
    const loader = document.getElementById("ajax_loading");
    if (loader) loader.style.display = show ? "block" : "none";
}

function renderChatHtml(jsonResponse) {
    const chatBox = document.getElementById("chat_messages");
    if (!chatBox) return;

    let htmlBuffer = "";

    if (!jsonResponse.success && jsonResponse.error) {
        htmlBuffer += `<div class="message system_error_msg" style="background: rgba(255,0,0,0.15); border-left: 4px solid #ff0000; padding: 6px; margin-bottom: 8px;">
            <ul class="message_ul">
                <li><img src="res/chat/icons/icon_warn.png" /></li>
                <li><span style="color: #ff5555; font-weight: bold;">[SYSTEM]: ${jsonResponse.error}</span></li>
            </ul>
        </div>`;
    }

    const viewerGroup = parseInt(jsonResponse.viewer_group || 1);
    const messages = jsonResponse.messages || [];

    messages.forEach(chat => {
        let modoption = "";
        let adminoption = "";

        if (viewerGroup > 2) {
            modoption = `<li><img src="res/chat/icons/icon_conf.png" style="cursor:pointer;" onClick="admin_option(${chat.id});" /></li>`;
        }

        if (viewerGroup > 3) {
            adminoption = `
            <label style="cursor:pointer;" onClick="admin_action(5, ${chat.user_id});"><img src="res/chat/icons/icon_ban.png" /> Ban</label>
            <br><br>
            <label style="cursor:pointer;" onClick="admin_action(6, ${chat.user_id});"><img src="res/chat/icons/icon_unban.png" /> UnBan</label>`;
        }

        htmlBuffer += `<div class="message">
            <ul class="message_ul">
                ${modoption}
                <li><div class="admin_option" id="post_${chat.id}" style="display:none;">
                    <label style="cursor:pointer;" onClick="admin_action(2, ${chat.id});"><img src="res/chat/icons/icon_delete.png" /> Usuń Post</label>
                    <br><br>
                    <label style="cursor:pointer;" onClick="admin_action(3, ${chat.user_id});"><img src="res/chat/icons/icon_warn.png" /> Warn</label>
                    <br><br>
                    <label style="cursor:pointer;" onClick="admin_action(4, ${chat.user_id});"><img src="res/chat/icons/icon_unwarn.png" /> UnWarn</label>
                    <br><br>
                    ${adminoption}
                </div></li>
                <li>[${chat.time_html}]</li>
                <li>[${chat.lvl}]</li>
                <li><span class="${chat.color_class}">${chat.user_name}</span></li>
                <li>${chat.icons_html}</li>
                <li>${chat.body_html}</li>
            </ul>
        </div>`;
    });

    chatBox.innerHTML = htmlBuffer;
}

function update_chat() {
    toggleLoader(true);
    postData(php_file)
        .then(data => renderChatHtml(data))
        .catch(err => console.error("Błąd pobierania czatu:", err))
        .finally(() => toggleLoader(false));
}

function update_chat_set() {
    if (chatTimer) clearTimeout(chatTimer);

    postData(php_file)
        .then(data => {
            renderChatHtml(data);
            toggleLoader(false);
            chatTimer = setTimeout(update_chat_set, 5000);
        })
        .catch(err => {
            console.error("Czat offline lub błąd formatu JSON:", err);
            toggleLoader(false);
            chatTimer = setTimeout(update_chat_set, 5000);
        });
}

function send_chat() {
    const messageInput = document.getElementById("message");
    if (!messageInput) return;
    
    const msgVal = messageInput.value;
    if (msgVal.trim() === "") return;

    toggleLoader(true);
    postData(php_file, { act: "1", data: msgVal })
        .then(data => {
            messageInput.value = "";
            renderChatHtml(data);
        })
        .catch(err => console.error("Nie udało się wysłać:", err))
        .finally(() => toggleLoader(false));
}

function admin_option(post_id) {
    const postEl = document.getElementById("post_" + post_id);
    if (!postEl) return;
    const currentDisplay = window.getComputedStyle(postEl).display;
    postEl.style.display = (currentDisplay === "none") ? "block" : "none";
}

function admin_action(act, data) {
    toggleLoader(true);
    postData(php_file, { act: act, data: data })
        .then(() => update_chat())
        .catch(err => console.error(err))
        .finally(() => toggleLoader(false));
}

function em(theSmilie) {
    doAddTags(theSmilie, '', 'message');
}

function chat_editor() {
    const obj = "message";
    const url = "res/chat/icons";
    const coloroptions = [
        "#000000", "#A6A6A6", "#001EFF", "#00FFF7", 
        "#009900", "#00FF04", "#F7FF00", "#FF6600", 
        "#FF0000", "#FF9696", "#E0DCDC", "#FF00FF", 
        "#9900FF", "#00FFAA", "#ABB7EF", "#966D06"
    ];

    let editorHtml = `<div id="editor_option">
        <img src="${url}/icon_removeformat.png" title="Usuń BBCode" onClick="doRemoveTags('${obj}')" />
        <img src="${url}/icon_bold.png" title="Pogrubiony" onClick="doAddTags('[b]','[/b]','${obj}')" />
        <img src="${url}/icon_italic.png" title="Pochylony" onClick="doAddTags('[i]','[/i]','${obj}')" />
        <img src="${url}/icon_underline.png" title="Podkreślony" onClick="doAddTags('[u]','[/u]','${obj}')" />
        <img src="${url}/icon_color.png" id="popColor" title="Kolor textu" onClick="showpopup('color','popColor')" />
        <img src="${url}/icon_link.png" title="Wstaw Link" onClick="doURL('${obj}')" />
        <img src="${url}/icon_unlink.png" title="Usuń Linki" onClick="doRemoveURL('${obj}')" />
        <img src="${url}/icon_image.png" title="Wstaw Grafikę" onClick="doImage('${obj}')" />
    </div>`;

    let colorHtml = `<div id="color" style="display: none; z-index: 100; text-align: center;">`;
    for (let i = 0; i < coloroptions.length; i++) {
        if (i % 8 === 0 && i !== 0) colorHtml += `<br style="clear: left;" />`;
        colorHtml += `<div style="background-color: ${coloroptions[i]}; width: 15px; height: 15px; float: left; cursor: pointer;" onClick="doSetColor('${coloroptions[i]}','${obj}')"></div>`;
    }
    colorHtml += `</div>`;

    function bindElements() {
        const msgInput = document.getElementById(obj);
        if (!msgInput) return false;

        if (msgInput.dataset.initialized === "true") return true;
        msgInput.dataset.initialized = "true";

        msgInput.insertAdjacentHTML('beforebegin', editorHtml + colorHtml);
        
        msgInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); 
                send_chat();
            }
        });
        return true;
    }

    if (!bindElements()) {
        const checkExistInterval = setInterval(() => {
            if (bindElements()) {
                clearInterval(checkExistInterval);
            }
        }, 50);
        setTimeout(() => clearInterval(checkExistInterval), 5000);
    }
}


function doRemoveTags(obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    let txt = textarea.value;
    const simpel_strip  = ['b', 'i', 'u', 'center', 'pre', 'quote', 'img'];
    const complex_strip = ['font', 'color', 'size'];

    for (let tag = 0; tag < simpel_strip.length; tag++) {
        let opentag  = '['  + simpel_strip[tag] + ']';
        let closetag = '[/' + simpel_strip[tag] + ']';
        let startindex = 0;
        let stopindex = 0;

        while ((startindex = stripos(txt, opentag)) !== false) {
            if ((stopindex = stripos(txt, closetag)) !== false) {
                let text = txt.substr(startindex + opentag.length, stopindex - startindex - opentag.length);
                txt = txt.substr(0, startindex) + text + txt.substr(stopindex + closetag.length);
            } else {
                break;
            }
        }
    }

    for (let tag = 0; tag < complex_strip.length; tag++) {
        let opentag  = '['  + complex_strip[tag] + '=';
        let closetag = '[/' + complex_strip[tag] + ']';
        let startindex = 0;
        let stopindex = 0;

        while ((startindex = stripos(txt, opentag)) !== false) {
            if ((stopindex = stripos(txt, closetag)) !== false) {
                let openend = stripos(txt, ']', startindex);
                if (openend !== false && openend > startindex && openend < stopindex) {
                    let text = txt.substr(openend + 1, stopindex - openend - 1);
                    txt = txt.substr(0, startindex) + text + txt.substr(stopindex + closetag.length);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    textarea.value = txt;
}

function doRemoveURL(obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    let txt = textarea.value;
    const opentag = '[url=';
    const closetag = '[/url]';
    let startindex = 0;
    let stopindex = 0;

    while ((startindex = stripos(txt, opentag)) !== false) {
        if ((stopindex = stripos(txt, closetag)) !== false) {
            let openend = stripos(txt, ']', startindex);
            if (openend !== false && openend > startindex && openend < stopindex) {
                let text = txt.substr(openend + 1, stopindex - openend - 1);
                txt = txt.substr(0, startindex) + text + txt.substr(stopindex + closetag.length);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    let opentagSimple = '[url]';
    while ((startindex = stripos(txt, opentagSimple)) !== false) {
        if ((stopindex = stripos(txt, closetag)) !== false) {
            let text = txt.substr(startindex + opentagSimple.length, stopindex - startindex - opentagSimple.length);
            txt = txt.substr(0, startindex) + text + txt.substr(stopindex + closetag.length);
        } else {
            break;
        }
    }
    textarea.value = txt;
}

function doImage(obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    const url = prompt('Wstaw obrazek:', 'http://');
    if (url && url !== '' && url !== 'http://') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const rep = '[img]' + url + '[/img]';

        textarea.value = textarea.value.substring(0, start) + rep + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + rep.length, start + rep.length);
    }
}

function doURL(obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    const url = prompt('Wstaw Link:', 'http://');
    if (url && url !== '' && url !== 'http://') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const sel = textarea.value.substring(start, end);
        
        const rep = (sel === "") ? ('[url]' + url + '[/url]') : ('[url=' + url + ']' + sel + '[/url]');

        textarea.value = textarea.value.substring(0, start) + rep + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + rep.length, start + rep.length);
    }
}

function doAddTags(tag1, tag2, obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = textarea.value.substring(start, end);
    const rep = tag1 + sel + tag2;

    textarea.value = textarea.value.substring(0, start) + rep + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + rep.length, start + rep.length);
}

function doAddTagsForEmote(tag1, tag2, obj) {
    doAddTags(tag1, tag2, obj);
}

function doSetColor(color, obj) {
    const textarea = document.getElementById(obj);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = textarea.value.substring(start, end);
    const rep = "[color=" + color + "]" + sel + "[/color]";

    textarea.value = textarea.value.substring(0, start) + rep + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + rep.length, start + rep.length);

    const colorDiv = document.getElementById("color");
    if (colorDiv) colorDiv.style.display = "none";
}

function stripos(f_haystack, f_needle, f_offset) {
    const haystack = (f_haystack + '').toLowerCase();
    const needle   = (f_needle   + '').toLowerCase();
    const index = haystack.indexOf(needle, f_offset);

    return (index !== -1) ? index : false;
}

function showpopup(div, wer) {
    const menu   = document.getElementById(div);
    const sender = document.getElementById(wer);
    if (!menu || !sender) return;

    if (menu.style.display === "none") {
        const pos = getPosition(sender);

        if (wer === "popFont") {
            menu.style.left = (pos.x - 58) + "px";
        } else if (wer === "popColor") {
            menu.style.left = pos.x + "px";
        } else {
            menu.style.left = (pos.x - 40) + "px";
        }

        menu.style.top = (pos.y + 17) + "px";
        menu.style.backgroundColor = "#FFFFFF";
        menu.style.padding = "3px";
        menu.style.position = "absolute";
        menu.style.display = "inline";
    } else {
        menu.style.display = "none";
    }
}

function getPosition(was) {
    let div = was;
    let x = 0;
    let y = 0;

    while (div && typeof div === "object" && typeof div.tagName !== "undefined") {
        let tagname = div.tagName.toUpperCase();
        y += div.offsetTop;
        x += div.offsetLeft;

        if (tagname === "BODY") {
            break;
        }
        div = div.offsetParent;
    }

    return { x: x, y: y };
}

chat_editor();
update_chat_set();
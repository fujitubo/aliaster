/**
 * alias.js
 *
 * Author URI: http://gekkai.org/aliaster/
 * Version: 0.6.0
 * Copyright 2014 Gekkai
 */
function init() {
	var rslt;
	var ctrl = window.document.getElementById('als-list');
	ctrl.addEventListener('change', function(e) {
		var ctl = window.document.getElementById('alias');
		ctl.value = e.target.value;	
	});
	
	rslt = cerateSelList(ctrl);	
	if (rslt != "") {
		var ctl = window.document.getElementById('alias');
		ctl.value = rslt;
		ctl.disabled = false;
		ctrl.disabled = false;
	}
	ctrl = window.document.getElementById('als-title');
	ctrl.innerHTML = "alias : " + tinyMCEPopup.editor.selection.getContent({format : 'text'}) + " ";
}

// aliasの設定
function setAlias() {
	var ed = tinyMCEPopup.editor;
	var selval = ed.selection.getContent({format : 'text'});
	selval = escDec(selval);
	var r = checkParam(ed, selval);
	if (!r.code) {
		return false;
	}

	setAliasContent(ed, selval, r);

	var cf = tinyMCEPopup.getWindowArg("onClose", null);
	if (cf) {
		cf();
	}
	tinyMCEPopup.close();
	return true;
}

function escDec(str){
	str = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return str.replace(/[:,'"]/g, function(m){return "&#" + m.charCodeAt(0) + ';'});
}

function checkParam(ed, sel) {
	var type = 'table';
	var rslt = {
		code : true,
		newval : ''
	};
	
	var content = ed.getContent();
	rslt.newval = escDec( window.document.getElementById('alias').value );
	if (rslt.newval == ''){
		alert("Set alias please !");
		rslt.code = false;
		return rslt;
	}
	return rslt;
}

function setAliasContent(ed, sel, param) {
	var style = ed.getParam('als_style');
	var cls = 'als-table';

	var node = ed.selection.getNode();
	var r = ed.selection.getRng();
	// 直前にaliasが設定してあると、そこに挿入すると前の要素の子要素に設定されてしまうので、
	// その場合はexecCommandを使用せずに直接設定する。
	// 要素内の先頭のコンテンツでその直後にaliasがある場合も同様になるため、直接設定する。
	if (r.startOffset == 0 
		&& (r.startContainer == r.commonAncestorContainer)) {
		var prv = r.startContainer.previousSibling;
		if (prv && prv.nodeType == 1) {
			var cl = prv.getAttribute("class");
			if (cl && cl.indexOf("als-") == 0) {
				var newElement = document.createElement("span");
				newElement.innerText = sel;
				newElement.setAttribute("class", cls);
				newElement.setAttribute("style", style);
				prv.parentNode.insertBefore(newElement, prv.nextSibling);
				// 追加した分を削除
				r.startContainer.nodeValue = r.startContainer.nodeValue.substr(r.endOffset);
				return;
			}
		}
		if (r.startContainer.nodeValue == sel) {
			var next = r.endContainer.nextSibling;
			if (next && next.nodeType == 1) {
				var cl = next.getAttribute("class");
				if (cl && cl.indexOf("als-") == 0) {
					var newElement = document.createElement("span");
					newElement.innerText = sel;
					newElement.setAttribute("class", cls);
					newElement.setAttribute("style", style);
					next.parentNode.insertBefore(newElement, next);
					// 追加した分を削除
					next.parentNode.removeChild(r.startContainer);
					return;
				}
			}
		}
	}

	var str = '<span class="' + cls + '" style="' + style + '" title="' + param.newval + '">' + sel + "</span>";
	ed.execCommand('mceInsertContent', false, str);
}

function cerateSelList(sel) {
	var keys = tinyMCEPopup.getWindowArg("keys", null);
	var ed = tinyMCEPopup.editor;

	if (!keys) {
		sel.style.display="none";
		return "";
	}
	var rslt = "";
	var selrslt = "";
	var idx = 0;

	var selval = ed.selection.getContent({format : 'text'});
	for (var key in keys) {
		if (key == selval) {
			rslt += '"<option value="' + keys[key] + '">' + key + ':' + keys[key] + '</option>';
			selrslt = keys[key];
			sel.selectedIndex = idx;
		} else {
			rslt += '"<option value="' + keys[key] + '">' + key + ':' + keys[key] + '</option>';
		}
		idx ++;
	}

	sel.innerHTML = rslt;
	return selrslt;
}

tinyMCEPopup.onInit.add(init);


/**
 * alias.js
 *
 * Author URI: http://gekkai.org/aliaster/
 * Version: 0.5
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
	return str.replace(/[:,]/g, function(m){return "&#" + m.charCodeAt(0) + ';'});
}

function checkParam(ed, sel) {
	var ctrl;
	var type = 'table';
	var rslt = {
		code : true,
		comm : '',
		tbl : '',
		oldval : '',
		newval : ''
	};
	
	var re = /(<!-- alias) (.*) (-->)/m;
	var content = ed.getContent();
	switch (type) {
		case 'table':
			rslt.newval = escDec( window.document.getElementById('alias').value );
			if (rslt.newval == ''){
				alert("Set alias please !");
				rslt.code = false;
				return rslt;
			}
			ctrl = window.document.getElementById('alias');
			if (!content.match(re)) {
				return rslt;
			}
			rslt.tbl = RegExp.$2;
			rslt.comm = RegExp.lastMatch;
			var list = rslt.tbl.split(",");
			var idx = -1;
			// 既に登録しているかチェック
			for (var i = 0; i < list.length; i++) {
				if (list[i].indexOf(sel + ":") == 0) {
					idx = i;
					break;
				}
			}
			if (idx < 0) {
				return rslt;
			}
			var l = list[i].split(":");
			rslt.oldval = l[1];
			if (rslt.newval == l[1]) {
				return rslt;
			}
			var msg = '"' + sel + '" alias is set to "' + l[1] + '" already!\nDo you want to change ?';
			if (!window.confirm(msg)) {
				rslt.code = false;
				return rslt;
			}
			break;
		default:
			if (!content.match(re)) {
				return rslt;
			}
			rslt.tbl = RegExp.$2;
			rslt.comm = RegExp.lastMatch;
			break;
	}
	return rslt;
}

function setAliasContent(ed, sel, param) {
	var style = ed.getParam('als_style');
	var cls = 'als-table';
	var addtbl = 0;
	
	if (param.tbl == '' || param.oldval != param.newval) {
		addtbl = 1;
	}

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

	var str = '<span class="' + cls + '" style="' + style + '" >' + sel + "</span>";
	if (!addtbl) {
		str = '<span id="als-new" class="' + cls + '" style="' + style + '" >' + sel + "</span>";
	}
	ed.execCommand('mceInsertContent', false, str);

	if (addtbl) {
		// テーブルを追加した時はコンテンツを全部置き換えてしまうせいか、カーソル制御ができない
		setAliasTable(ed, sel, param);
	} else {
		// idで検索したいが、何故かできないので自分で探す
		for (var i = 0; i < node.childNodes.length; i++) {
			var ctrl = node.childNodes[i];
			if (!ctrl.nodeName.match(/^span/i)) {
				continue;
			}
			var id = ctrl.getAttribute("id");
			if (id && id == 'als-new'){
				ed.selection.select(ctrl);
				ctrl.setAttribute("id", "");
				break;
			}
		}
	}
}

// aliasテーブル設定
function setAliasTable(ed, sel, p) {
	// set alias table
	var ctrl = window.document.getElementById('alias');
	var content = ed.getContent();
	if (p.comm == '') {
		// コメントなしの場合
		if (p.newval == '') {
			content = content + "<!-- alias  -->";
		} else {
			content = content + "<!-- alias " + sel + ":" + p.newval + " -->";
		}
	} else if (p.tbl == '') {
		// テーブルなしの場合
		comm = "<!-- alias " + sel + ":" + p.newval + " -->";
		content = content.replace(p.comm, comm);
	} else {
		var comm;
		if (p.oldval == '') {
			// 未登録の場合
			comm = "<!-- alias " + p.tbl + "," + sel + ":" + p.newval + " -->";
		} else {
			// 登録済みの場合：変更
			comm = p.comm.replace(sel + ":" + p.oldval, sel + ":" + p.newval);
		}
		content = content.replace(p.comm, comm);
	}

	ed.execCommand('mceSetContent', false, content);
}

function cerateSelList(sel) {
	var ed = tinyMCEPopup.editor;
	var str = ed.getContent();
	var re = /(<!-- alias) (.*) (-->)/m;
	if (str.match(re)) {
		var selval = ed.selection.getContent({format : 'text'});
		var node = ed.selection.getNode();
		var comm = RegExp.$2;
		var list = comm.split(",");
		if (list.length == 1 && list[0] == "" ) {
			sel.style.display="none";
			return "";
		}

		var rslt = "";
		var selrslt = "";
		var idx = 0;
		for (var i = 0; i < list.length; i++) {
			var l = list[i].split(":");
			//if (l[0] == node.innerHTML) {
			if (l[0] == selval) {
				rslt += '"<option value="' + l[1] + '">' + list[i] + '</option>';
				selrslt = l[1];
				idx = i;
			} else {
				rslt += '"<option value="' + l[1] + '">' + list[i] + '</option>';
			}
		}
		sel.innerHTML = rslt;
		sel.selectedIndex = idx;
		return selrslt;
	} else {
		sel.style.display="none";
	}
	return "";
}

tinyMCEPopup.onInit.add(init);


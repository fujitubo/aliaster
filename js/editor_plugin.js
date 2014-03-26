/**
 * editor_plubin.js
 *
 * @package Aliaster
 * @author Gekkai
 * Author URI: http://gekkai.org
 * Version: 0.5
 */
(function() {
	if ( 'undefined' === typeof( tinymce ) ) {
		return;
	}

	tinymce.PluginManager.requireLangPack('AliasButtons');
	tinymce.create('tinymce.plugins.AliasButtons', {
		// プラグイン情報
		getInfo : function() {	
			return {
				longname : 'alias button',
				author : 'fujitubo gekkai',
				authorurl : 'http://gekkai.org',
				infourl : 'http://gekkai.org/aliaster/',
				version : "0.1"
			};
		},
		// urlは本スクリプトのurlが指定される
		init : function(ed, url) {
			var t = this;
			t.editor = ed;

			// Alias Button
			ed.addButton('Alias', {		// ボタンの名前
				title : 'AliasButtons.aliassimple',
				cmd : 'Aliaster',		// コマンドID
				image: url + '/../images/als_simple.png'
			});
			ed.addCommand(
				'Aliaster',	// コマンドID
				function(){
					var btn = ed.controlManager.get('Alias');
					if (btn.isActive()) {
						t.clearAlias(ed);
					} else {
						t.setAliasContent(ed, "simple");
						t.addComment(ed);
					}
					t.updateButton(ed);
				}

			);

			// Alias Simple Number Button
			ed.addButton('AliasNum', {	// ボタンの名前
				title : 'AliasButtons.aliasnumber',
				cmd : 'AliasNum', 			// コマンドID
				image: url + '/../images/als_num.png'
			});
			ed.addCommand(
				'AliasNum',	// コマンドID
				function() {
					var btn = ed.controlManager.get('AliasNum');
					if (btn.isActive()) {
						t.clearAlias(ed);
					} else {
						t.setAliasContent(ed, "simple-num");
						t.addComment(ed);
					}
					t.updateButton(ed);
				}
			);

			// Alias Table Button
			ed.addButton('AliasTable', {	// ボタンの名前
				title : 'AliasButtons.aliastable',
				cmd : 'AliasTable', 			// コマンドID
				image: url + '/../images/als_table.png'
			});
			ed.addCommand(
				'AliasTable',	// コマンドID
				function() {
					var btn = ed.controlManager.get('AliasTable');
					if (btn.isActive()) {
						t.clearAlias(ed);
					} else {
						ed.windowManager.open(
							{
								url: url + "/dlg.htm",
								width: 350,
								height: 150,
								inline: 1
							},
							{
								plugin_url:url,
								onClose: function(){
									var node = ed.controlManager.get('als-new');
									if (node) {
										ed.selection.select(node);
										node.setAttribute("id", "");
									}
									t.updateButton(ed);
								}
							}
						)
					}
					t.updateButton(ed);
				}
			);

            // Alias Paragraph Button
            ed.addButton('AliasParag', {    // ボタンの名前
                title : 'AliasButtons.aliasparag',
                cmd : 'AliasParag',             // コマンドID
                image: url + '/../images/als_parag.png'
            });
            ed.addCommand(
                'AliasParag',   // コマンドID
                function() {
                    t.setParagAlias(ed);
                }
            );

			ed.onExecCommand.add( function(ed, cmd, ui, val) {
        		console.debug('Command was executed: ' + cmd);
      		});
			ed.onInit.add(function(ed) {
				ed.controlManager.setDisabled('Alias', true);
				ed.controlManager.setDisabled('AliasNum', true);
				ed.controlManager.setDisabled('AliasTable', true);
				ed.controlManager.setDisabled('AliasParag', true);
			});

			ed.onMouseUp.add(function(ed, e) {
				t.updateButton(ed);
			});

			ed.onKeyUp.add(function(ed, e) {
				switch(e.keyIdentifier) {
					case 'Up':
					case 'Donw':
					case 'Left':
					case 'Right':
					case 'Home':
					case 'End':
						t.updateButton(ed);
						break;
				}
			});
/*
			ed.onActivate.add(function(ed) {
				var node = ed.controlManager.get('als-new');
				if (node) {
					ed.selection.select(node);
					node.setAttribute("id", "");
				}
			});
			ed.onNodeChange.add(function(ed, cm,e) {
				var node = ed.controlManager.get('als-new');
				if (node) {
					ed.selection.select(node);
					node.setAttribute("id", "");
				}
			});
*/
		},
		clearAlias : function(ed) {
			var sel = ed.selection;
			var node = sel.getNode();
			// spanタグかどうかチェック
			if (!node.nodeName.match(/^span/i)) {

				this.clearParagAlias(ed);

				return;
			}
			// aliasのクラスかどうかチェック
			if (node.getAttribute('class').indexOf('als-') != 0) {
				return;
			}
			// TEXTノードに置き換える
			var p = node.parentNode;
			var newElement = document.createTextNode(node.innerText);
			var n = p.replaceChild(newElement, node);
			ed.selection.select(newElement);
		},

		clearParagAlias : function(ed) {
			var sel = ed.selection;
			var node = sel.getNode();
			// pタグかどうかチェック
			if (!node.nodeName.match(/^p$/i)) {
				return;
			}
			// aliasのクラスかどうかチェック
			var cls = node.getAttribute('class');
			if (!cls || !cls.match(/^als-/)) {
				return;
			}
			// TEXTノードに置き換える
			cls = cls.replace(/als-[^\s]+/, '');
			node.setAttribute('class', cls);
			node.setAttribute('style', "");
		},

		setParagAlias : function(ed) {
			var sel = ed.selection;
			var node = sel.getNode();
			var r = sel.getRng();
			// pタグかどうかチェック
			if (!node.nodeName.match(/^p$/i)) {
				return;
			}

			// aliasのクラスかどうかチェック
			var cl = node.getAttribute('class');
			if (cl) {
				if (cl.match(/^als-/)) {
					this.clearParagAlias(ed);
					ed.controlManager.get('AliasParag').setActive(false);
					return;
				}
				cl += " als-simple";
			} else {
				cl = "als-simple";
			}

			// 属性追加
			node.setAttribute("class", cl);
			var style = ed.getParam('als_style');
			node.setAttribute("style", style);

			this.addComment(ed);

//			ed.controlManager.setDisabled('AliasParag', true);
			var btn = ed.controlManager.get('AliasParag');
			btn.setActive(true);
		},

		addComment : function(ed) {
			var re = /(<!-- alias) (.*) (-->)/m;
			var content = ed.getContent();
			if (content.match(re)) {
				return;
			}
			content = content + "<!-- alias  -->";
			ed.execCommand('mceSetContent', false, content);
		},

		setAliasContent: function(ed, type) {
			var style = ed.getParam('als_style');
			var cls = 'als-' + type;
			var sel = ed.selection.getContent({format : 'text'});

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
		
			// 変更した要素を選択状態にするためにidも設定しておく。このidは選択したら削除する。
			var str = '<span id="als-new" class="' + cls + '" style="' + style + '" >' + sel + "</span>";
			//var str = '<span class="' + cls + '" style="' + style + '" >' + sel + "</span>";
			ed.execCommand('mceInsertContent', false, str);
			

			// 変更した要素を選択状態にする
			//var ctrl = ed.controlManager.get('als-new');
//			ctrl = node.getElementById('als-new');
//			ed.selection.select(ctrl);
//			ctrl.setAttribute("id", "");
			
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
		},

		anaClass : function(ed) {
			var sel = ed.selection;
			var node = sel.getNode();
			var rslt = {
				tag: node.tagName,
				type: null,
				sub: null
			};

			// aliasのクラスかどうかチェック
			var cls = node.getAttribute('class');
			if (!cls) {
				return rslt;
			}

			var re = /(als-)([^ ]+).*/m;
			if (cls.match(re)) {
				rslt.type = RegExp.$2;

				if (rslt.type.match(/(.+)-(.+)/)) {
					rslt.type = RegExp.$1;
					rslt.sub = RegExp.$2;
				}
			}
			return rslt;
		},

		pushToggle : function(ed, sel) {
			var btns = new Array('Alias', 'AliasNum', 'AliasTable', 'AliasParag');
			var enb;
			for (var i = 0; i < btns.length; i++){
				if (btns[i] == sel) {
					enb = true;
				} else {
					enb = false;
				}
				ed.controlManager.setDisabled(btns[i], !enb);
				ed.controlManager.get(btns[i]).setActive(enb);
			}
		},
		updateButton : function(ed) {
			// マウスアップ：ボタンの有効・無効切替
			var sel = ed.selection;
			var r = sel.getRng();


			if (   r.startContainer != r.endContainer 
				&& r.startContainer.parentNode != r.endContainer.parentNode
				&& !r.commonAncestorContainer.nodeName.match(/^p$/i)
			) {
				// 複数行が選択されて場合（この条件で十分かは？？？）
				ed.controlManager.setDisabled('Alias', true);
				ed.controlManager.setDisabled('AliasNum', true);
				ed.controlManager.setDisabled('AliasTable', true);
				ed.controlManager.setDisabled('AliasParag', true);
				return;
			}

			var rslt = this.anaClass(ed);
			if (rslt.type) {
				switch(rslt.type) {
					case 'table':
						this.pushToggle(ed, 'AliasTable');
						break;
					case 'simple':
						if (rslt.tag == 'P') {
							this.pushToggle(ed, 'AliasParag');
						} else {
							if (rslt.sub == 'num') {
								this.pushToggle(ed, 'AliasNum');
							} else {
								this.pushToggle(ed, 'Alias');
							}
						}
						break;
				}
			} else {
				if (r.collapsed) {
					// 選択範囲なし
					ed.controlManager.setDisabled('Alias', true);
					ed.controlManager.setDisabled('AliasNum', true);
					ed.controlManager.setDisabled('AliasTable', true);
					ed.controlManager.setDisabled('AliasParag', false);
				} else {
					ed.controlManager.setDisabled('Alias', false);
					ed.controlManager.setDisabled('AliasNum', false);
					ed.controlManager.setDisabled('AliasTable', false);
					ed.controlManager.setDisabled('AliasParag', false);
				}
				ed.controlManager.get('Alias').setActive(false);
				ed.controlManager.get('AliasNum').setActive(false);
				ed.controlManager.get('AliasTable').setActive(false);
				ed.controlManager.get('AliasParag').setActive(false);
			}
			return;
		},

		getText : function() {
			return "tinymce.plugins.AliasButtons-JS";
		}
	});
	tinymce.PluginManager.add('AliasButtons', tinymce.plugins.AliasButtons);
})();


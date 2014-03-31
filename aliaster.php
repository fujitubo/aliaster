<?php
/*
Plugin Name: Aliaster
Plugin URI: http://gekkai.org/aliaster/
Description: This is a plugin to be displayed instead to another arbitrary strings of posts within.
Version: 0.6.0
Author: Gekkai
License: GPL2
*/

/*
	Aliaster. This is a plugin to be displayed instead to another arbitrary strings of posts within. 
	Copyright (C) 2014 Gekkai

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License along
	with this program; if not, write to the Free Software Foundation, Inc.,
	51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

$alister_enable = false;

if ( ! function_exists('aliaster_load_default_opt') ) {
	function aliaster_load_default_opt() {
		$alst_options = get_option('alst_options');
		if ( ! empty($alst_options) ) {
//			update_option('alst_options', array( 'out_space' => 1, 'out_toggle' => 1, 'style' => 'color: #808080; font-weight:bold;','simple_char' => '■' , 'simple_num_char' => 'x' ));
			return;
		} else {

		}

		$alst_options = array( 'out_space' => 1, 'search_disable' => 0, 'out_toggle' => 1, 'style' => 'color:#808080;font-weight:bold;',
				'simple_char' => '■' , 'simple_num_char' => 'x');

		add_option( 'alst_options', $alst_options );
	}
	add_action( 'init', 'aliaster_load_default_opt' );
} else {
//	update_option('alst_options', array( 'out_space' => 1, 'out_toggle' => 0 ));
//	add_action( 'init', 'aliaster_load_default_opt' );
}

/**
 * hook the_content,the_excerpt
 *
 * @param $content
 *
 * @return string
 */
function aliaster_exec( $content ) {
	global $alister_enable;
	if (preg_match('/ class="\s*als-.+?"/', $content)) {
		$alister_enable = true;
	}

	$add_form = "";
	if ($alister_enable && is_user_logged_in()) {
		// case login
		$stat = get_post_status();
		//if ($stat != 'draft' && is_single()) {
		if (is_single() || is_page()) {
			// not draft && single view : enable change form
			if (!array_key_exists("func", $_POST) || $_POST["func"] != 1) {
				return $content . aliaster_create_form(0);
			} else {
				$add_form = aliaster_create_form(1);
			}
		}
	}

	// <p>
	$out_c = aliaster_exec_proc_parag($content);

	// alias proc
	return aliaster_exec_proc($out_c) . $add_form;
}

function aliaster_dec($str) {
	return preg_replace_callback(
			"|$#(\n+);|",
			function ( $matches ) {
				$tbl = array('44' => ',', '58' => ':', '34' => '"', '39' => '\'' );
				return empty($tbl[$matches[1]]) ? $matches[0] : $tbl[$matches[1]];
			},
			$str);
}

function aliaster_exec_proc_parag( $content ) {
	// alias proc
	$out_c = preg_replace_callback(
		"|(<p\s.*?>)(.+?)(<\/p>)|", 
		"aliaster_search_parag",
		$content);
	return $out_c;
}

function aliaster_search_parag( $matches ) {

    $alst_options = get_option('alst_options');
	$space = empty($alst_options['out_space']) ? '' : ' ';

	if (preg_match("/(class=)(\".+?\")/", $matches[1], $mts) ) {
		// check class
		if ( preg_match("/[\"|\s](als-.+?)[\"|\s]/", $mts[2], $temp) ) {
			// check als clase
			$items = explode( "-", $temp[1] );
			switch ($items[1]) {
				case 'simple':
					return empty($alst_options['simple_parag']) ? '' : $matches[1] . $alst_options['simple_parag'] . $matches[3];
				default:
					return $matchs[0];
			}
		} else {
			return $matches[0];
		}
	} else {
		return $matches[0];
	}
}

function aliaster_exec_proc( $content ) {
	// alias proc
	$out_c = preg_replace_callback(
		"|(<span\s.*?>)(.+?)(<\/span>)|", 
		"aliaster_search",
		$content);
	return $out_c;
}

/*
 * matches[1]:start tag
 * matches[2]:content
 * matches[3]:end tag
 */
function aliaster_search( $matches ) {

    $alst_options = get_option('alst_options');
	$space = empty($alst_options['out_space']) ? '' : ' ';

	if (preg_match("/(class=)(\".+?\")/", $matches[1], $mts) ) {
		// check class
		if ( preg_match("/[\"|\s](als-.+?)[\"|\s]/", $mts[2], $temp) ) {
			// check als clase
			$items = explode( "-", $temp[1] );

			switch ($items[1]) {
				case 'simple':
					$sub = (count($items) == 3) ? $items[2] : null;
					return $space . $matches[1] . aliaster_create_simple($matches[2], $sub) . $matches[3] . $space;

				case 'table':
					if (preg_match("/ title=\"(.+?)\"/", $matches[1], $mtb) ) {
						// delete title
						$stag = preg_replace_callback(
							"/ title=\"(.+?)\"/",
							function ( $m ) {
								return "";
							},
							$matches[1]);
						return $space . $stag . aliaster_dec($mtb[1]) . $matches[3] . $space;
					} else {
						return $matches[1] . aliaster_exec_proc( $matches[2] . "</span>" );
					}

				default:
					return $matches[1] . aliaster_exec_proc( $matches[2] . "</span>" );
			}

		} else {
			return $matches[1] . aliaster_exec_proc( $matches[2] . "</span>" );
		}

	} else {
		return $matches[1] . aliaster_exec_proc( $matches[2] . "</span>" );
	}
}

/*
 * create toggle form
 */
function aliaster_create_form($func) {
	$alst_options = get_option('alst_options');
	if (empty($alst_options['out_toggle'])) {
		return '';
	}

	$rslt = '<form name="alsForm" acion="." method="post"><p class="form-submit" style="text-align: right;">';
	if ($func != 1) {
		$rslt .= '<a href="javascript:document.forms[\'alsForm\'].submit();">alias</a><input type="hidden" name="func" value="1" />';
	} else {
		$rslt .= '<a href="javascript:document.forms[\'alsForm\'].submit();">fact</a>';
	}
	$rslt .= '</p><p></p></form>';
	return $rslt;
}

function aliaster_create_simple($val, $param) {
    switch ($param) {
        case null:
            return aliaster_create_simple_all($val);
        case 'num':
            return aliaster_create_simple_num($val);
		default:
			return $val;
    }
}

/*
 * replace all chars by same char
 */
function aliaster_create_simple_all($val) {
    $alst_options = get_option('alst_options');
    $str = '*';
    if (!empty($alst_options['simple_char'])) {
        $str = $alst_options['simple_char'];
    }

	$len = mb_strlen( $val );
	$rslt = "";
	for ($i = 0; $i < $len; $i++) {
		$rslt .= $str;
	}
	return $rslt;
}

function aliaster_create_simple_num($val) {
    $alst_options = get_option('alst_options');
    return preg_replace("/[0-9０-９]/u", $alst_options['simple_num_char'], $val);
}


//-------------------------------------------------------------------------------
// Editor Button
//-------------------------------------------------------------------------------
class AliasButton {
	function AliasButton() {
		add_action('plugins_loaded', array(&$this, 'Initalization'));
	}
	function sink_hooks(){
		add_filter('mce_plugins', array(&$this, 'mce_plugins'));
	}
	function Initalization() {
		add_action('init', array(&$this, 'addbuttons'));
	}
	function addbuttons() {
		if ( !current_user_can('edit_posts') && !current_user_can('edit_pages') ) {
			return;
		}

		// case rich editoer
		if ( get_user_option('rich_editing')) {
			add_filter("mce_external_plugins", array(&$this, 'mce_external_plugins'));
			add_filter('mce_buttons', array(&$this, 'mce_buttons'));
		}
	}

	function mce_buttons($buttons) {
		// add buttons
		array_push($buttons, "separator", "Alias");
		array_push($buttons, "AliasNum");
		array_push($buttons, "AliasTable");
		array_push($buttons, "AliasParag");
		return $buttons;
	}

	// set plugin file
	function mce_external_plugins($plugin_array) {
		$plugin_array['AliasButtons'] = get_bloginfo('wpurl') .'/wp-content/plugins/aliaster/js/editor_plugin.js';
		return $plugin_array;
	}
}

function custom_editor_settings( $initArray ){
	$alst_options = get_option('alst_options');
	if (!empty($alst_options['style'])) {
		$initArray['als_style'] = $alst_options['style'];
	}
	return $initArray;
}


function aliaster_serch_form($form){
	$alst_options = get_option('alst_options');
	if (!empty($alst_options['search_disable']) && !is_user_logged_in()) {
		return "";
	}
	return $form;
}


$mybutton = new AliasButton();
add_action('init',array(&$mybutton, 'AliasButton'));

add_filter( 'the_content', 'aliaster_exec' );
add_filter( 'the_excerpt', 'aliaster_exec' );
add_filter( 'tiny_mce_before_init', 'custom_editor_settings' );

add_filter( 'get_search_form', 'aliaster_serch_form' );

function aliaster_plugin_menu() {
	add_options_page('Aliaster Plugin Options', 'Aliaster', 'level_8', __FILE__, 'aliaster_plugin_options');
}

function aliaster_plugin_options() {
	$opt_name = 'alst_options';
	$act_url = str_replace( '%7E', '~', $_SERVER['REQUEST_URI']);
	$opt_title = __('Aliaster options', 'aliaster_domain'); 
	$submit_val = __('Update options', 'aliaster_domain');
	$opt_val = get_option( $opt_name );
	$update_rslt = "";
	$srearch_disable = '';
	$toggle = '';
	$submit_disable = 'disabled';
	$out_space = '';
	$filed_name = array(
		'style' => 'als_style',
		'search_disable' => 'als_search_disable', 
		'out_toggle' => 'alt_toggle', 
		'out_space' => 'alt_outspace', 
		'simple_parag' => 'als_parag',
		'simple_char' => 'als_simple_char',
		'simple_num_char' => 'als_simple_num_char', 
		'submit_hidden' => 'alst_submit_hidden'
	);
	$filed_title = array(
		'style' => __('View style', 'aliaster_domain'),
		'search_disable' => __('Hide search form', 'aliaster_domain'), 
		'out_toggle' => __('View toggle switch', 'aliaster_domain'),
		'out_space' => __('Put a space on both sides of the alias', 'aliaster_domain'), 
		'simple_char' => __('Simple alias char', 'aliaster_domain'),
		'simple_parag' => __('Simple alias paragraph char', 'aliaster_domain'),
		'simple_num_char' => __('Simple number alias char', 'aliaster_domain')
	);


	if (array_key_exists($filed_name['submit_hidden'], $_POST) && $_POST[ $filed_name['submit_hidden'] ] == 'Y' ) {
		$tmp = str_replace('"', "'",  $_POST[ $filed_name['style'] ]);
		$dels = array('<', '>', '/', '\\');
		$opt_val['style'] = str_replace($dels, '',  $tmp);
		$opt_val['simple_char'] = htmlentities($_POST[ $filed_name['simple_char'] ], ENT_QUOTES, mb_internal_encoding());
		$opt_val['simple_num_char'] = htmlentities($_POST[ $filed_name['simple_num_char'] ], ENT_QUOTES, mb_internal_encoding());
		$opt_val['simple_parag'] = htmlentities($_POST[ $filed_name['simple_parag'] ], ENT_QUOTES, mb_internal_encoding());
		$opt_val['search_disable'] = empty($_POST[ $filed_name['search_disable'] ]) ? 0 : 1;
		$opt_val['out_toggle'] = empty($_POST[ $filed_name['out_toggle'] ]) ? 0 : 1;
		$opt_val['out_space'] = empty($_POST[ $filed_name['out_space'] ]) ? 0 : 1;

		// set dababase
		update_option( $opt_name, $opt_val );
		$update_rslt = __('Options saved.', 'aliaster_domain');
	}
	if ($opt_val['search_disable'] == 1) {
		$srearch_disable = 'checked="checked"';
	}
	if ($opt_val['out_space'] == 1) {
		$out_space = 'checked="checked"';
	}
	if ($opt_val['out_toggle'] == 1) {
		$toggle = 'checked="checked"';
	}

	$s_parag = '';
	if (array_key_exists('simple_parag', $opt_val)) {
		$s_parag = $opt_val['simple_parag'];
	}

$html = <<< EOF
	<script>
		function als_Onchange(e) {
			var ctrl = window.document.getElementById('alst_submit');
			ctrl.disabled = false;
			ctrl = window.document.getElementById('alst_rslt');
			ctrl.innerHTML = '';
		}
	</script>
	<div class="wrap">
		<h3>$opt_title</h3>
		<form name="form1" method="post" action="$act_url">
			<input type="hidden" name="{$filed_name['submit_hidden']}" value="Y">
			<p>{$filed_title['style']}
				: <input type="text" name="{$filed_name['style']}" value="{$opt_val['style']}" size="30" onchange="als_Onchange()"/>
			</p>
			<p>{$filed_title['simple_char']}
				: <input type="text" name="{$filed_name['simple_char']}" value="{$opt_val['simple_char']}" size="3" maxlength="1" onchange="als_Onchange()"/>
			</p>
			<p>{$filed_title['simple_num_char']}
				: <input type="text" name="{$filed_name['simple_num_char']}" value="{$opt_val['simple_num_char']}" size="3" maxlength="1" onchange="als_Onchange()"/>
			</p>
			<p>{$filed_title['simple_parag']}
				: <input type="text" name="{$filed_name['simple_parag']}" value="$s_parag" size="30" maxlength="16" onchange="als_Onchange()"/>
			</p>
			<p>{$filed_title['out_space']}
				: <input type="checkbox" name="{$filed_name['out_space']}" onchange="als_Onchange()" $out_space />
			</p>
			<p>{$filed_title['out_toggle']}
				: <input type="checkbox" name="{$filed_name['out_toggle']}" onchange="als_Onchange()" $toggle />
			</p>
			<p>{$filed_title['search_disable']}
				: <input type="checkbox" name="{$filed_name['search_disable']}" onchange="als_Onchange()" $srearch_disable />
			</p>
			<p class="submit">
				<input type="submit" id="alst_submit"  name="Submit" value="$submit_val" $submit_disable/>
			</p>
		</form>
	</div>
EOF;
	echo $html;
	if ($update_rslt != "") {
		echo '<div id="alst_rslt"><div class="updated"><p><strong>' . $update_rslt. '</strong></p></div></div>';
	}
}

add_action('admin_menu', 'aliaster_plugin_menu');
?>

// -*- coding: utf-8 -*-
var $mst_ship		= load_storage('mst_ship');
var $mst_slotitem	= load_storage('mst_slotitem');
var $mst_mission	= load_storage('mst_mission');
var $mst_useitem	= load_storage('mst_useitem');
var $mst_mapinfo	= load_storage('mst_mapinfo');
var $ship_list		= load_storage('ship_list');
var $slotitem_list	= load_storage('slotitem_list');
var $enemy_db		= load_storage('enemy_db');
var $enemy_list	= load_storage('enemy_list');
var $weekly			= load_storage('weekly');
var $logbook		= load_storage('logbook', []);
var $tmp_ship_id = -1000;	// ドロップ艦の仮ID.
var $tmp_slot_id = -1000;	// ドロップ艦装備の仮ID.
var $max_ship = 0;
var $max_slotitem = 0;
var $combined_flag = 0;
var $fdeck_list = {};
var $ship_fdeck = {};
var $escape_info = null;
var $ship_escape = {};	// 護衛退避したshipidのマップ.
var $mapinfo_rank = {};	// 海域難易度 undefined:なし, 1:丙, 2:乙, 3:甲.
var $next_mapinfo = null;
var $next_enemy = null;
var $is_boss = false;
var $material = {
	// [燃料,弾薬,鋼材,ボーキ, バーナー,バケツ,歯車,螺子]
	mission: [0,0,0,0, 0,0,0,0],	///< 遠征累計.
	quest  : [0,0,0,0, 0,0,0,0],	///< 任務累計.
	charge : [0,0,0,0, 0,0,0,0],	///< 補給累計.
	ndock  : [0,0,0,0, 0,0,0,0],	///< 入渠累計.
	dropitem    : [0,0,0,0, 0,0,0,0],	///< 道中資源累計.
	autosupply  : [0,0,0,0, 0,0,0,0],	///< 自然増加/轟沈回収累計.
	createship  : [0,0,0,0, 0,0,0,0],	///< 艦娘建造/改造累計.
	createitem  : [0,0,0,0, 0,0,0,0],	///< 装備開発累計.
	remodelslot : [0,0,0,0, 0,0,0,0],	///< 装備改修累計.
	destroyship : [0,0,0,0, 0,0,0,0],	///< 艦娘解体累計.
	destroyitem : [0,0,0,0, 0,0,0,0],	///< 装備破棄累計.
	now : [],	///< 現在資材. 初回は全項目undefinedとする.
	beg : null,	///< 初期資材. 初回更新時にnowのコピーを保持する.
	diff: ""	///< 変化量メッセージ.
};
var $material_sum = null;
var $quest_count = -1;
var $quest_exec_count = 0;
var $quest_list = {};
var $battle_count = 0;
var $ndock_list = {};
var $do_print_port_on_ndock = false;
var $do_print_port_on_slot_item = false;
var $kdock_list = {};
var $battle_deck_id = -1;
var $battle_info = '';
var $battle_log = [];
var $last_mission = {};
var $maxhps = null;
var $maxhps_c = null;
var $beginhps = null;
var $beginhps_c = null;
var $f_damage = 0;
var $guess_win_rank = '?';
var $guess_info_str = '';
var $guess_debug_log = false;
var $pcDateTime = null;
var $svDateTime = null;
var $newship_slots = null;
var $enemy_formation = '';
var $enemy_ship_names = [];

//-------------------------------------------------------------------------
// Ship クラス.
function Ship(data, ship) {
	this.p_cond	= (ship) ? ship.c_cond : 49;
	this.c_cond	= data.api_cond;
	this.maxhp	= data.api_maxhp;
	this.nowhp	= data.api_nowhp;
	this.slot	= data.api_slot;	// []装備ID.
	this.onslot	= data.api_onslot;	// []装備数.
	this.bull	= data.api_bull;	// 弾薬.
	this.fuel	= data.api_fuel;	// 燃料.
	this.id		= data.api_id;		// 背番号.
	this.lv		= data.api_lv;
	this.locked	= data.api_locked;
	this.ndock_time	= data.api_ndock_time;
	this.ndock_item	= data.api_ndock_item; // 入渠消費量[燃料,鋼材].
	this.ship_id	= data.api_ship_id;
	this.kyouka	= data.api_kyouka;	// 近代化改修による強化値[火力,雷装,対空,装甲,運].
	this.nextlv	= data.api_exp[1];
	if (data.api_slot_ex > 0) {		// api_slot_ex:: 0:増設スロットなし, -1:増設スロット空,　1以上:増設スロット装備ID.
		this.slot.push(data.api_slot_ex);
	}
	this.sortno	= data.api_sortno;
	this.slot_flg = 0;
}

Ship.prototype.name_lv = function(pt) {
	var name = ship_name(this.ship_id);
	if(pt) name += ' Lv'+ this.lv;
	return name;
};

Ship.prototype.fleet_name_lv = function(pt) {
		var name = pt ? this.name_lv(1) : '';
		var fdeck = $ship_fdeck[this.id];
		if (fdeck) { // 頭に艦隊番号を付ける.
		if(pt) name = ' '+ name;
			name = '<span class="label label-primary ts10">'+ fdeck +'</span>'+ name;
		}
		return name;
};

Ship.prototype.stype = function() {
	return $mst_ship[this.ship_id].api_stype;
};

Ship.prototype.getquantity = function(rc,sc,sm) {
	var ra = new Array();		ra[0] = '';		ra[1] = '';
	if(sm && sc < sm){
		var rb = percent_name(sc,sm);		var rd = rb.substring(1,2);
		if(rd == '%'){
			rd = '0';
		}else{
			rd = rb.substring(0,1);
		}
		ra[0] = rc[0] + rd + rc[1];		ra[1] = rc[0] + rb + rc[1];
	}
	return ra;
};

Ship.prototype.onslot_name = function() {
	var mx = $mst_ship[this.ship_id].api_maxeq;
	var rc = ['<span class="label label-warning">','</span>'];
	var sc = 0;		var sm = 0;		var si = null;	var mi = null;
	for(var i in this.slot){
		si = $slotitem_list[this.slot[i]];
		if(si){
			mi = $mst_slotitem[si.item_id];
			if(is_airplane(mi)){
				sc += this.onslot[i];		sm += mx[i];
			}
		}
	}
	return this.getquantity(rc,sc,sm);
};

Ship.prototype.fuel_name = function() {
	var max = $mst_ship[this.ship_id].api_fuel_max;
	var rc = ['<span class="label label-success">','</span>'];
	return this.getquantity(rc,this.fuel,max);
};
Ship.prototype.bull_name = function() {
	var max = $mst_ship[this.ship_id].api_bull_max;
	var rc = ['<span class="label ts9">','</span>'];
	return this.getquantity(rc,this.bull,max);
};

Ship.prototype.charge = function(data) { ///< 補給.
	var d_fuel  = data.api_fuel - this.fuel;
	var d_bull  = data.api_bull - this.bull;
	if (this.lv > 99) {	// ケッコンカッコカリ艦は消費量15%軽減.
		d_fuel = Math.floor(d_fuel * 0.85);
		d_bull = Math.floor(d_bull * 0.85);
	}
	this.fuel   = data.api_fuel;
	this.bull   = data.api_bull;
	this.onslot = data.api_onslot;
	$material.charge[0] -= d_fuel;
	$material.charge[1] -= d_bull;
};

Ship.prototype.highspeed_repair = function() { ///< 高速修復.
	this.nowhp = this.maxhp;
	this.ndock_time = 0;
	delete $ndock_list[this.id];
};

Ship.prototype.can_kaizou = function() {
	var afterlv = $mst_ship[this.ship_id].api_afterlv;
	return afterlv && afterlv <= this.lv;
};

Ship.prototype.max_kyouka = function() {
	var mst = $mst_ship[this.ship_id];
	return [
		mst.api_houg[1] - mst.api_houg[0],	// 火力.
		mst.api_raig[1] - mst.api_raig[0],	// 雷装.
		mst.api_tyku[1] - mst.api_tyku[0],	// 対空.
		mst.api_souk[1] - mst.api_souk[0]		// 装甲.
	];
};

Ship.prototype.begin_shipid = function() {
	var mst = $mst_ship[this.ship_id];
	return mst.yps_begin_shipid ? mst.yps_begin_shipid : this.ship_id;
};

Ship.prototype.slot_names = function() {
	var slot = this.slot;
	var onslot = this.onslot;
	var maxslot = $mst_ship[this.ship_id].api_maxeq;
	var a = ['','','','','',''];
	for (var i = 0; i < slot.length; ++i) {
		var value = $slotitem_list[slot[i]];
		if (value) {
			a[i] = slotitem_name(value.item_id, value.level, value.alv, value.p_alv, onslot[i], maxslot[i]);
		}
	}
	return a;
};

//------------------------------------------------------------------------
// データ保存と更新.
//
function sync_cloud() {
	chrome.storage.sync.get({weekly: $weekly}, function(a) {
		if ($weekly.savetime < a.weekly.savetime) $weekly = a.weekly;
	});
}

function load_storage(name, def) {
	if (!def) def = {};
	var v = localStorage[name];
	return v ? JSON.parse(v) : def;
}

function save_storage(name, v) {
	localStorage[name] = JSON.stringify(v);
}

function update_ship_list(list, is_delta) {
	if (!list) return;
	// update ship_list
	var prev_ship_list = $ship_list;
	if (!is_delta) $ship_list = {};
	list.forEach(function(data) {
		var prev = prev_ship_list[data.api_id];
		var ship = new Ship(data, prev);
		$ship_list[data.api_id] = ship;
		if ($newship_slots && !prev) {
			// ship2廃止によりドロップ艦の装備数が母港帰還まで反映できなくなったので、母港帰還時に新規入手艦の装備数を記録保存し、
			// ドロップ時に装備数分のダミー装備IDを用意する. 初入手艦など未記録の艦は装備数0となるので、装備数が少なく表示される場合がある.
			if (ship.id < 0) {	// on_battle_result で仮登録するドロップ艦の場合.
				for (var slots = $newship_slots[ship.ship_id]; slots; --slots) { // 装備数未登録なら何もしない(装備数合計が少なく表示される)
					$slotitem_list[$tmp_slot_id] = null; // 個数を合せるためnullのダミーエントリを追加する. 母港帰還時 /api_get_member/slot_item にリストが全更新される.
					ship.slot.push($tmp_slot_id--); // 初期装備数分のダミー装備IDを載せる. 母港帰還(portパケット)により正しい値に上書きされる.
				}
			}
			else if (ship.lv == 1) {	// 海域ドロップ、報酬、建造などにより新規入手したLv1艦の場合.
				$newship_slots[ship.ship_id] = count_unless(ship.slot, -1); // 初期装備数を記録する.
			}
		}
	});
	if (!$newship_slots) {
		// ゲーム開始直後の保有艦リスト更新では、別環境で入手済みの既存Lv1艦(装備変更の可能性あり)も新規入手扱いになるので都合が悪い.
		// よって $newship_slots のロードをここで行い、開始直後の装備数記録をスキップする.
		$newship_slots = load_storage('newship_slots');	// この環境で保存した新規艦の初期装備数をロードする.
		for (var i in $init_newship_slots) {			// 既知艦の初期装備個数を上書きする.
			var n = $init_newship_slots[i];
			if (n != null)
				$newship_slots[i] = n;
		}
	}
	save_storage('ship_list', $ship_list);
	save_storage('newship_slots', $newship_slots);
}

function delta_update_ship_list(list) {
	update_ship_list(list, true);
}

function update_fdeck_list(list, is_delta) {
	if (!list) return;
	if (!is_delta) {
		$fdeck_list = {};
		$ship_fdeck = {};
	}
	for (var idx in list) {	// list が Array でも Object($fdeck_list自身) でも扱えるようにする.
		var deck = list[idx];
		$fdeck_list[deck.api_id] = deck;
		for (var i in deck.api_ship) {
			var ship_id = deck.api_ship[i];
			if (ship_id != -1) $ship_fdeck[ship_id] = deck.api_id;
		}
	}
}

function delta_update_fdeck_list(list) {
	update_fdeck_list(list, true);
}

function update_ndock_complete() {
	// $ndock_list のクリア前に現在のリストで入渠完了した艦がないかチェックする
	for (var id in $ndock_list) {
		var d = $ndock_list[id];
		var ship = $ship_list[id];
		if (d.api_complete_time < $svDateTime.getTime() + 60000) {
			//alert(d.api_complete_time_str);
			ship.highspeed_repair();
			$do_print_port_on_ndock = true;
		}
	}
}

function update_ndock_list(list) {
	if (!list) return;
	$ndock_list = {};
	list.forEach(function(data) {
		var ship_id = data.api_ship_id;
		if (ship_id) $ndock_list[ship_id] = data;
	});
}

function update_kdock_list(list) {
	if (!list) return;
	$kdock_list = {};
	list.forEach(function(data) {
		// state: -1:未開放, 0:空き, 1:不明, 2:建造中, 3:完成.
		if (data.api_state >= 2) $kdock_list[data.api_id] = data;
	});
}

function update_mst_ship(list) {
	if (!list) return;
	$mst_ship = {};
	var before = {};
	list.forEach(function(data) {
		$mst_ship[data.api_id] = data;
		if (data.api_aftershipid && before[data.api_aftershipid] == null)
			before[data.api_aftershipid] = data.api_id;
	});
	for (var id in $mst_ship) {
		var b = before[id];
		if (b) {
			$mst_ship[id].yps_before_shipid = b; // 改装前の艦種ID.
			do {
				$mst_ship[id].yps_begin_shipid = b; // 未改装の艦種ID.
			} while (b = before[b]);
		}
	}
	save_storage('mst_ship', $mst_ship);
}

function update_mst_slotitem(list) {
	if (!list) return;
	$mst_slotitem = {};
	list.forEach(function(data) {
		$mst_slotitem[data.api_id] = data;
	});
	save_storage('mst_slotitem', $mst_slotitem);
}

function update_mst_mission(list) {
	if (!list) return;
	$mst_mission = {};
	list.forEach(function(data) {
		$mst_mission[data.api_id] = data;
	});
	save_storage('mst_mission', $mst_mission);
}

function update_mst_useitem(list) {
	if (!list) return;
	$mst_useitem = {};
	list.forEach(function(data) {
		$mst_useitem[data.api_id] = data;
	});
	save_storage('mst_useitem', $mst_useitem);
}

function update_mst_mapinfo(list) {
	if (!list) return;
	$mst_mapinfo = {};
	list.forEach(function(data) {
		$mst_mapinfo[data.api_id] = data;
	});
	save_storage('mst_mapinfo', $mst_mapinfo);
}

function get_weekly() {
	var wn = Date.now() - Date.UTC(2013, 4-1, 22, 5-9, 0); // 2013-4-22 05:00 JST からの経過ミリ秒数.
	wn = Math.floor(wn / (7*24*60*60*1000)); // 経過週数に変換する.
	if ($weekly == null || $weekly.week != wn) {
		$weekly = {
			quest_state : 0, // あ号任務状況(1:未遂行, 2:遂行中, 3:達成)
			sortie    : 0,
			boss_cell : 0,
			win_boss  : 0,
			win_S     : 0,
			monday_material : null,
			week      : wn,
			savetime : 0
		};
	}
	if ($weekly.monday_material == null) {
		$weekly.monday_material = $material.now.concat(); save_weekly();
	}
	return $weekly;
}

function save_weekly() {
	$weekly.savetime = Date.now();
	chrome.storage.sync.set({weekly: $weekly});
	save_storage('weekly', $weekly);
}

function push_to_logbook(log) {
	if ($logbook.push(log) > 50) $logbook.shift(); // 50を超えたら古いものから削除する.
	save_storage('logbook', $logbook);
}

//------------------------------------------------------------------------
// 表示文字列化.
//
function fraction_name(num, denom) {
	if (num >= denom)
		return '達成';
	else
		return num + '/' + denom;
}

function weekly_name() {
	var w = get_weekly();
	var a = [(w.sortie / 36),(w.win_boss / 12),(w.boss_cell / 24),(w.win_S / 6)];		var ac = 0;
	for(var i in a){
		if(a[i] > 1) a[i] = 1;
		ac += a[i];
	}
	ac = Math.floor(ac / 4 * 100);
	return ' 【出撃数： '+ fraction_name(w.sortie, 36)
		+'，ボス勝利： '+ fraction_name(w.win_boss, 12)
		+'，<br /><span class="bw40"></span>『 '+ ac +'% 』'
		+'<span class="bw10"></span>ボス到達： '+ fraction_name(w.boss_cell, 24)
		+'，S勝利： '+ fraction_name(w.win_S, 6)
		+' 】';
}

function diff_name(now, prev) {		// now:1, prev:2 -> "(-1)"
	var diff = now - prev;	// 演算項目のどちらかがundefinedなら減算結果はNaNとなる. 項目がnullならば0として減算する.
	if (prev == null) return '';	// nullかundefinedなら増減なしと見做して空文字列を返す.
	else if (diff > 0) return '+'+ diff; // with plus sign
	else if (diff < 0) return ''+ diff; // with minus sign
	else /* diff == 0 */ return '';
}

function percent_name(now, max, decimal_digits) {	// now:1, max:2 -> "50%"
	if (!max) return '';
	var pow10 = decimal_digits ? Math.pow(10, decimal_digits) : 1;
	return Math.floor(100 * pow10 * now / max) / pow10 + '%';
}

function percent_name_unless100(now, max, decimal_digits) {	// now:1, max:2 -> "(50%)"
	if (!max || now == max) return '';
	return '(' + percent_name(now, max, decimal_digits) + ')';
}

function fraction_percent_name(now, max) {	// now:1, max:2 -> "1/2(50%)"
	if (!max) return '';	// 0除算回避.
	var d = (100 * now / max < 1) ? 1 : 0; // 1%未満なら小数部2桁目を切り捨て、1%以上なら小数部切り捨て.
	return now + '/' + max + '(' + percent_name(now, max, d) + ')';
}

function kira_name(cond) {
	if(cond > 84){
		return '<span class="cr5">'+ cond +'</span>'; // 三重キラ
	}else if(cond > 52){
		return '<span class="cr4">'+ cond +'</span>'; // 回避向上キラ
	}else if(cond > 49){
		return '<span class="cr13">'+ cond +'</span>'; // キラ
	}else if(cond == 49){
		return '<span>'+ cond +'</span>'; // normal
	}else if(cond < 20){
		return '<span class="cr8">'+ cond +'</span>'; // 赤疲労
	}else if(cond < 33){
		return '<span class="cr7">'+ cond +'</span>'; // 橙疲労
	}else{
		return ''+ cond; // recovering 疲労
	}
}

function material_name(id) {
	switch (parseInt(id, 10)) {
		case 1: return '燃料';
		case 2: return '弾薬';
		case 3: return '鋼材';
		case 4: return 'ボーキ';
		case 5: return '高速建造材';	// バーナー.
		case 6: return '高速修復材';	// バケツ.
		case 7: return '開発資材';	// 歯車.
		case 8: return '改修資材';	// ネジ.
		case 10: return '家具箱小';
		case 11: return '家具箱中';
		case 12: return '家具箱大';
		default: return 'id(' + id + ')';
	}
}

function formation_name(id) {
	switch (parseInt(id, 10)) {	// 連合艦隊戦闘では id が数値ではなく文字列になっている.
		case 1: return '単縦';
		case 2: return '複縦';
		case 3: return '輪形';
		case 4: return '梯形';
		case 5: return '単横';
		case 11: return '連合対潜警戒';
		case 12: return '連合前方警戒';
		case 13: return '連合輪形陣';
		case 14: return '連合戦闘隊形';
		default: return id.toString();
	}
}

function match_name(id) {
	switch (id) {
		case 1: return '同航';
		case 2: return '反航';
		case 3: return 'Ｔ字有利';
		case 4: return 'Ｔ字不利';
		default: return id.toString();
	}
}

function support_name(id) {	///@param id	支援タイプ api_support_flag
	switch (id) {
		case 1: return '航空支援';
		case 2: return '支援射撃';
		case 3: return '支援長距離雷撃';
		default: return id.toString();
	}
}

function seiku_name(id) {	///@param id	制空権 api_disp_seiku
	switch (id) {
		case 1: return '制空権確保';
		case 2: return '航空優勢';
		case 0: return '航空互角';
		case 3: return '航空劣勢';
		case 4: return '制空権喪失';
		default: return id.toString();
	}
}

function search_name(id) {	///@param id	索敵結果 api_search[]
	switch (id) {
		case 1: return '敵艦隊発見!';
		case 2: return '敵艦隊発見!索敵機未帰還機あり';
		case 3: return '敵艦隊発見できず…索敵機未帰還機あり';
		case 4: return '敵艦隊発見できず…';
		case 5: return '敵艦隊発見!(索敵機なし)';
		case 6: return 'なし';
		default: return id.toString();
	}
}

function mission_clear_name(cr) {	///@param c	遠征クリア api_clear_result
	switch (cr) {
		case 1: return '成功';
		case 2: return '大成功';
		default: return '失敗';
	}
}

function slotitem_name(id, lv, alv, p_alv, n, max) {
	var item = $mst_slotitem[id];
	if (!item) return id.toString();	// unknown slotitem.
	var name = item.api_name;		var sta = '<i class="icon-star mr0 ml2"></i>';
	if (lv >= 10) name += sta +'max';	// 改修レベルを追加する.
	else if (lv >= 1) name += sta +'+'+ lv;	// 改修レベルを追加する.
	if (alv >= 1 || alv < p_alv) {
		var gmk = '<i class="icon-plane mr0 ml2"></i>';
		if (alv >= 7) name += gmk +'max';	// 熟練度最大ならmaxを追加する.
		else if (alv >= 1) name += gmk +'+'+ alv;		// さもなくば熟練度数値を追加する.
		var diff = diff_name(alv, p_alv);
		if (diff.length > 0) name += ' <span class="cr6">'+ diff +'</span>';	// 熟練度変化量を追加する.
	}
	if (is_airplane(item) && n != null) name  = (n == 0 && n < max) ? '【<span class="cr6">0 全滅</span> 】 '+ name : '【'+ n +' <span class="cr14">'+ percent_name_unless100(n, max) +'</span>】 '+ name;	// 航空機なら、機数と搭載割合を追加する.
	return name;
}

function slotitem_names(idlist) {
	var rt = [0,''];
	if (!idlist) return rt;
	var names = [];
	for (var i in idlist) {
		var id = idlist[i];
		if (id > 0) {
			names.push(slotitem_name(id));	rt[0]++;
		}
	}
	if(rt[0] > 0) rt[1] = names.join('，');
	return rt;
}

function ship_name(id) {
	var ship = $mst_ship[id];
	if (ship) {
		id = ship.api_name;
		if (ship.api_sortno == null && ship.api_yomi.length > 1) {
			id += ship.api_yomi; // 'elite', 'flag ship' ...
		}
	}
	return id.toString();
}

function shiplist_names(list) {	// Shipの配列をlv降順に並べて、","区切りの艦名Lv文字列化する.
	list.sort(function(a, b) { return (b.lv == a.lv) ? a.id - b.id : b.lv - a.lv; }); // lv降順、同一lvならid昇順(古い順)でソートする.
	var names = [];
	var last = null;
	for (var i in list) {
		if (!last || last.ship != list[i]) names.push(last = {count:0, ship:list[i]});
		last.count++;
	}
	for (var i in names) {
		var e = names[i];
		var name = e.ship.fleet_name_lv(1);	// "(艦隊N)艦名LvN"
		if (e.count > 1) name += ' x'+ e.count;	// 同一艦は x N で束ねる.
		names[i] = name;
	}
	return names.join('，<wbr>');
}

function damage_name(nowhp, maxhp, pt) {
	var r = nowhp / maxhp;
	var rt = ''; // 無傷.
	if(r <= 0){
		rt = '<span class="label label-primary">撃沈</span>';
	}else if(r <= 0.25){
		rt = '<span class="label label-danger">大破</span>';
	}else if(r <= 0.50){
		rt = '<span class="label label-warning">中破</span>';
		if(pt) rt = '<span class="label label-warning">中破</span>';
	}else if(r <= 0.75){
		rt = '<span class="label label ts9">小破</span>';
		if(pt) rt = '<span class="label ts9">小破</span>';
	}else if(r <= 0.85){
		rt = '<span class="label label-default"><i class="icon-wrench mr0"></i></span>'; // 軽微2.
	}else if(r <  1.00){
		rt = '<span class="label label-default ts10"><i class="icon-wrench mr0"></i></span>'; // 軽微1.
	}
	return rt;
}

function battle_type_name(a) {
	switch (a) {
	case 0: return '砲撃戦';
	case 1: return 'レーザー';
	case 2: return '連撃';
	case 3: return '主副カットイン';
	case 4: return '主電カットイン';
	case 5: return '主徹カットイン';
	case 6: return '主主カットイン';
	default: return a; // 不明.
	}
}

function battle_sp_name(a) {
	switch (a) {
	case 0: return '砲撃戦';
	case 1: return '連撃';
	case 2: return '主魚カットイン';
	case 3: return '魚魚カットイン';
	case 4: return '主副カットイン';
	case 5: return '主主カットイン';
	default: return a; // 不明.
	}
}

function battle_cl_name(a) {
	switch (a) {
	case 0: return 'miss';
	case 1: return 'hit';
	case 2: return 'critical';
	default: return a; // 不明.
	}
}

//------------------------------------------------------------------------
// データ解析.
//
function decode_postdata_params(params) {
	var r = {};
	if (params instanceof Array) params.forEach(function(data) {
		if (data.name && data.value) {
			var name  = decodeURI(data.name);
			var value = decodeURI(data.value);
			r[name] = (value == "" || isNaN(value)) ? value : +value;  // 数値文字列ならばNumberに変換して格納する. さもなくばstringのまま格納する.
		}
	});
	return r;
}

function request_date_time() {
	var s = [dpnla.daytimchg(2,$pcDateTime),'〃'];
	if ($pcDateTime != $svDateTime) {
		s[1] = dpnla.daytimchg(2,$svDateTime);
	}
	return s;
}

function count_if(a, value) {
	if (a instanceof Array)
		return a.reduce(function(count, x) { return count + (x == value); }, 0);
	else
		return (a == value) ? 1 : 0;
}

function count_unless(a, value) {
	if (a instanceof Array)
		return a.reduce(function(count, x) { return count + (x != value); }, 0);
	else
		return (a != value) ? 1 : 0;
}

function add_slotitem_list(data, prev) {
	if (!data) return;
	if (data instanceof Array) {
		data.forEach(function(e) {
			add_slotitem_list(e, prev);
		});
	}
	else if (data.api_slotitem_id) {
		var item = { item_id: data.api_slotitem_id, locked: data.api_locked, level: data.api_level };
		var alv = data.api_alv;		var id = data.api_id;
		if (isNaN(alv)) alv = 0;
		var p_item = prev ? prev[id] : $slotitem_list[id];
		var p_alv = p_item ? p_item.alv : alv;
		if (isNaN(p_alv)) p_alv = 0;
		if (alv > 0 || p_alv > 0) {
			item.p_alv = p_alv;		item.alv = alv;
		}
		$slotitem_list[id] = item;
	}
}

function slotitem_count(slot, item_id) {
	if (!slot) return 0;
	var count = 0;
	for (var i = 0; i < slot.length; ++i) {
		var value = $slotitem_list[slot[i]];
		if (value && count_if(item_id, value.item_id)) ++count;
	}
	return count;
}

function slotitem_use(slot, item_id) {
	if (!slot) return 0;
	for (var i = 0; i < slot.length; ++i) {
		var value = $slotitem_list[slot[i]];
		if (value && count_if(item_id, value.item_id)) {
			slot[i] = -1; return value.item_id;
		}
	}
	return 0;
}

function slotitem_delete(slot) {
	if (!slot) return;
	slot.forEach(function(id) {
		delete $slotitem_list[id];
	});
}

function ship_delete(list) {
	if (!list) return;
	list.forEach(function(id) {
		var ship = $ship_list[id];
		if (ship) {
			slotitem_delete(ship.slot);
			delete $ship_list[id];
		}
	});
}

function is_airplane(item) {
	if (!item) return false;
	switch (item.api_type[2]) {
	case 6:	// 艦上戦闘機.
	case 7:	// 艦上爆撃機.
	case 8:	// 艦上攻撃機.
	case 9:	// 艦上偵察機.
	case 10:// 水上偵察機.
	case 11:// 水上爆撃機.
	case 25:// オートジャイロ.
	case 26:// 対潜哨戒機.
	case 41:// 大型飛行艇.
	case 45:// 水上戦闘機.
		return true;
	default:
		return false;
	}
}

function push_fleet_status(tp, deck) {
	var lv_sum = 0;
	var fleet_ships = 0;
	var drumcan = {ships:0, sum:0, msg:''};
	var j = 0;	var ra = new Array();		var rt = ['','','',0];	var rb = new Array();		var tb = '';
	for(j = 0;j < 20;j++){
		ra[j] = '';
	}
	for (var i = 0, ship, s_id; ship = $ship_list[s_id = deck.api_ship[i]]; ++i) {
		fleet_ships++;
		lv_sum += ship.lv;
		ra[6] = '';
		ra[17] = '';
		if (ship.nowhp < ship.maxhp) {
			ra[6] = damage_name(ship.nowhp, ship.maxhp); // ダメージ.
			ra[17] = dpnla.strtimchg(ship.ndock_time); // 修理所要時間.
		}
		if ($ship_escape[s_id]) {
			ra[6] = tp[2][7];
		}
		var ndock = $ndock_list[s_id];
		if (ndock) {
			var c_date = new Date(ndock.api_complete_time);
			ra[6] = tp[2][6];		ra[17] = '【'+ ndock.api_id +' 】 '+ dpnla.daytimchg(1,c_date);
		}
		if (/大破/.test(ra[6])) rt[3] = 1;
		ra[0] = kira_name(ship.c_cond);		ra[1] = ship.name_lv();		ra[2] = ship.lv;
		ra[3] = ship.nextlv;	ra[4] = ship.nowhp;		ra[5] = ship.maxhp;
		rb = ship.fuel_name();	ra[7] = rb[0];	ra[10] = rb[1];
		rb = ship.bull_name();	ra[8] = rb[0];	ra[11] = rb[1];
		rb = ship.onslot_name();	ra[9] = rb[0];	ra[12] = rb[1];
		rb = ship.slot_names();		ra[13] = rb[0];		ra[14] = rb[1];		ra[15] = rb[2];		ra[16] = rb[3];
		ra[18] = diff_name(ship.c_cond, ship.p_cond);		ra[19] = rb[5];		tb = tp[1][1];
		if(rb[5] != '') tb = tp[1][2];
		rt[0] += dpnla.tmprep(2,ra,tp[0][1]);		rt[1] += dpnla.tmprep(2,ra,tb);
		var d = slotitem_count(ship.slot, 75);	// ドラム缶.
		if (d) {
			drumcan.ships++;
			drumcan.sum += d;
		}
	}
	if (drumcan.sum) {
		drumcan.msg = 'ドラム缶x' + drumcan.sum + '個 (' + drumcan.ships + '隻) ';
	}
	rt[2] = drumcan.msg +'合計 Lv'+ lv_sum +' ('+ fleet_ships +'隻)';
	return rt;
}

function update_material(material, sum) {
	// material: [燃料,弾薬,鋼材,ボーキ, バーナー,バケツ,歯車,螺子] or [{api_id: ID, api_value: 値}, ...]
	// ID: 1:燃料, 2:弾薬, 3:鋼材, 4:ボーキ, 5:バーナー, 6:バケツ, 7:歯車, 8:螺子.
	var msg = [];
	for (var i = 0; i < material.length; ++i) {
		var id = i + 1;
		var value = material[i];	// number or Object
		if (value.api_id) {
			id = value.api_id;
			value = value.api_value;
		}
		var now = $material.now[id-1];	// 初回はundefined.
		var diff = diff_name(value, now);
		if (diff.length) {
			msg.push(material_name(id) +' '+ diff);
			if (sum) sum[id-1] += value - now;
		}
		$material.now[id-1] = value;
	}
	if (msg.length) {
		dpnla.matupdsave();		$material.diff = msg.join(' ，');
	}
	if ($material.beg == null) {
		dpnla.matupdsave();		$material.beg = $material.now.concat(); // 初回更新時にnowのコピーを保持する.
	}
	get_weekly();	// 週初めにnowのコピーを保持する.
}

function diff_update_material(diff_material, sum) {
	// diff_material: [燃料増分,弾薬増分,鋼材増分,ボーキ増分].
	var m = diff_material.concat(); // 複製を作る.
	for (var i = 0; i < m.length; ++i) { m[i] += $material.now[i]; } // 増分値を絶対値に変換する.
	update_material(m, sum);
}

//------------------------------------------------------------------------
// 母港画面表示.
//
function print_port() {
	var mb = ['','','','','','','',''];		var mc = ['','','','',''];	var rlv = 0;	var alv = 0;
	var unlock_names = [];
	var lock_condlist = [];
	var lock_kyoukalist = [];
	var lock_beginlist = {};
	var lock_repairlist = [];
	var unowned_names = [];
	var owned_ship_idset = {};
	var cond85 = 0;
	var cond53 = 0;
	var cond50 = 0;
	var unlock_lv10 = 0;
	var damage_H = 0;
	var damage_M = 0;
	var damage_L = 0;
	var damage_N = 0;
	var kaizou_list = [];
	var lockeditem_list = {};
	var lockeditem_count = 0;
	var  unlock_slotitem = 0;
	var  levelmax_slotitem = 0;
	var  leveling_slotitem = 0;
	var drumcan_cond85 = [];
	var drumcan_cond53 = [];
	var drumcan_cond50 = [];
	var drumcan_condxx = [];
	var i = 0;	var j = 0;	var ra = new Array();		var rb = new Array();		var rc = new Array();
	var tp = new Array();		var tb = new Array();		var tc = new Array();		var td = new Array();
	var ky = '';	var ht = '';	var ca = 0;		var cb = 0;		var cc = 0;		var cd = 0;
	var airplane_list = {};		var itm = null;
	//
	// ロック装備を種類毎に集計する.
	for (var id in $slotitem_list) {
		var value = $slotitem_list[id];
		if (value) {
			var i = value.item_id;
			var lv = 10 - value.level;	var lc = 1;		rlv = lv;		alv = 16;
			if (value.alv >= 1) alv = 16 - value.alv;
			lv += alv * 16; // levelは1～10なので16の下駄を履く.
			if(i != -1){
				if(value.locked){
					lc = 0;		lockeditem_count++;
				}
				if (!lockeditem_list[i]) lockeditem_list[i] = [];
				if (!lockeditem_list[i][lc]) lockeditem_list[i][lc] = [];
				if (!lockeditem_list[i][lc][lv]) lockeditem_list[i][lc][lv] = { count:0, shiplist:[] };
				lockeditem_list[i][lc][lv].count++;
				if(rlv < 1){
					levelmax_slotitem++;
				}else if(rlv < 10){
					leveling_slotitem++;
				}
				itm = $mst_slotitem[i];
				if(is_airplane(itm)){
					if(!airplane_list[i]) airplane_list[i] = [];
					if(!airplane_list[i][lc]) airplane_list[i][lc] = [];
					if(!airplane_list[i][lc][alv]){
						airplane_list[i][lc][alv] = [];		airplane_list[i][lc][alv][0] = 0;
					}
					if(value.alv == value.p_alv){
						airplane_list[i][lc][alv][0]++;
					}else{
						airplane_list[i][lc][alv].push(value.p_alv);
					}
				}
			}
		}
	}
	//
	// ロック艦のcond別一覧、未ロック艦一覧、ロック装備持ち艦を検出する.
	for (var id in $ship_list) {
		var ship = $ship_list[id];
		owned_ship_idset[ship.begin_shipid()] = true;
		lock_condlist.push(ship);
		if (!ship.locked) {
			var n = count_unless(ship.slot, -1); // スロット装備数.
			unlock_slotitem += n;

			ship.slot_flg = n;      // 装備持ちなら、判定用.
			if (ship.lv >= 10) { // Lv10以上なら、名前を強調表示し、警告カウントを上げる.
				unlock_lv10++;

			}
			unlock_names.push(ship);
		}
		else {	// locked
			var cond = ship.c_cond;
			if      (cond >= 85) cond85++; // 三重キラ.
			else if (cond >= 53) cond53++; // 回避向上キラ.
			else if (cond >  49) cond50++; // キラ.
			var max_k = ship.max_kyouka();
			var flg_k = 0;
			for (var i in max_k) {

				if (max_k[i] > ship.kyouka[i]) flg_k = 1;
			}
			if(flg_k > 0) lock_kyoukalist.push(ship);
			if (!$ndock_list[id] && ship.nowhp < ship.maxhp) {
				var r = ship.nowhp / ship.maxhp;
				if      (r <= 0.25) damage_H++; // 大破.
				else if (r <= 0.50) damage_M++; // 中破.
				else if (r <= 0.75) damage_L++; // 小破.
				else                damage_N++; // 軽微.
				lock_repairlist.push(ship);
			}
			if (!$ndock_list[id] && !$ship_fdeck[id] && slotitem_count(ship.slot, 75) > 0) { // ドラム缶装備の待機艦を選別する.
				if     (cond >= 85) drumcan_cond85.push(ship);
				else if (cond >= 53) drumcan_cond53.push(ship);
				else if (cond > 49) drumcan_cond50.push(ship);
				else               drumcan_condxx.push(ship);
			}
			var b = ship.begin_shipid();
			if (!lock_beginlist[b]) lock_beginlist[b] = [];
			lock_beginlist[b].push(ship);
		}
		if (ship.slot) {
			ship.slot.forEach(function(id) {
				var value = $slotitem_list[id];
				if (value && value.locked) {
					var lv = 10 - value.level;	alv = 0;
					if (value.alv >= 1) alv = value.alv;
					lv += (16 - alv) * 16; // levelは1～10なので16の下駄を履く.
					lockeditem_list[value.item_id][0][lv].shiplist.push(ship);
				}
			});
		}
		if (ship.can_kaizou()) kaizou_list.push(ship);
	}
	var lcdoublst = new Array();
	var double_count = 0;
	for (var id in lock_beginlist) {
		var a = lock_beginlist[id];
		if (a.length > 1) { // ダブリ艦数を集計する.
			double_count += a.length - 1;		lcdoublst.push({ s:a[0], list:a });
		}
	}
	for (var id in $mst_ship) {
		var mst = $mst_ship[id];
		if (mst.yps_begin_shipid) continue; // 改造型を除外する.
		if (!mst.api_afterlv) continue; // 改造不能型（季節艦、深海棲艦）を除外する.
		if (!owned_ship_idset[id]) unowned_names.push(ship_name(id)); // 未所有艦名をリストに加える.
	}
	//
	// 資材変化を表示する.
	mb[3] = $max_ship;	mb[5] = $max_slotitem;
	tb = ['現在値','週間収支','今回収支','任　務','遠　征','道　中','解　体','廃　棄','自然 轟沈','補　給','入　渠','建造 改造','開　発','改　修'];
	tc = ['&nbsp;','燃　料','弾　薬','鋼　材','ボーキ','高速建造','高速修復','開発資材','改修資材'];
	td = dpnla.tmpget('tp0_4');		tp = dpnla.tmpget('tp1_5');
	mc[0] = tp[0] + dpnla.tmprep(0,'資材増減数 ： '+ $material.diff,td[0]);
	var weekly = get_weekly();	mc[0] += dpnla.tmprep(2,tc,tp[1]);	var ia = 0;
	for(i = 0;i < 14;i++){
		ra = new Array();
		switch(i){
			case 1:
				for(j = 0;j < 8;j++){
					ra[j] = $material.now[j] - weekly.monday_material[j];
				}
				break;
			case 2:
				for(j = 0;j < 8;j++){
					ra[j] = $material.now[j] - $material.beg[j];
				}
				break;
			default:
				ia = i - 1;
				if(i == 0) ia = 0;
				ra = dpnla.getmatupdary(ia);
				break;
		}
		ra[8] = tb[i];	ra[9] = '';
		if(i == 1 || i == 2 || i == 3 || i == 9) ra[9] = ' ts31';
		mc[0] += dpnla.tmprep(2,ra,tp[2]);
	}
	mc[0] += tp[3];		dpnla.tmpviw(0,'t11_2',mc[0]);
	//
	// 艦娘保有数、未ロック艦一覧、未保有艦一覧、ダブリ艦一覧を表示する.
	var ships = Object.keys($ship_list).length;
	var space = $max_ship - ships;
	if (space <= 0) {
		mb[0] = ' cr6';		mc[1] += '艦娘保有数が満杯です。 '; // 警告表示.
	} else if (space < 5) {
		mb[0] = ' cr6';		mc[1] += '艦娘保有数の上限まで残り 【'+ space +' 】 '; // 警告表示.
	}
	if (unlock_lv10) mc[1] += 'Lv10以上の未ロック艦があります。 '; // 警告表示.
	mb[2] = ships;	mb[6] = unlock_names.length;	mb[7] = unlock_slotitem;
	// 全艦一覧
	tb = dpnla.tmpget('tp3_6');		tp = dpnla.tmpget('tp3_1');
	if (lock_condlist.length > 0) {
		lock_condlist.sort(function(a,b){
			var rt = b.stype() - a.stype();
			if(!rt) rt = a.sortno - b.sortno;
			if(!rt) rt = b.lv - a.lv;
			if(!rt) rt = a.id - b.id;
			return rt;
		});
		ky = 't32';		ca = 0;		cb = 1;		cc = 3;		cd = 1;
		ht = '<div id="'+ ky +'_1">';		ra = new Array();
		for (var i in lock_condlist) {
			var ship = lock_condlist[i];
			ra[0] = ship.fleet_name_lv();		ra[1] = kira_name(ship.c_cond);
			ra[2] = ship.name_lv();		ra[3] = ship.lv;
			ra[4] = ship.nextlv;	ra[5] = '';		ra[6] = '';
			if(ship.locked){
				mc[2] += ra[3] +'\t'+ ra[2] +'\n';
			}else{
				ra[5] = tb[1];
			}
			if(ship.nowhp < ship.maxhp){ // ダメージ.
				ra[6] = tb[2];
				var ndock = $ndock_list[ship.id];
				if (ndock) ra[6] = tb[5];
			}
			if(ca == 0){
				if(cb > cc){
					cb = 1;		cd++;
				}
				if(cb == 1 && cd > 1) ht += '</div><div id="'+ ky +'_'+ cd +'" class="hid">';
				ht += tp[0];
			}
			ht += dpnla.tmprep(2,ra,tp[1]);		ca++;
			if(ca > 9){
				ca = 0;		cb++;		ht += tp[2];
			}
		}
		if(ca > 0) ht += tp[2];
		ht += '</div>';
		dpnla.tmpviw(0,'t31_1_a',ht);
		dpnla.tmpviw(0,'t31_1',dpnla.tmpagemk(ky,cd));
		dpnla.tabinit(1,ky);	dpnla.tabdef(ky);
		dpnla.ge('c56').value = mc[2];
	}else{
		dpnla.tmpviw(0,'t31_1_a','');		dpnla.tmpviw(0,'t31_1','');
	}
	// 未ロック艦一覧
	if (unlock_names.length > 0) {
		unlock_names.sort(function(a,b){
			var rt = a.lv - b.lv;
			if(!rt) rt = b.sortno - a.sortno;
			if(!rt) rt = b.id - a.id;
			return rt;
		});
		tp = dpnla.tmpget('tp3_2');
		ky = 't33';		ca = 0;		cb = 1;		cc = 3;		cd = 1;
		ht = '<div id="'+ ky +'_1">';		ra = new Array();
		for (var i in unlock_names) {
			var ship = unlock_names[i];
			ra[0] = ship.fleet_name_lv();		ra[1] = kira_name(ship.c_cond);
			ra[2] = ship.name_lv();		ra[3] = ship.lv;
			ra[4] = ship.nextlv;	ra[5] = '';		ra[6] = '';		ra[7] = '';
			if(ship.nowhp < ship.maxhp){ // ダメージ.
				ra[6] = tb[2];
				var ndock = $ndock_list[ship.id];
				if (ndock) ra[6] = tb[5];
			}
			if(ship.slot_flg > 0) ra[7] = tb[3];
			if(ca == 0){
				if(cb > cc){
					cb = 1;		cd++;
				}
				if(cb == 1 && cd > 1) ht += '</div><div id="'+ ky +'_'+ cd +'" class="hid">';
				ht += tp[0];
			}
			ht += dpnla.tmprep(2,ra,tp[1]);		ca++;
			if(ca > 9){
				ca = 0;		cb++;		ht += tp[2];
			}
		}
		if(ca > 0) ht += tp[2];
		ht += '</div>';
		dpnla.tmpviw(0,'t31_2_a',ht);
		dpnla.tmpviw(0,'t31_2',dpnla.tmpagemk(ky,cd));
		dpnla.tabinit(1,ky);	dpnla.tabdef(ky);
	}else{
		dpnla.tmpviw(0,'t31_2_a','');		dpnla.tmpviw(0,'t31_2','');
	}
	// 未保有艦一覧
	var unowned_count = unowned_names.length;
	if (unowned_count > 0) {
		tp = dpnla.tmpget('tp5_6');
		ht = dpnla.tmprep(0,unowned_count,tp[0]);
		for (var i in unowned_names) {
			ht += dpnla.tmprep(0,unowned_names[i],tp[1]);
		}
		ht += tp[2];	mc[4] = ht;
	}
	// ロック艦ダブリ一覧
	if (double_count > 0) {
		tp = dpnla.tmpget('tp5_2');
		ht = dpnla.tmprep(0,double_count,tp[0]);
		lcdoublst.sort(function(a,b){
			var rt = b.s.stype() - a.s.stype();
			if(!rt) rt = a.s.sortno - b.s.sortno;
			if(!rt) rt = b.s.lv - a.s.lv;
			if(!rt) rt = a.s.id - b.s.id;
			return rt;
		});
		for (var i in lcdoublst) {
			var a = lcdoublst[i];
			ht += dpnla.tmprep(0,shiplist_names(a.list),tp[1]);
		}
		ht += tp[2];	mc[3] = ht;
	}
	//
	// ロック艦キラ付一覧を表示する.
	tp = dpnla.tmpget('tp5_7');		ra = ['&nbsp;','&nbsp;','&nbsp;','&nbsp;'];
	if (drumcan_cond85.length > 0) ra[0] = shiplist_names(drumcan_cond85);
	if (drumcan_cond53.length > 0) ra[1] = shiplist_names(drumcan_cond53);
	if (drumcan_cond50.length > 0) ra[2] = shiplist_names(drumcan_cond50);
	if (drumcan_condxx.length > 0) ra[3] = shiplist_names(drumcan_condxx);
	dpnla.tmpviw(0,'t51_4',dpnla.tmprep(2,ra,tp[0]));
	//
	// 装備数、ロック装備一覧を表示する.
	var items = Object.keys($slotitem_list).length;
	var space = $max_slotitem - items;
	if (space <= 0) {
		mb[1] = ' cr6';		mc[1] += '装備保有数が満杯です。 '; // 警告表示.
	} else if (space < 20) {
		mb[1] = ' cr6';		mc[1] += '装備保有数の上限まで残り 【'+ space +' 】 '; // 警告表示.
	}
	tp = dpnla.tmpget('tp1_1');		mb[4] = items;
	dpnla.tmpviw(0,'c01',dpnla.tmprep(2,mb,tp[0]));
	var lockeditem_ids = Object.keys(lockeditem_list);
	if (lockeditem_ids.length > 0) {
		lockeditem_ids.sort(function(a, b) {	// 種別ID配列を表示順に並べ替える.
			var aa = $mst_slotitem[a];
			var bb = $mst_slotitem[b];
			var ret = aa.api_type[2] - bb.api_type[2]; // 装備分類の大小判定.
			if (!ret) ret = aa.api_sortno - bb.api_sortno; // 分類内の大小判定.
			return ret;
		});
		tc = dpnla.tmpget('tp5_5');		rb = ['','',''];	var plnlst = [];
		var hb = [['','t521',0,1,3,1],['','t522',0,1,3,1]];
		for(i = 0;i < 2;i++){
			hb[i][0] = '<div id="'+ hb[i][1] +'_1">';
		}
		tp = dpnla.tmpget('tp5_1');		ht = tp[0];		ra = ['','','',''];		var he = hb[1];
		lockeditem_ids.forEach(function(id) {
			ca = 1;		itm = $mst_slotitem[id];
			if(is_airplane(itm)){
				ca = 0;		plnlst.push(id);
			}
			for (var lc in lockeditem_list[id]) {
				rb[2] = '';
				if(lc < 1) rb[2] = tc[4];
				for (var lv in lockeditem_list[id][lc]) {
					var item = lockeditem_list[id][lc][lv];
					if(ca > 0){
						if(he[2] == 0){
							if(he[3] > he[4]){
								he[3] = 1;	he[5]++;
							}
							if(he[3] == 1 && he[5] > 1){
								he[0] += '</div><div id="'+ he[1] +'_'+ he[5] +'" class="hid">';
							}
							he[0] += tc[1];
						}
					}
					rlv = lv % 16;	alv = 16 - ((lv - rlv) / 16);
					ra[0] = slotitem_name(id,(10 - rlv),alv);		ra[1] = item.shiplist.length;		ra[2] = item.count;
					if(ra[1] > 0){
						ra[3] = shiplist_names(item.shiplist);	ht += dpnla.tmprep(2,ra,tp[1]);
					}
					rb[0] = ra[0];	rb[1] = ra[2];
					if(ca > 0){
						he[0] += dpnla.tmprep(2,rb,tc[2]);	he[2]++;
						if(he[2] > 9){
							he[2] = 0;	he[3]++;	he[0] += tc[3];
						}
					}
				}
			}
		});
		ht += tp[2];	dpnla.tmpviw(0,'t51_1',ht);		he = hb[0];
		for (var i in plnlst) {
			var id = plnlst[i];
			for (var lc in airplane_list[id]) {
				rb[2] = '';
				if(lc < 1) rb[2] = tc[4];
				for (var lv in airplane_list[id][lc]) {
					alv = 16 - lv;
					for (var j in airplane_list[id][lc][lv]) {
						var plv = airplane_list[id][lc][lv][j];
						if(j < 1 && plv < 1) continue;
						if(j < 1){
							rb[0] = slotitem_name(id,0,alv);	rb[1] = plv;
						}else{
							rb[0] = slotitem_name(id,0,alv,plv);	rb[1] = 1;
						}
						if(he[2] == 0){
							if(he[3] > he[4]){
								he[3] = 1;	he[5]++;
							}
							if(he[3] == 1 && he[5] > 1){
								he[0] += '</div><div id="'+ he[1] +'_'+ he[5] +'" class="hid">';
							}
							he[0] += tc[1];
						}
						he[0] += dpnla.tmprep(2,rb,tc[2]);	he[2]++;
						if(he[2] > 9){
							he[2] = 0;	he[3]++;	he[0] += tc[3];
						}
					}
				}
			}
		}
		for(i = 0;i < 2;i++){
			if(hb[i][2] > 0) hb[i][0] += tc[3];
			hb[i][0] += '</div>';
		}
		ra = [lockeditem_count,(items - lockeditem_count),leveling_slotitem,levelmax_slotitem];
		dpnla.tmpviw(0,'c521',dpnla.tmprep(2,ra,tc[0]));
		for(i = 0;i < 2;i++){
			ky = hb[i][1];	j = i + 1;
			dpnla.tmpviw(0,'t52_'+ j,dpnla.tmpagemk(ky,hb[i][5],1));
			dpnla.tmpviw(0,'t52_'+ j +'_a',hb[i][0]);
			dpnla.tabinit(0,ky);	dpnla.tabdef(ky);
		}
	}else{
		dpnla.tmpviw(0,'t51_1','');
		dpnla.tmpviw(0,'t52_1','');		dpnla.tmpviw(0,'t52_1_a','');
		dpnla.tmpviw(0,'t52_2','');		dpnla.tmpviw(0,'t52_2_a','');
	}
	//
	// 改造可能一覧、近代化改修一可能覧を表示する.
	var kaizou_count = kaizou_list.length;	ht = '';
	if (kaizou_count > 0) {
		tp = dpnla.tmpget('tp5_3');		ht = dpnla.tmprep(0,kaizou_count,tp[0]);
		kaizou_list.sort(function(a,b){
			var rt = b.stype() - a.stype();
			if(!rt) rt = a.sortno - b.sortno;
			if(!rt) rt = b.lv - a.lv;
			if(!rt) rt = a.id - b.id;
			return rt;
		});
		for (var i in kaizou_list) {
			var ship = kaizou_list[i];
			var sname = ship.fleet_name_lv(1);
			ht += dpnla.tmprep(0,sname,tp[1]);
		}
		ht += tp[2];
	}
	ht = mc[4] + ht + mc[3];	dpnla.tmpviw(0,'t51_3',ht);
	// 近代化改修可能艦一覧(ロック艦のみ)
	var kyouka_count = [0,0,0,0];
	if (lock_kyoukalist.length > 0) {
		lock_kyoukalist.sort(function(a,b){
			var rt = b.lv - a.lv;
			if(!rt) rt = a.sortno - b.sortno;
			if(!rt) rt = a.id - b.id;
			return rt;
		});
		tp = dpnla.tmpget('tp3_4');		var ka = 0;		var kb = 0;		var kc = 0;		var kd = 0;
		ky = 't35';		ca = 0;		cb = 1;		cc = 2;		cd = 1;
		ht = '<div id="'+ ky +'_1">';	ra = new Array();
		for (var i in lock_kyoukalist) {
			var ship = lock_kyoukalist[i];
			ra[0] = ship.fleet_name_lv();		ra[1] = kira_name(ship.c_cond);
			ra[2] = ship.name_lv();		ra[3] = ship.lv;	ra[4] = ship.nextlv;
			ra[5] = '';		ra[6] = '';		ra[7] = '';		ra[8] = '';
			var max_k = ship.max_kyouka();
			for (var j in max_k) {
				kd = max_k[j] - ship.kyouka[j];
				if (kd > 0) {
					ka = j - 0;		kb = ka + 5;	kc = ka + 6;
					kyouka_count[ka]++;		ra[kb] = dpnla.tmprep(0,kd,tb[kc]);
				}
			}
			if(ca == 0){
				if(cb > cc){
					cb = 1;		cd++;
				}
				if(cb == 1 && cd > 1) ht += '</div><div id="'+ ky +'_'+ cd +'" class="hid">';
				ht += tp[0];
			}
			ht += dpnla.tmprep(2,ra,tp[1]);		ca++;
			if(ca > 9){
				ca = 0;		cb++;		ht += tp[2];
			}
		}
		if(ca > 0) ht += tp[2];
		ht += '</div>';
		dpnla.tmpviw(0,'t31_4_a',ht);
		dpnla.tmpviw(0,'t31_4',dpnla.tmpagemk(ky,cd));
		dpnla.tabinit(1,ky);	dpnla.tabdef(ky);
	}else{
		dpnla.tmpviw(0,'t31_4_a','');		dpnla.tmpviw(0,'t31_4','');
	}
	//
	// 入渠(修理)一覧表示する.
	var ndocks = Object.keys($ndock_list).length;
	var repairs = lock_repairlist.length;
	if (ndocks > 0 || repairs > 0) {
		ky = 't34';		ca = 0;		cb = 1;		cc = 2;		cd = 1;		ht = '<div id="'+ ky +'_1">';
		if (ndocks > 0) {
			ra = new Array();
			tp = dpnla.tmpget('tp3_7');		ht += tp[0];
			var ndoklst = {};
			for (var id in $ndock_list) {
				var d = $ndock_list[id];
				ndoklst[d.api_id] = id;
			}
			for (var i in ndoklst){
				var id = ndoklst[i];
				var d = $ndock_list[id];
				var ship = $ship_list[id];
				var c_date = new Date(d.api_complete_time);
				ra[0] = ship.fleet_name_lv();		ra[1] = kira_name(ship.c_cond);
				ra[2] = ship.name_lv();		ra[3] = ship.lv;
				ra[4] = d.api_item1;	ra[5] = d.api_item2;	ra[6] = d.api_item3;
				ra[7] = d.api_item4;	ra[8] = tb[5];
				ra[9] = dpnla.daytimchg(1,c_date);
				ht += dpnla.tmprep(2,ra,tp[1]);
			}
			ht += tp[2];	cb = 2;
		}
		if (repairs > 0) {
			ra = new Array();
			tp = dpnla.tmpget('tp3_3');
			lock_repairlist.sort(function(a, b) { return b.ndock_time - a.ndock_time; }); // 修理所要時間降順で並べ替える.
			for (var i in lock_repairlist) {
				var ship = lock_repairlist[i];
				ra[0] = ship.fleet_name_lv();		ra[1] = kira_name(ship.c_cond);
				ra[2] = ship.name_lv();		ra[3] = ship.lv;
				ra[4] = ship.nowhp;		ra[5] = ship.maxhp;
				ra[6] = damage_name(ship.nowhp, ship.maxhp, 1); // ダメージ.
				ra[7] = dpnla.strtimchg(ship.ndock_time); // 修理所要時間.
				if(ca == 0){
					if(cb > cc){
						cb = 1;		cd++;
					}
					if(cb == 1 && cd > 1) ht += '</div><div id="'+ ky +'_'+ cd +'" class="hid">';
					ht += tp[0];
				}
				ht += dpnla.tmprep(2,ra,tp[1]);		ca++;
				if(ca > 9){
					ca = 0;		cb++;		ht += tp[2];
				}
			}
			if(ca > 0) ht += tp[2];
		}
		ht += '</div>';
		dpnla.tmpviw(0,'t31_3_a',ht);
		dpnla.tmpviw(0,'t31_3',dpnla.tmpagemk(ky,cd));
		dpnla.tabinit(1,ky);	dpnla.tabdef(ky);
	}else{
		dpnla.tmpviw(0,'t31_3_a','');		dpnla.tmpviw(0,'t31_3','');
	}
	//
	// 建造ドック一覧表示する.
	var kdocks = Object.keys($kdock_list).length;
	if (kdocks > 0) {
		ra = new Array();
		tp = dpnla.tmpget('tp3_5');		ht = tp[0];
		for (var id in $kdock_list) {
			var k = $kdock_list[id];
			var c_date = new Date(k.api_complete_time);
			var complete = (k.api_state == 3 || c_date.getTime() < Date.now());	// api_state 3:完成, 2:建造中, 1:???, 0:空き, -1:未開放. ※ 1以下は$kdock_listに載せない.
			ra[0] = (complete ? '完成！' : '建造中');
			ra[1] = ship_name(k.api_created_ship_id);
			ra[2] = k.api_item1;
			ra[3] = k.api_item2;
			ra[4] = k.api_item3;
			ra[5] = k.api_item4;
			ra[6] = k.api_item5;
			ra[7] = (complete ? '' : dpnla.daytimchg(1,c_date));
			ht += dpnla.tmprep(2,ra,tp[1]);
		}
		ht += tp[2];	dpnla.tmpviw(0,'t31_5_a',ht);
	}else{
		dpnla.tmpviw(0,'t31_5_a','');
	}
	//
	// 記録を表示する.
	var logcnt = $logbook.length;		ra = ['','','&nbsp;','&nbsp;','&nbsp;','&nbsp;','&nbsp;'];
	rb = ['','','&nbsp;','&nbsp;','&nbsp;','&nbsp;','&nbsp;'];	rc = ['',''];		var emycnt = 0;
	var enmcnt = Object.keys($enemy_list).length;		var enecnt = enmcnt;	tp = dpnla.tmpget('tp5_4');
	var rd = ['<i class="icon-arrow-left mr0"></i> ','戦闘ログ：','戦闘ログ消去','敵艦隊：','敵艦ログ消去'];
	if(logcnt > 0){
		rc[0] = 'b561v';	rc[1] = rd[0] + rd[1] + logcnt;		ra[0] = dpnla.tmprep(2,rc,td[3]);
		rc[0] = 'b561d';	rc[1] = rd[2];	rb[0] = dpnla.tmprep(2,rc,td[4]);
	}else{
		ra[0] = dpnla.tmprep(0,rd[0] + rd[1] +'0',td[5]);		rb[0] = dpnla.tmprep(0,rd[2],td[5]);
	}
	if(enmcnt < 1){
		if(Object.keys($enemy_db).length > 0){
			for(var id in $enemy_db){
				emycnt += $enemy_db[id].data.length;
			}
		}
		enecnt = emycnt;
	}
	if(enecnt > 0){
		rc[0] = 'b562v';	rc[1] = rd[0] + rd[3] + enecnt;		ra[1] = dpnla.tmprep(2,rc,td[3]);
		rc[0] = 'b562d';	rc[1] = rd[4];	rb[1] = dpnla.tmprep(2,rc,td[4]);
	}else{
		ra[1] = dpnla.tmprep(0,rd[0] + rd[3] +'0',td[5]);		rb[1] = dpnla.tmprep(0,rd[4],td[5]);
	}
	dpnla.tmpviw(0,'t56_1',dpnla.tmprep(2,ra,tp[0]));		dpnla.tmpviw(0,'t56_2',dpnla.tmprep(2,rb,tp[0]));
	if(logcnt > 0){
		dpnla.addevent(dpnla.ge('b561v'),'click',function(){ dpnla.kcprecviw(0); });
		dpnla.addevent(dpnla.ge('b561d'),'click',function(){ dpnla.kcprecdel(0); });
	}
	if(enmcnt > 0){
		dpnla.addevent(dpnla.ge('b562v'),'click',function(){ dpnla.kcprecviw(1); });
		dpnla.addevent(dpnla.ge('b562d'),'click',function(){ dpnla.kcprecdel(1); });
	}else{
		if(emycnt > 0){
			dpnla.addevent(dpnla.ge('b562v'),'click',function(){ dpnla.kcprecviw(2); });
			dpnla.addevent(dpnla.ge('b562d'),'click',function(){ dpnla.kcprecdel(2); });
		}
	}
	var req = {};		ht = '';	tp = dpnla.tmpget('tp1_2');		tb = dpnla.tmpget('tp1_3');
	if(mc[1] != '') ht += td[6] + dpnla.tmprep(0,mc[1],td[1]) + td[7];
	ht += tp[0];	req.tp = tp;	req.tb = tb;	req.td = td;	req.ht = '';
	//
	// 遂行中任務を一覧表示する.
	push_quests(req);
	ht += req.ht + tp[4];
	ra = [(ships - unlock_names.length),cond85,cond53,cond50];
	for(i = 0;i < 4;i++){
		j = i + 4;	ra[j] = kyouka_count[i];
	}
	ht += dpnla.tmprep(2,ra,tp[6]);
	if(ndocks > 0 || repairs > 0 || kdocks > 0){
		ra = ['','',damage_H,damage_M,damage_L,damage_N];		rb = ['',''];
		rc = [' <i class="icon-arrow-right mr0"></i>','入渠中：','建造中：'];
		if(ndocks > 0){
			rb[0] = 'b12n';		rb[1] = rc[1] + ndocks + rc[0];		ra[0] = dpnla.tmprep(2,rb,td[3]);
		}else{
			ra[0] = dpnla.tmprep(0,rc[1] +'0',td[5]);
		}
		if(kdocks > 0){
			rb[0] = 'b12k';		rb[1] = rc[2] + kdocks + rc[0];		ra[1] = dpnla.tmprep(2,rb,td[4]);
		}else{
			ra[1] = dpnla.tmprep(0,rc[2] +'0',td[5]);
		}
		ht += dpnla.tmprep(2,ra,tp[7]);
	}
	mc[3] = ht;		mc[4] = tp[5];
	req = {};		req.md = new Array();
	//
	// 各艦隊の情報を一覧表示する.
	push_all_fleets(req);
	var md = req.md;	tp = dpnla.tmpget('tp1_4');		var me = new Array();
	if(md.length > 0){ // 遠征中リスト構築
		mc[3] += tp[0];
		for(i = 0;i < md.length;i++){
			me = md[i];		me[0] = tp[3] + me[0] + tp[4];
			mc[3] += dpnla.tmprep(2,me,tp[1]);
		}
		mc[3] += tp[2];
	}
	me = request_date_time();		me.push(dpnla.kcpstimeview());
	mc[3] += dpnla.tmprep(2,me,tp[5]) + mc[4];
	dpnla.tmpviw(0,'t11_1',mc[3]);
	if(ndocks > 0){
		dpnla.addevent(dpnla.ge('b12n'),'click',function(){ dpnla.tabsel('t01',2); dpnla.tabsel('t31',2); });
	}
	if(kdocks > 0){
		dpnla.addevent(dpnla.ge('b12k'),'click',function(){ dpnla.tabsel('t01',2); dpnla.tabsel('t31',4); });
	}
}

//------------------------------------------------------------------------
// 羅針盤・陣形選択画面表示.
//
function print_next(title, msg) {
	var req = [request_date_time()];
	req.push('# ' + $next_mapinfo.api_name + ' ' + title);
	req = req.concat(msg); // msg は string or Array.
	push_all_fleets(req);
	if (req.damage_H_alart) { req.splice(1, 0, '# @!!【大破進撃警告】!!@ ダメコン未装備なら、ブラウザを閉じて進撃中止を勧告します.'); } // 大破進撃の警告を2行目に挿入する.
	//変更中 1-6等を考慮した文言にする
}

//------------------------------------------------------------------------
function push_quests(req) {
	var quests = Object.keys($quest_list).length;
	if (quests > 0) {
		var ha = '';	var ra = ['','',''];	var tp = req.tp;	var tb = req.tb;	var ca = 0;
		var q_count = { daily:0, weekly:0, monthly:0 };
		var p_count = { daily:0, weekly:0, monthly:0 };
		for (var id in $quest_list) {
			var quest = $quest_list[id];
			var q_type = '';
			switch (quest.api_type) {
			case 2:	// デイリー.
			case 4:	// 敵空母3隻.
			case 5:	// 敵輸送船.
				if (quest.api_state > 1) p_count.daily++;
				q_count.daily++; q_type = 'D'; break;
			case 3:	// ウィークリー.
				if (quest.api_state > 1) p_count.weekly++;
				q_count.weekly++; q_type = 'W'; break;
			case 6:	// マンスリー.
				if (quest.api_state > 1) p_count.monthly++;
				q_count.monthly++; q_type = 'M'; break;
			}
			if (quest.api_state > 1) {
				ra[0] = '';		ra[2] = q_type;
				if(quest.api_state == 3){
					ra[0] = tb[8];
				}else if(quest.api_progress_flag == 2){
					ra[0] = tb[9];
				}else if(quest.api_progress_flag == 1){
					ra[0] = tb[10];
				}
				ca = quest.api_category;
				if(ca == 8) ca = 2;
				ra[1] = tb[ca] + quest.api_title;
				if (quest.api_no == 214) ra[1] += weekly_name();
				ha += dpnla.tmprep(2,ra,tp[2]);
			}
		}
		if (ha != '') {
			ra = [$quest_exec_count,$quest_count,q_count.daily,q_count.weekly,q_count.monthly,p_count.daily,p_count.weekly,p_count.monthly];
			req.ht = dpnla.tmprep(2,ra,tp[1]) + ha + tp[3];
		}
	}
	if (quests != $quest_count) req.ht = dpnla.tmprep(0,'任務リストを先頭から最終ページまでめくってください。',req.td[2]) + req.ht;
}

function push_all_fleets(req) {
	var i = 0;	var j = 0;	var ky = '';	var ht = ['','','','',''];	var ra = ['','','','',''];
	var ma = ['全 艦 隊'];	var me = new Array();		var ta = new Array();		var tp = new Array();
	for(i = 0;i < 3;i++){
		j = i + 1;	ky = 'tp2_'+ j;		tp[i] = dpnla.tmpget(ky);
	}
	ht[5] = '出撃中：'+ $battle_log.join(' <i class="icon-arrow-right"></i>');
	for (var f_id in $fdeck_list) {
		ky = '';	ra[0] = '';		ra[1] = '';		ra[4] = 'info';
		var deck = $fdeck_list[f_id];
		if ($combined_flag && f_id < 3) {
			ky = '◆';	ra[0] = '【連合】 ';	ra[4] = 'primary';
		}
		ky += deck.api_name;	ma.push(ky);	ra[0] += deck.api_name;		ra[2] = tp[2][2];
		ta = push_fleet_status(tp, deck);
		var mission_end = deck.api_mission[2];
		if (mission_end > 0) {
			var d = new Date(mission_end);
			var id = deck.api_mission[1];
			me = new Array();		me[0] = f_id;		me[1] = id;		me[2] = $mst_mission[id].api_name;
			$last_mission[f_id] = '前回遠征：' + me[2]; // 支援遠征では /api_req_mission/result が来ないので、ここで事前更新しておく.
			me[3] = dpnla.daytimchg(1,d);		ra[1] = tp[2][1];		ra[2] += tp[2][4] +' '+ me[3] +' ';
			ra[3] = '遠征 【'+ id +' 】 '+ me[2] +' ： '+ me[3];	req.md.push(me);
		}
		else if ($combined_flag && f_id == 2 && $battle_deck_id == 1) {
			ra[3] = ht[5];
			if (ta[3] > 0) { req.damage_H_alart = true; } // 大破進撃警告ON.
		}
		else if (deck.api_id == $battle_deck_id) {
			ra[3] = ht[5];
			if (ta[3] > 0) { req.damage_H_alart = true; } // 大破進撃警告ON.
		}
		else {
			if ($last_mission[f_id])
				ra[3] = $last_mission[f_id];
			else
				ra[3] = '母港待機中';
		}
		ra[2] += ta[2] + tp[2][3];
		ht[0] += dpnla.tmprep(2,ra,tp[0][0]) + ta[0] + tp[0][2];
		ht[f_id] = dpnla.tmprep(2,ra,tp[1][0]) + ta[1] + dpnla.tmprep(0,ra[3],tp[1][3]);
	}
	for(i = 0;i < 5;i++){
		j = i + 1;	ky = 't21_'+ j;		dpnla.tmpviw(0,ky,ht[i]);
	}
	dpnla.tmpviw(0,'c21',dpnla.tmptabmk('t21',ma));
	dpnla.tabinit(0,'t21');		dpnla.tabdef('t21');
}

//------------------------------------------------------------------------
// イベントハンドラ.
//
function on_mission_check(category) {
	var tp = dpnla.tmpget('tp0_3');		var tb = dpnla.tmpget('tp1_3');
	var ra = ['',tb[category] +'任務チェック'];		var rb = ['','',''];
	var ht = '';	var ha = '';	var rc = 0;
	var qc = Object.keys($quest_list).length;
	if(qc > 0){
		for (var id in $quest_list) {
			var quest = $quest_list[id];
			if (quest.api_category == category) {	// 1:編成, 2:出撃, 3:演習, 4:遠征, 5:補給入渠, 6:工廠.
				rb[0] = '';		rb[1] = quest.api_title;	rb[2] = tb[12];
				if(quest.api_state == 3){
					rb[0] = tb[8];	rb[2] = '';
					if(rc < 2) rc = 1;
				}else if(quest.api_state == 1){
					rb[2] = tb[13];		rc = 2;
				}
				if(rb[0] == ''){
					if(quest.api_progress_flag == 2){
						rb[0] = tb[9];
					}else if(quest.api_progress_flag == 1){
						rb[0] = tb[10];
					}
				}
				ha += dpnla.tmprep(2,rb,tp[1]);
			}
		}
	}
	switch(rc){
	 case 1:
		ra[0] = '達成している任務があります。';		break;
	 case 2:
		ra[0] = '未チェックの任務があります。';		break;
	}
	if (qc != $quest_count){
		ra[0] = '任務リストを先頭から最終ページまでめくってください。';		rc = 3;
	}
	ht = dpnla.tmprep(2,ra,tp[0]) + ha + tp[2];
	if(rc > 0) dpnla.pmbopen(220,40,380,170,ht);
}

function on_next_cell(json) {
	var d = json.api_data;
	var g = json.api_data.api_itemget;
	if (!g) g = json.api_data.api_itemget_eo_comment; // EO 1-6 海域ゴールの取得資源.
	var h = json.api_data.api_happening;
	var area = d.api_maparea_id + '-' + d.api_mapinfo_no + '-' + d.api_no;
	var arow = ' <i class="icon-arrow-right"></i>';		var tp = dpnla.tmpget('tp4_1');		var ra = new Array();
	$next_mapinfo = $mst_mapinfo[d.api_maparea_id * 10 + d.api_mapinfo_no];
	if (d.api_event_id == 5) {
		area += '(boss)';
		$is_boss = true;
	}
	if (g) {	// 資源マス.
		var id = g.api_id;
		var count = g.api_getcount;
		$material.dropitem[id-1]   += count;	// 道中ドロップによる資材増加を記録する.
		$material.autosupply[id-1] -= count;	// 後続の /api_port/port にて自然増加に誤算入される分を補正する.
		var msg = area + ':' + material_name(id) + 'x' + count;
		$battle_log.push(msg);
		dpnla.tmpviw(1,'c41',arow +'Item '+ msg);
	}
	else if (h) {	// 渦潮マス.
		var id = h.api_mst_id;
		var count = h.api_count;
		$material.dropitem[id-1] -= count;	// 道中ロスによる資材減少を記録する.
		$material.charge[id-1]   += count;	// 後続の /api_req_hokyu/charge にて補給に含まれる分を補正する.
		var msg = area + ':' + material_name(id) + 'x' + -count;
		if (h.api_dentan) msg += '(電探により軽減あり)';
		$battle_log.push(msg);
		dpnla.tmpviw(1,'c41',arow +'Loss '+ msg);
	}
	else if (d.api_event_id == 6) {	// 非戦闘マス.
		var msg = area;
		switch (d.api_event_kind) {
		case 0: msg += ':気のせいだった'; break;
		case 1: msg += ':敵影を見ず'; break;
		case 2: msg += ':能動分岐'; break;
		default: msg += ':??'; break;
		}
		$battle_log.push(msg);
		dpnla.tmpviw(1,'c41',arow +'Skip '+ msg);
	}
	else {	// 戦闘マス.
		var i = 0;	var ky = 't42';		var ha = '';	var rb = ['m'];		var tb = dpnla.tmpget('tp4_3');
		var db = $enemy_db[$next_enemy = area];
		if (db) {
			var ca = 1;		var cb = 0;		var tc = '';
			var rc = new Array();		var rd = new Array();
			if (db.fifo || db.data[0].r == null) { // 旧データならば破棄する.
				delete db.fifo;
				db.data = [];
			}
			var week = get_weekly().week;
			if (db.week != week) {
				db.week = week;
				db.data.forEach(function(a) { a.w = 0; }); // 今週回数をゼロに戻す.
			}
			var list = db.data.concat();
			list.sort(function(a, b) {	// 海域難度、今週、通算降順に並べ替える.
				if (a.r != b.r) return b.r - a.r;	// 海域難度が異なればその大小を返す.
				if (b.w != a.w) return b.w - a.w;	// 今週回数が異なればその大小を返す.
				return b.n - a.n;	// 通算回数の大小を返す.
			});
			var sum_ss = 0; // 敵潜水艦隊の通算回数合計.
			var sum_all = 0; //　全敵艦隊の通算回数合計.
			list.forEach(function(a) {
				rc = a.name.split(', ');	ra[0] = ky +'_'+ (ca + 1);
				ra[1] = rc[0];	ra[2] = a.lv;		ra[3] = a.w;	ra[4] = a.n;
				ha += dpnla.tmprep(2,ra,tb[1]);	cb = 0;
				for(i = 1;i < rc.length;i++){
					rd = rc[i].split('Lv');		ra = [i,rd[0],rd[1]];		tc = tb[2];
					if(/潜水.級/.test(rd[0])){
						tc = tb[3];		cb = 1;
					}
					ha += dpnla.tmprep(2,ra,tc);
				}
				ha += tb[4];	rb.push(ca);	ca++;
				if(cb > 0) sum_ss += a.n;
				sum_all += a.n;
			});
			ra = [area,dpnla.tmptabmk(ky,rb),ky +'_1'];
			ha = dpnla.tmprep(2,ra,tb[0]) + ha + tb[5];
			if (sum_ss > 0) {
				ha += dpnla.tmprep(0,fraction_percent_name(sum_ss, sum_all),tb[6]);
			}
		}
		dpnla.tmpviw(0,'c45',ha);		dpnla.tmpviw(0,'c43','&nbsp;');
		if(ha != '') dpnla.tabinit(0,ky);
		dpnla.tmpviw(1,'c41',arow +'敵 '+ area);	dpnla.tabsel('t41',0);
	}
	ra = request_date_time();		ra.push(dpnla.kcpstimeview());
	dpnla.tmpviw(0,'c47',dpnla.tmprep(2,ra,tp[10]));
}

/// 護衛退避艦リストに艦IDを追加する. idx = 1..6, 7..12
function add_ship_escape(idx) {
	if (idx >= 7)
		$ship_escape[$fdeck_list[2].api_ship[idx-7]] = 1; // 第ニ艦隊から退避.
	else if (idx >= 1)
		$ship_escape[$fdeck_list[1].api_ship[idx-1]] = 1; // 第一艦隊から退避.
}

/// 護衛退避実行. 退避可能リストから１艦、護衛可能リストから１艦、合計2艦のみ退避できる.
function on_goback_port() {
	if (!$escape_info) return;
	add_ship_escape($escape_info.api_escape_idx[0]);	// 退避可能艦一覧の最初の艦を退避リストに追加する.
	add_ship_escape($escape_info.api_tow_idx[0]);		// 護衛可能艦一覧の最初の艦を退避リストに追加する.
}

function on_battle_result(json) {
	var d = json.api_data;
	var e = d.api_enemy_info;
	var g = d.api_get_ship;
	var h = d.api_get_useitem;
	var mvp   = d.api_mvp;
	var mvp_c = d.api_mvp_combined;
	var lost  = d.api_lost_flag;
	var tp = dpnla.tmpget('tp4_1');		var msg = tp[3] +'battle result'+ tp[4];
	var drop_ship_name = g ? g.api_ship_type + '：'+ g.api_ship_name : null;
	var drop_item_name = h ? $mst_useitem[h.api_useitem_id].api_name : null;
	$escape_info = d.api_escape;	// on_goback_port()で使用する.
	if (e) {
		if ($next_mapinfo) {
			var map_rank = $mapinfo_rank[$next_mapinfo.api_id];
			switch (map_rank) {	// 難度選択海域ならば、艦隊名に難度表記を付加する.
			case 1: e.api_deck_name += '@丙'; break;
			case 2: e.api_deck_name += '@乙'; break;
			case 3: e.api_deck_name += '@甲'; break;
			}
		}
		var rank = d.api_win_rank;
		var e_name = e.api_deck_name;	msg += e_name;	dpnla.tmpviw(0,'c46',e_name +'('+ $enemy_formation +')');
		if (d.api_ship_id) {
			var total = count_unless(d.api_ship_id, -1);
			msg += '(' + d.api_dests + '/' + total + ')';
			if (rank == 'S' && $f_damage == 0) rank = '完S';
		}
		msg += '：'+ rank;
		$guess_info_str += ', rank:' + rank;
		if (rank != $guess_win_rank) {
			$guess_info_str += '/' + $guess_win_rank + ' MISS!!';
			msg += '<br />'+ tp[9] +'勝敗推定ミス'+ tp[8] +' '+ $guess_info_str;
			push_to_logbook($next_enemy + ', ' + $guess_info_str);
		}
		else if ($guess_debug_log) {
			push_to_logbook($next_enemy + ', ' + $guess_info_str);
		}
		var log = $next_enemy + '(' + e_name          + '):' + $battle_info + ':' + rank;
		if (drop_ship_name) {
			log += '+' + g.api_ship_name; // drop_ship_name; 艦種を付けると冗長すぎるので艦名のみとする.
		}
		if (drop_item_name) {
			log += '+' + drop_item_name;
		}
		$battle_log.push(log);
		if (!/^演習/.test($next_enemy)) {
			// 敵艦隊構成と司令部Lvを記録する.
			var db = $enemy_db[$next_enemy] || { week:get_weekly().week, data:[] };
			var efleet = {
				name: e.api_deck_name + '(' + $enemy_formation + '), ' + $enemy_ship_names.join(', '), // 艦隊名(陣形):艦名,...
				w: 1,					// 今週回数.
				n: 1,					// 通算回数.
				r: (map_rank || 0),		// 海域難度. 3(甲),2(乙),1(丙),0(通常) undefinedなら0に置き換える.
				lv: d.api_member_lv		// 司令部Lv.
			};
			for (var i = 0; i < db.data.length; ++i) {		// db.dataに記録済みならば、その記録を更新する.
				if (db.data[i].name == efleet.name) {
					efleet.n += db.data[i].n;
					efleet.w += db.data[i].w;
					db.data[i] = efleet;
					break;
				}
			}
			if (i == db.data.length) db.data.push(efleet);	// 未記録ならば、db.dataへ新規追加する.
			$enemy_db[$next_enemy] = db;
			save_storage('enemy_db', $enemy_db);
		}
	}
	if (g) {
		var drop_ship = {
			api_id: $tmp_ship_id--, // 通常の背番号(1以上)と衝突しないように負の仮番号を作る. 母港に戻れば保有艦一覧が全体更新されるので、正しい背番号になる.
			api_ship_id: g.api_ship_id,
			api_cond: 49,
			api_lv: 1,
			api_maxhp: 1,
			api_nowhp: 1,
			api_locked: 0,
			api_slot: [],	// デフォルト装備が取れないので空にしておく.
			api_onslot: [0,0,0,0,0],
			api_kyouka: [0,0,0,0,0],
			api_exp: [0,100,0]
		};
		delta_update_ship_list([drop_ship]);
	}
	if (mvp) {
		var id = $fdeck_list[$battle_deck_id].api_ship[mvp-1];
		var ship = $ship_list[id];
		msg += '<br />MVP：'+ ship.name_lv(1) +' +'+ d.api_get_ship_exp[mvp] +'exp';
	}
	if (mvp_c) {
		var id = $fdeck_list[2].api_ship[mvp_c-1];
		var ship = $ship_list[id];
		msg += '<br />MVP：'+ ship.name_lv(1) +' +'+ d.api_get_ship_exp_combined[mvp_c] +'exp';
	}
	if (lost) {
		for (var i in lost) {
			if (lost[i] == 1) {
				var id = $fdeck_list[$battle_deck_id].api_ship[i-1];
				var ship = $ship_list[id];
				msg += '<br />LOST：'+ ship.name_lv(1);
				ship_delete([id]);
			}
		}
	}
	if (drop_ship_name) {
		msg += '<br />'+ tp[3] +'drop ship'+ tp[4] + drop_ship_name;
	}
	if (drop_item_name) {
		msg += '<br />'+ tp[3] +'drop item'+ tp[4] + drop_item_name;
	}
	var ra = request_date_time();		ra.push(dpnla.kcpstimeview());
	dpnla.tmpviw(0,'c47',dpnla.tmprep(2,ra,tp[10]));	dpnla.tmpviw(1,'c43',msg);
}

function calc_damage(result, hp, battle, hc) {
	// hp ::= [-1, friend1...6, enemy1...6]
	// hc ::= [-1, combined1..6]
	if (!battle) return;
	if (battle.api_df_list && battle.api_damage) {
		var df = battle.api_df_list;
		for (var i = 1; i < df.length; ++i) {
			var at = battle.api_at_list[i]; if (hc && at <= 6) at += 20; // 攻撃艦No. 連合第二艦隊なら20の下駄履き.
			var si = battle.api_si_list[i]; // 装備配列.
			var cl = battle.api_cl_list[i]; // 命中配列.
			var ty = null;	// 攻撃種別
			if (battle.api_at_type) ty = battle_type_name(battle.api_at_type[i]);	// 昼戦攻撃種別.
			if (battle.api_sp_list) ty = battle_sp_name(battle.api_sp_list[i]);		// 夜戦攻撃種別.
			for (var j = 0; j < df[i].length; ++j) {
				var target = df[i][j];
				if (target == -1) continue;
				var damage = battle.api_damage[i][j];
				// 砲撃戦:敵味方ダメージ集計.
				if (hc && target <= 6)
					hc[target] -= Math.floor(damage);
				else
					hp[target] -= Math.floor(damage);
				// 砲撃戦:敵味方砲撃詳報収集.
				if (hc && target <= 6)
					result.detail.push({ty: ty, at: at, target: target+20, si: si, cl: battle_cl_name(cl[j]), damage: damage, hp: hc[target]}); // 対象艦No. 連合第二艦隊なら20の下駄履き.
				else
					result.detail.push({ty: ty, at: at, target: target,    si: si, cl: battle_cl_name(cl[j]), damage: damage, hp: hp[target]});
			}
		}
	}
	if (battle.api_fdam) {
		// 航空戦/雷撃戦:味方ダメージ集計.
		for (var i = 1; i <= 6; ++i) {
			if (hc)
				hc[i] -= Math.floor(battle.api_fdam[i]);
			else
				hp[i] -= Math.floor(battle.api_fdam[i]);
		}
	}
	if (battle.api_edam) {
		// 航空戦/雷撃戦:敵ダメージ集計.
		for (var i = 1; i <= 6; ++i) {
			hp[i+6] -= Math.floor(battle.api_edam[i]);
		}
	}
	if (battle.api_deck_id && battle.api_damage) { // battle: api_support_hourai
		for (var i = 1; i <= 6; ++i) {
			if (hp[i+6] < 0) continue;	// 敵艦隊の編成外または撃沈済みなら集計対象外とする.
			// 支援艦隊砲雷撃:敵ダメージ集計.
			hp[i+6] -= Math.floor(battle.api_damage[i]);
			// 支援艦隊砲雷撃:戦闘詳報収集.
			result.detail.push({ty:"支援砲雷撃", target: i + 6, cl: battle_cl_name(battle.api_cl_list[i]), damage: battle.api_damage[i], hp: hp[i+6]});
		}
	}
	if (battle.api_frai) {
		// 味方雷撃:戦闘詳報収集.
		for (var i = 1; i <= 6; ++i) {
			var target = battle.api_frai[i];
			var damage = battle.api_fydam[i];
			if (target != 0) result.detail.push({ty:"雷撃戦", at: (hc ? i + 20 : i), target: target + 6, cl: battle_cl_name(battle.api_fcl[i]), damage: damage, hp: hp[target+6]});
		}
	}
	if (battle.api_erai) {
		// 敵雷撃:戦闘詳報収集.
		for (var i = 1; i <= 6; ++i) {
			var target = battle.api_erai[i];
			var damage = battle.api_eydam[i];
			if (target != 0) result.detail.push({ty:"雷撃戦", at: i + 6, target: (hc ? target + 20 : target), cl: battle_cl_name(battle.api_ecl[i]), damage: damage, hp: (hc ? hc[target] : hp[target])});
		}
	}
	if (battle.api_frai_flag && battle.api_fbak_flag) {
		// 開幕航空戦:味方被害詳報収集.
		for (var i = 1; i <= 6; ++i) {
			var target = hc ? i + 20 : i;
			var damage = battle.api_fdam[i];
			if (battle.api_frai_flag[i] || battle.api_fbak_flag[i])
				result.detail.push({ty:"航空戦", target: target, cl: battle_cl_name(damage ? battle.api_fcl_flag[i]+1 : 0), damage: damage, hp: (hc ? hc[i] : hp[i])});
		}
	}
	if (battle.api_erai_flag && battle.api_ebak_flag) {
		// 開幕航空戦/航空支援:敵被害詳報収集.
		for (var i = 1; i <= 6; ++i) {
			var target = i + 6;
			var damage = battle.api_edam[i];
			if (battle.api_erai_flag[i] || battle.api_ebak_flag[i])
				result.detail.push({ty: (battle.api_fdam ? "航空戦" : "航空支援"), target: target, cl: battle_cl_name(damage ? battle.api_ecl_flag[i]+1 : 0), damage: damage, hp: hp[target]});
		}
	}
	// 緊急ダメコン発動によるhp補正を行う.
	if (hc)
		repair_fdeck($fdeck_list[2], $maxhps_c, hc);
	else
		repair_fdeck($fdeck_list[$battle_deck_id], $maxhps, hp);
}

function calc_kouku_damage(result, hp, kouku, hc) {
	if (!kouku) return;
	if (kouku.api_stage1) {	// 制空戦.
		var st = kouku.api_stage1;
		result.seiku = st.api_disp_seiku;
		result.touch = st.api_touch_plane;
		result.f_air_lostcount += st.api_f_lostcount;
		if (st.api_touch_plane) {
			var t0 = st.api_touch_plane[0]; if (t0 != -1) result.detail.push({ty:'触接',  si:[t0]});
			var t1 = st.api_touch_plane[1]; if (t1 != -1) result.detail.push({ty:'被触接', si:[t1]});
		}
		result.detail.push({
			ty: seiku_name(st.api_disp_seiku),
			ek: fraction_percent_name(st.api_e_lostcount, st.api_e_count),
			fk: fraction_percent_name(st.api_f_lostcount, st.api_f_count)
		});
	}
	if (kouku.api_stage2) {	// 防空戦.
		var st = kouku.api_stage2;
		result.f_air_lostcount += st.api_f_lostcount;
		if (st.api_air_fire) {
			var idx = st.api_air_fire.api_idx + 1; if (hc && idx > 6) idx += 20 - 6;
			result.detail.push({
				ty: '対空カットイン(' + st.api_air_fire.api_kind + ')',
				at: idx,
				si: st.api_air_fire.api_use_items,
				ek: fraction_percent_name(st.api_e_lostcount, st.api_e_count),
				fk: fraction_percent_name(st.api_f_lostcount, st.api_f_count)
			});
		}
		else {
			result.detail.push({
				ty: '防空戦',
				ek: fraction_percent_name(st.api_e_lostcount, st.api_e_count),
				fk: fraction_percent_name(st.api_f_lostcount, st.api_f_count)
			});
		}
	}
	calc_damage(result, hp, kouku.api_stage3);				// 航空爆撃雷撃戦.
	calc_damage(result, hp, kouku.api_stage3_combined, hc);	// 連合第二艦隊：航空爆撃雷撃戦.
}

function push_fdeck_status(ptn, fdeck, maxhps, nowhps, beginhps) {
	var tp = dpnla.tmpget('tp4_1');		var ha = '';	var ra = ['','','','','',''];
	for (var i = 1; i <= 6; ++i) {
		var maxhp = maxhps[i];
		if (maxhp == -1) continue;
		var nowhp = nowhps[i];	var name = '?';		var shlv = '?';
		var ship = $ship_list[fdeck.api_ship[i-1]];
		if (ship) {
			name = ship.name_lv();	shlv = ship.lv;
			if (ship.repair_msg) name += (ship.repair_msg == 'DC') ? tp[6] : tp[5];
			delete ship.repair_msg;
			var repair = slotitem_count(ship.slot, 42);	// 修理要員(ダメコン).
			var megami = slotitem_count(ship.slot, 43);	// 修理女神.
			if (repair) name += tp[7] +'修理要員x'+ repair + tp[8];
			if (megami) name += tp[7] +'修理女神x'+ megami + tp[8];
		}
		ra[0] = i;	ra[1] = name;		ra[2] = shlv;		ra[3] = (nowhp < 0 ? 0 : nowhp) +'/'+ maxhp;
		ra[4] = diff_name(nowhp, beginhps[i]);	ra[5] = damage_name(nowhp, maxhp);
		ha += dpnla.tmprep(2,ra,tp[1]);
	}
	ra[0] = fdeck.api_name;		ra[1] = '';		ra[2] = 'c46'+ (1 + ptn);
	if(ptn < 1) ra[1] = ' mb3';
	var hb = tp[12] + ha + tp[13];	ha = tp[0] + ha + tp[2];
	dpnla.tmpviw(ptn,'c44',dpnla.tmprep(2,ra,ha));
	dpnla.tmpviw(ptn,'t41_2',dpnla.tmprep(2,ra,hb));
}

function repair_fdeck(fdeck, maxhps, nowhps) {
	if (/^演習/.test($next_enemy)) return;
	for (var i = 1; i <= 6; ++i) {
		if (maxhps[i] == -1) continue;
		var ship = $ship_list[fdeck.api_ship[i-1]];
		if (ship && nowhps[i] <= 0) {
			var id = slotitem_use(ship.slot, [42, 43]);	// slotの先頭から末尾に検索し、最初に見つけたダメコン装備を抜く.
			switch (id) {
			case 42: ship.repair_msg = 'DC'; nowhps[i] = Math.floor(maxhps[i] * 0.2); break; // 修理要員は 20% 回復する.
			case 43: ship.repair_msg = 'MG'; nowhps[i] = maxhps[i]; break; // 修理女神は 100% 回復する.
			}
		}
	}
}

function guess_win_rank(nowhps, maxhps, beginhps, nowhps_c, maxhps_c, beginhps_c, isChase, battle_api_name) {
	var f_damage_total = 0;
	var f_hp_total = 0;
	var f_maxhp_total = 0;
	var f_lost_count = 0;
	var f_count = 0;
	var e_damage_total = 0;
	var e_hp_total = 0;
	var e_count = 0;
	var e_lost_count = 0;
	var e_leader_lost = false;
	for (var i = 1; i <= 6; ++i) {
		// 友軍被害集計.
		if(maxhps[i] == -1) continue;
		var n = nowhps[i];
		++f_count;
		f_damage_total += beginhps[i] - Math.max(0, n);
		f_hp_total += beginhps[i];
		f_maxhp_total += maxhps[i];
		if (n <= 0) {
			++f_lost_count;
		}
	}
	for (var i = 1; i <= 6; ++i) {
		// 連合第二友軍被害集計.
		if(!maxhps_c || maxhps_c[i] == -1) continue;
		var n = nowhps_c[i];
		++f_count;
		f_damage_total += beginhps_c[i] - Math.max(0, n);
		f_hp_total += beginhps_c[i];
		f_maxhp_total += maxhps_c[i];
		if (n <= 0) {
			++f_lost_count;
		}
	}
	for(var i = 7; i <= 12; ++i){
		// 敵艦被害集計.
		if(maxhps[i] == -1) continue;
		var n = nowhps[i];
		++e_count;
		e_damage_total += beginhps[i] - Math.max(0, n);
		e_hp_total += beginhps[i];
		if (n <= 0) {
			++e_lost_count;
			if(i == 7) e_leader_lost = true;
		}
	}
	$f_damage = f_damage_total;
	// %%% CUT HERE FOR TEST %%%
	var f_damage_percent = Math.floor(100 * f_damage_total / f_hp_total); // 自ダメージ百分率. 小数点以下切り捨て.
	var e_damage_percent = Math.floor(100 * e_damage_total / e_hp_total); // 敵ダメージ百分率. 小数点以下切り捨て.
	var rate = e_damage_percent == 0 ? 0   : // 潜水艦お見合い等ではDになるので敵ダメ判定を優先する.
			   f_damage_percent == 0 ? 100 : // ゼロ除算回避、こちらが無傷なら1ダメ以上与えていればBなのでrateを100にする.
			   e_damage_percent / f_damage_percent;
	$guess_info_str = 'f_damage:' + fraction_percent_name(f_damage_total, f_hp_total) + '[' + f_lost_count + '/' + f_count + ']' + f_maxhp_total
				+ ', e_damage:' + fraction_percent_name(e_damage_total, e_hp_total) + (e_leader_lost ? '[x' : '[') + e_lost_count + '/' + e_count + ']'
				+ (isChase ? ', chase_rate:' : ', rate:') + Math.round(rate * 10000) / 10000
				;
	$guess_debug_log = false;
	if (/ld_airbattle/.test(battle_api_name)) {
		if (f_lost_count == 0) {
			if (f_damage_total == 0) return '完S'; // 確定.
			if (f_damage_percent <= 10) return 'A'; // 要検証!!! 0.4%～8%　で A
			if (f_damage_percent <= 20) return 'B'; // 要検証!!! 14%～19%　で B
			if (f_damage_percent <= 50) return 'C'; // 要検証!!! 24%～xx%　で C
		}
		if (f_lost_count < f_count/2) return 'D'; // 要検証!!!
		return 'E';
	}
	if (e_count == e_lost_count && f_lost_count == 0) {
		return (f_damage_total == 0) ? '完S' : 'S';	// 1%未満の微ダメージでも、"完S"にはならない.
	}
	if (e_lost_count >= (e_count == 6 ? 4 : e_count/2) && f_lost_count == 0) {
		return 'A';
	}
	if (e_leader_lost && f_lost_count < e_lost_count) {
		return 'B';
	}
//	$guess_debug_log = (rate >= 2.49 && rate <= 2.51) // B/C判定閾値検証.
//				|| (f_damage_total != 0 && f_damage_percent == 0) // 自ダメージ 1%未満時.
//				|| (e_damage_total != 0 && e_damage_percent == 0) // 敵ダメージ 1%未満時.
//				;
	if (rate > 2.5) { // 確定. rate == 2.5 でC判定を確認済み.
		return 'B';
	}
	$guess_debug_log = (rate >= 0.8864 && rate <= 0.9038) // C/D判定閾値検証.
//				|| (f_damage_total != 0 && f_damage_percent == 0) // 自ダメージ 1%未満時.
//				|| (e_damage_total != 0 && e_damage_percent == 0) // 敵ダメージ 1%未満時.
				;
	if (rate > 0.9) { // 要検証!!! r == 0.9038 でC判定を確認. rate == 0.8864 でD判定を確認済み. 0.8864～0.9038 の区間に閾値がある.
		return 'C';
	}
	if (f_lost_count < f_count/2) { // 要検証.
		return 'D';
	}
	return 'E';
}

function on_battle(json, battle_api_name) {
	var d = json.api_data;
	if (!d.api_maxhps || !d.api_nowhps) return;
	var maxhps = d.api_maxhps;				// 出撃艦隊[1..6] 敵艦隊[7..12]
	var nowhps = d.api_nowhps;				// 出撃艦隊[1..6] 敵艦隊[7..12]
	var maxhps_c = d.api_maxhps_combined;	// 連合第二艦隊[1..6].
	var nowhps_c = d.api_nowhps_combined;	// 連合第二艦隊[1..6].
	var beginhps = nowhps.concat();
	var beginhps_c = nowhps_c ? nowhps_c.concat() : [];
	var result = {
		seiku : null, 				// 制空権.
		touch : null,				// 触接.
		f_air_lostcount : 0,		// 非撃墜数.
		detail : []					// 戦闘詳報.
	};
	$maxhps = maxhps;
	$maxhps_c = maxhps_c;
	if (d.api_escape_idx) {
		d.api_escape_idx.forEach(function(idx) {
			maxhps[idx] = -1;	// 護衛退避した艦を艦隊リストから抜く. idx=1..6
		});
	}
	if (d.api_escape_idx_combined) {
		d.api_escape_idx_combined.forEach(function(idx) {
			maxhps_c[idx] = -1;	// 護衛退避した艦を第二艦隊リストから抜く. idx=1..6
		});
	}
	if (d.api_touch_plane) {
		// 触接(夜戦).
		result.touch = d.api_touch_plane;
		var t0 = d.api_touch_plane[0]; if (t0 != -1) result.detail.push({ty:'触接(夜戦)',  si:[t0]});
		var t1 = d.api_touch_plane[1]; if (t1 != -1) result.detail.push({ty:'被触接(夜戦)', si:[t1]});
	}
	if (d.api_flare_pos) {
		// 照明弾発射(夜戦).
		var t0 = d.api_flare_pos[0]; if (t0 != -1) result.detail.push({ty:'照明弾(夜戦)', at: nowhps_c ? t0+20 : t0});
		var t1 = d.api_flare_pos[1]; if (t1 != -1) result.detail.push({ty:'敵照明弾(夜戦)', at:t1+6});
	}
	calc_kouku_damage(result, nowhps, d.api_kouku, nowhps_c); // 航空戦.
	calc_kouku_damage(result, nowhps, d.api_kouku2, nowhps_c); // 航空戦第二波.
	var ds = d.api_support_info;
	if (ds) {
		if (ds.api_support_airatack) ds.api_support_airattack = ds.api_support_airatack; // 綴り訂正.
		if (d.api_support_flag == 1) calc_damage(result, nowhps, ds.api_support_airattack.api_stage3); // 1:航空支援.
		if (d.api_support_flag == 2) calc_damage(result, nowhps, ds.api_support_hourai); // 2:支援射撃
		if (d.api_support_flag == 3) calc_damage(result, nowhps, ds.api_support_hourai); // 3:支援長距離雷撃.
	}
	calc_damage(result, nowhps, d.api_opening_atack, nowhps_c);	// 開幕雷撃.
	calc_damage(result, nowhps, d.api_hougeki, nowhps_c);	// midnight
	switch (nowhps_c ? $combined_flag : 0) {
	default:// 不明.
	case 0: // 通常艦隊.
		calc_damage(result, nowhps, d.api_hougeki1);	// 第一艦隊砲撃一巡目.
		calc_damage(result, nowhps, d.api_hougeki2);	// 第一艦隊砲撃二巡目.
		calc_damage(result, nowhps, d.api_raigeki);		// 第一艦隊雷撃戦.
		break;
	case 1: // 連合艦隊(機動部隊).
	case 3: // 連合艦隊(輸送護衛部隊).
		calc_damage(result, nowhps, d.api_hougeki1, nowhps_c);	// 第二艦隊砲撃.
		calc_damage(result, nowhps, d.api_raigeki, nowhps_c);	// 第二艦隊雷撃戦.
		calc_damage(result, nowhps, d.api_hougeki2);	// 第一艦隊砲撃一巡目.
		calc_damage(result, nowhps, d.api_hougeki3);	// 第一艦隊砲撃二巡目.
		break;
	case 2: // 連合艦隊(水上部隊).
		calc_damage(result, nowhps, d.api_hougeki1);	// 第一艦隊砲撃一巡目.
		calc_damage(result, nowhps, d.api_hougeki2);	// 第一艦隊砲撃二順目.
		calc_damage(result, nowhps, d.api_hougeki3, nowhps_c);	// 第二艦隊砲撃.
		calc_damage(result, nowhps, d.api_raigeki, nowhps_c);	// 第二艦隊雷撃戦.
		break;
	}
	if (!d.api_deck_id) d.api_deck_id = d.api_dock_id; // battleのデータは、綴りミスがあるので補正する.
	var fdeck = $fdeck_list[$battle_deck_id = d.api_deck_id];
	var fmt = null;		var rg = new RegExp('/','g');
	if (d.api_formation) {
		fmt = formation_name(d.api_formation[0])
			+ '/' + match_name(d.api_formation[2])
			+ '/敵' + formation_name(d.api_formation[1]);
		if (d.api_support_flag) fmt += '+' + support_name(d.api_support_flag);
		$battle_info = fmt;
		$enemy_formation = formation_name(d.api_formation[1]);
		fmt = fmt.replace(rg,' / ');	fmt = fmt.replace('+',' + ');		fmt = fmt.replace('敵','敵 ');
	}
	if (!fdeck) return; // for debug.
	var req = [];		var tp = dpnla.tmpget('tp4_1');		var mp_nm = $next_enemy;
	var b_name  =   ($next_mapinfo ? $next_mapinfo.api_name : '') + ' battle' + $battle_count;
	if(/^演習/.test($next_enemy)){
		mp_nm = '演　習';		b_name = $next_enemy;
	}
	dpnla.tmpviw(0,'c42',mp_nm);
	if (fmt) req.push(fmt);
	if (d.api_search) {
		req.push('索敵：' + search_name(d.api_search[0])); // d.api_search[1] は敵索敵か??
	}
	if (result.touch) {
		var t0 = result.touch[0]; if (t0 != -1) req.push('触接中：' + slotitem_name(t0));
		var t1 = result.touch[1]; if (t1 != -1) req.push('被触接中：' + slotitem_name(t1));
	}
	var s = '';
	if (result.seiku != null) {
		    s = seiku_name(result.seiku);

		$battle_info += '/' + s;	s = ' 【 '+ s +' 】';
	}
	req.push('被撃墜数：'+ result.f_air_lostcount + s);
	if ($beginhps) {
		req.push('緒戦被害：'+ $guess_info_str + '，推定：'+ $guess_win_rank);
		$battle_info += '/追撃';
	}
	if (!$beginhps) $beginhps = beginhps;
	if (!$beginhps_c) $beginhps_c = beginhps_c;
	$guess_win_rank = guess_win_rank(nowhps, maxhps, $beginhps, nowhps_c, maxhps_c, $beginhps_c, $beginhps != beginhps, battle_api_name);
	req.push('戦闘被害：'+ $guess_info_str);
	req.push('勝敗推定：'+ $guess_win_rank);
	var ra = ['','','','','',''];		var ha = '';	var tb = dpnla.tmpget('tp4_2');
	function ship_name_lv(idx) {
		if (idx > 20) {
			idx -= 20; return $ship_list[$fdeck_list[2].api_ship[idx-1]].fleet_name_lv(1); // 連合第二艦隊.
		}
		else if (idx > 6) {
			idx -= 6; return '<span class="label label-default ts10">'+ idx +'</span> '+ ship_name(d.api_ship_ke[idx]) +' Lv' + d.api_ship_lv[idx]; // 敵艦隊.
		}
		else if (idx >= 1) {
			return $ship_list[fdeck.api_ship[idx-1]].fleet_name_lv(1); // 味方艦隊.
		}
		else // NaN, undefined, null
			return '';
	}
	if (result.detail.length) {
		var rb = [0,''];	var tc = '';
		for (var i = 0; i < result.detail.length; ++i) {
			var dt = result.detail[i];
			rb = slotitem_names(dt.si);	ra = [dt.ty,ship_name_lv(dt.at),ship_name_lv(dt.target),'','',rb[1],''];
			if (dt.damage && dt.target) ra[6]      =       damage_name(dt.hp, (dt.target >= 20 ? maxhps_c[dt.target-20] : maxhps[dt.target]));
			tc = tb[1];
			if(dt.ek || dt.fk){	// 敵撃墜率、被撃墜率.
				if(dt.ek) ra[3] = dt.ek;
				if(dt.fk) ra[4] = dt.fk;
			}else{	// 命中判定、ダメージ.
				if(dt.cl) ra[3] = dt.cl;
				if(dt.damage) ra[4] = dt.damage;
			}
			if(ra[1] == '' && ra[2] == '' && ra[3] == '' && ra[4] == ''){
				tc = tb[2];
			}else if(ra[1] == '' && ra[2] == ''){
				tc = tb[3];
			}else if(rb[0] == 0){
				tc = tb[4];
			}else if(rb[0] == 1){
				// if(dpnla.getmbstrlen(rb[1]) < 17) tc = tb[5];
				tc = tb[5];
			}else if(ra[2] == ''){
				tc = tb[6];
			}
			ha += dpnla.tmprep(2,ra,tc);
		}
		ha = tb[0] + ha + tb[7];
	}
	dpnla.tmpviw(0,'t41_2_a',ha);
	push_fdeck_status(0, fdeck, maxhps, nowhps, beginhps);
	if (nowhps_c) {

		push_fdeck_status(1, $fdeck_list[2], maxhps_c, nowhps_c, beginhps_c); // 連合第二艦隊は二番固定です.
	}
	ra = ['','','','','',''];		ha = '';
	$enemy_ship_names = [];
	for (var i = 1; i <= 6; ++i) {
		var ke = d.api_ship_ke[i];
		if (ke == -1) continue;
		var nowhp = nowhps[i+6];	var maxhp = maxhps[i+6];
		ra[0] = i;	ra[1] = ship_name(ke);	ra[2] = d.api_ship_lv[i];
		ra[3] = (nowhp < 0 ? 0 : nowhp) +'/'+ maxhp;	ra[4] = diff_name(nowhp, beginhps[i+6]);
		ra[5] = damage_name(nowhp, maxhp);	ha += dpnla.tmprep(2,ra,tp[1]);
		var name = ra[1] +'Lv'+ ra[2];	$enemy_ship_names.push(name);
	}
	ra[0] = '&nbsp;';		ra[1] = ' mb3';		ra[2] = 'c46';
	ha = tp[0] + ha + tp[2];	dpnla.tmpviw(0,'c45',dpnla.tmprep(2,ra,ha));
	ra = request_date_time();		ra.push(dpnla.kcpstimeview());
	dpnla.tmpviw(0,'c47',dpnla.tmprep(2,ra,tp[10]));
	var hb = req.join('<br />');	rg = new RegExp('f_damage:','g');		hb = hb.replace(rg,'味方:');
	rg = new RegExp('e_damage:','g');		hb = hb.replace(rg,'敵:') +'<br />';
	ra = [b_name,'c43',hb];		dpnla.tmpviw(0,'t41_1',dpnla.tmprep(2,ra,tp[11]));
}

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	var func = null;
	var api_name = request.request.url.replace(/^http:\/\/[^\/]+\/kcsapi\//, '/');
	if (api_name == request.request.url) {
		// 置換失敗. api以外なので早抜けする.
		return;
	}
	// 時刻を得る.
	$svDateTime = $pcDateTime = request.startedDateTime;	// PC側の日時(POST).
	var h = request.response.headers;
	if (h && h[0].name == 'Date') {
		$svDateTime = new Date(h[0].value);		// サーバ側の日時(RESP).
	}
	// API解析.
	if (api_name == '/api_start2') {
		// ゲーム開始時点.
		func = function(json) { // 艦種表を取り込む.
			update_mst_ship(json.api_data.api_mst_ship);
			update_mst_slotitem(json.api_data.api_mst_slotitem);
			update_mst_useitem(json.api_data.api_mst_useitem);
			update_mst_mission(json.api_data.api_mst_mission);
			update_mst_mapinfo(json.api_data.api_mst_mapinfo);
			sync_cloud();
			var tp = dpnla.tmpget('tp0_4');
			var ht = tp[6] + dpnla.tmprep(0,' ゲーム情報の取得に成功しました',tp[0]) + tp[7];
			dpnla.tmpviw(0,'t11_1',ht);		dpnla.kcpstimeinit();
		};
	}
	else if (api_name == '/api_get_member/require_info') { // 2016.4 メンテで追加された.
		// ログイン直後の一覧表更新.
		func = function(json) { // 装備リストと建造リストを更新する.
			var prev = $slotitem_list;
			$slotitem_list = {};
			add_slotitem_list(json.api_data.api_slot_item, prev);
			save_storage('slotitem_list', $slotitem_list);
			update_kdock_list(json.api_data.api_kdock);
		};
	}
	else if (api_name == '/api_get_member/slot_item') {
		// 保有装備一覧表.
		func = function(json) { // 保有する装備配列をリストに記録する.
			var prev = $slotitem_list;
			$slotitem_list = {};
			add_slotitem_list(json.api_data, prev);
			save_storage('slotitem_list', $slotitem_list);
			if ($do_print_port_on_slot_item) {
				$do_print_port_on_slot_item = false;
				print_port();
			}
		};
	}
	else if (api_name == '/api_get_member/kdock') {
		// 建造一覧表(建造直後).
		func = function(json) { // 建造状況を更新する.
			update_kdock_list(json.api_data);
		};
	}
	else if (api_name == '/api_req_kousyou/createship') {
		// 艦娘建造.
		$material_sum = $material.createship;	// 消費資材は後続の /api_get_member/material パケットにて集計する.
		// 直後に /api_get_member/kdock と /api_get_member/material パケットが来るので print_port() は不要.
	}
	else if (api_name == '/api_req_kaisou/remodeling') {
		// 艦娘改造.
		$material_sum = $material.createship;	// 消費資材は後続の /api_get_member/material パケットにて集計する. 従来は$mst_ship[]から消費資材を得ていたが、翔鶴改二／改二甲の相互改造における開発資材(歯車)消費値が取れないので方法を変えた.
		// 直後に /api_get_member/ship3, /api_get_member/slot_item, /api_get_member/material パケットが来るので print_port() は不要.
	}
	else if (api_name == '/api_req_kousyou/createitem') {
		// 装備開発.
		var params = decode_postdata_params(request.request.postData.params); // 送信した消費資材値を抜き出す.
		$material.createitem[0] -= params.api_item1;
		$material.createitem[1] -= params.api_item2;
		$material.createitem[2] -= params.api_item3;
		$material.createitem[3] -= params.api_item4;
		func = function(json) { // 開発成功した装備をリストに加える.
			var d = json.api_data;
			if (d.api_create_flag) {
				$material.createitem[6]--;	// 開発資材(歯車).
				add_slotitem_list(d.api_slot_item);
			}
			update_material(d.api_material);
			print_port();
		};
	}
	else if (api_name == '/api_req_kousyou/getship') {
		// 新艦建造成功.
		func = function(json) { // 建造艦が持つ初期装備配列を、リストに加える.
			update_kdock_list(json.api_data.api_kdock);
			delta_update_ship_list([json.api_data.api_ship]);
			add_slotitem_list(json.api_data.api_slotitem);
			print_port();
		};
	}
	else if (api_name == '/api_req_kousyou/destroyitem2') {
		// 装備破棄.
		func = function(json) {
			var ids = decode_postdata_params(request.request.postData.params).api_slotitem_ids;
			if (ids) slotitem_delete(/%2C/.test(ids) ? ids.split('%2C') : [ids]);		// 破棄した装備を、リストから抜く.
			diff_update_material(json.api_data.api_get_material, $material.destroyitem);	// 装備破棄による資材増加を記録する.
			print_port();
		};
	}
	else if (api_name == '/api_req_kousyou/destroyship') {
		// 艦娘解体.
		func = function(json) {
			var id = decode_postdata_params(request.request.postData.params).api_ship_id;
			if (id) ship_delete([id]);		// 解体した艦娘が持つ装備を、リストから抜く.
			update_material(json.api_data.api_material, $material.destroyship); /// 解体による資材増加を記録する.
			print_port();
		};
	}
	else if (api_name == '/api_req_kaisou/powerup') {
		// 近代化改修.
		var ids = decode_postdata_params(request.request.postData.params).api_id_items;
		if (ids) ship_delete(/%2C/.test(ids) ? ids.split('%2C') : [ids]);		// 素材として使った艦娘が持つ装備を、リストから抜く.
		func = function(json) {
			var d = json.api_data;
			if (d.api_ship) delta_update_ship_list([d.api_ship]);
			if (d.api_deck) update_fdeck_list(d.api_deck);
			print_port();
		}
	}
	else if (api_name == '/api_req_kousyou/remodel_slot') {
		// 装備改修.
		func = function(json) {	// 明石の改修工廠で改修した装備をリストに反映する.
			var d = json.api_data;
			add_slotitem_list(d.api_after_slot);	// 装備リストを更新する.
			slotitem_delete(d.api_use_slot_id);		// 改修で消費した装備を装備リストから抜く.
			update_material(d.api_after_material, $material.remodelslot);	/// 改修による資材消費を記録する.
			print_port();
		};
	}
	else if (api_name == '/api_req_kaisou/lock') {
		// 装備ロック.
		func = function(json) {
			var id = decode_postdata_params(request.request.postData.params).api_slotitem_id;	// ロック変更した装備ID.
			$slotitem_list[id].locked = json.api_data.api_locked;
			print_port();
		};
	}
	else if (api_name == '/api_req_hensei/preset_select') {
		// 編成展開.
		func = function(json) {
			var id = decode_postdata_params(request.request.postData.params).api_deck_id;	// 艦隊番号.
			var deck = json.api_data;
			$fdeck_list[id] = deck;
			update_fdeck_list($fdeck_list); // 編成結果を $ship_fdeck に反映する.
			print_port();
		};
	}
	else if (api_name == '/api_req_hensei/change') {
		// 艦隊編成.
		var params = decode_postdata_params(request.request.postData.params);
		var list = $fdeck_list[params.api_id].api_ship;	// 変更艦隊リスト.
		var id  = params.api_ship_id;		// -2:一括解除, -1:解除, 他:艦娘ID.
		var idx = params.api_ship_idx;		// -1:一括解除, 0..N:変更位置.
		if (id == -2) {
			// 旗艦以外の艦を外す(-1を設定する).
			for (var i = 1; i < list.length; ++i) list[i] = -1;
		}
		else if (id == -1) {
			// 外す.
			list.splice(idx, 1);
			list.push(-1);
		}
		else { // id = 0..N
			find: for (var f_id in $fdeck_list) {
				// 艦娘IDの元の所属位置を old_list[old_idx] に得る.
				var old_list = $fdeck_list[f_id].api_ship;
				for (var old_idx = 0; old_idx < old_list.length; ++old_idx) {
					if (old_list[old_idx] == id) break find;
				}
			}
			if (old_list[old_idx] == id) {
				// 位置交換.
				old_list[old_idx] = list[idx];
				list[idx] = id;
				// 元位置が空席になったら前詰めする.
				if (old_list[old_idx] == -1) {
					old_list.splice(old_idx, 1);
					old_list.push(-1);
				}
			}
			else {
				// 新規追加.
				list[idx] = id;
			}
		}
		update_fdeck_list($fdeck_list); // 編成結果を $ship_fdeck に反映する.
		print_port();
	}
	else if (api_name == '/api_get_member/questlist') {
		// 任務一覧.
		func = function(json) { // 任務総数と任務リストを記録する.
			var list = json.api_data.api_list;
			$quest_count = json.api_data.api_count;
			$quest_exec_count = json.api_data.api_exec_count;
			if (json.api_data.api_disp_page == 1 && $quest_count != Object.keys($quest_list).length) {
				$quest_list = {}; // 任務総数が変わったらリストをクリアする.
			}
			if (list) list.forEach(function(data) {
				if (data == -1) return; // 最終ページには埋草で-1 が入っているので除外する.
				$quest_list[data.api_no] = data;
				if (data.api_no == 214) {
					get_weekly().quest_state = data.api_state; // あ号任務ならば、遂行状態を記録する(1:未遂行, 2:遂行中, 3:達成)
				}
			});
			print_port();
		};
	}
	else if (api_name == '/api_req_hokyu/charge') {
		// 補給実施.
		func = function(json) { // 補給による資材消費を記録する.
			var d = json.api_data;
			for (var i = 0; i < d.api_ship.length; ++i) {
				var data = d.api_ship[i];
				var ship = $ship_list[data.api_id];
				if (ship) ship.charge(data);
			}
			var now_baux = d.api_material[3];
			if (d.api_use_bou) $material.charge[3] -= $material.now[3] - now_baux;
			update_material(d.api_material);
			print_port();
		};
	}
	else if (api_name == '/api_req_quest/clearitemget') {
		// 任務クリア.
		var params = decode_postdata_params(request.request.postData.params);
		delete $quest_list[params.api_quest_id]; // 任務リストから外す.
		$quest_exec_count--;
		$quest_count--;
		func = function(json) { // 任務報酬を記録する.
			var d = json.api_data;
			for (var i = 0; i < d.api_material.length; ++i) {
				$material.quest[i] += d.api_material[i];
			}
			for (var i = 0; i < d.api_bounus.length; ++i) {
				var n  = d.api_bounus[i].api_count;
				var id = d.api_bounus[i].api_item.api_id;
				if (id >= 1 && id <= 8) $material.quest[id-1] += n;
			}
			// 直後に /api_get_member/material パケットが来るので print_port() は不要.
		};
	}
	else if (api_name == '/api_get_member/material') {
		// 建造後、任務クリア後など.
		func = function(json) { // 資材変化を記録する.
			update_material(json.api_data, $material_sum);
			$material_sum = null;
			print_port();
		};
	}
	else if (api_name == '/api_get_member/ndock') {
		// 入渠.
		func = function(json) { // 入渠状況を更新する.
			update_ndock_complete();
			update_ndock_list(json.api_data);
			if ($do_print_port_on_ndock) {
				$do_print_port_on_ndock = false;
				print_port();
			}
			else {
				on_mission_check(5);
			}
		};
	}
	else if (api_name == '/api_req_nyukyo/start') {
		// 入渠実施.
		var params = decode_postdata_params(request.request.postData.params);
		var ship = $ship_list[params.api_ship_id];
		var now = $material.now.concat();
		now[0] -= ship.ndock_item[0];	// 燃料.
		now[2] -= ship.ndock_item[1];	// 鋼材.
		now[5] -= params.api_highspeed;	// 高速修復材(バケツ). "0" or "1".
		update_material(now, $material.ndock);
		if (params.api_highspeed != 0) {
			ship.highspeed_repair();	// 母港パケットで一斉更新されるまで対象艦の修復完了が反映されないので、自前で反映する.
			print_port();	// 高速修復を使った場合は /api_get_member/ndock パケットが来ないので、ここで print_port() を行う.
		}
		else {
			$do_print_port_on_ndock = true; // 直後に来る /api_get_member/ndock パケットで print_port() を行う.
		}
	}
	else if (api_name == '/api_req_nyukyo/speedchange') {
		// 入渠中の高速修復実施.
		var params = decode_postdata_params(request.request.postData.params);
		for (var ship_id in $ndock_list) {
			if ($ndock_list[ship_id].api_id == params.api_ndock_id) {
				$ship_list[ship_id].highspeed_repair(); break;	// 母港パケットで一斉更新されるまで対象艦の修復完了が反映されないので、自前で反映する.
			}
		}
		var now = $material.now.concat();
		--now[5];	// 高速修復材(バケツ).
		update_material(now, $material.ndock);
		print_port();
	}
	else if (api_name == '/api_req_kousyou/createship_speedchange') {
		// 建造中の高速建造実施.
		var params = decode_postdata_params(request.request.postData.params);
		var k = $kdock_list[params.api_kdock_id];
		if (k) k.api_state = 3; // 完成に変更する.
		var now = $material.now.concat();
		now[4] -= (k.api_item1 >= 1500 ? 10 : 1);	// 高速建造材(バーナー).
		update_material(now, $material.createship);
		print_port();
	}
	else if (api_name == '/api_port/port') {
		// 母港帰還.
		func = function(json) { // 保有艦、艦隊一覧を更新してcond表示する.
			update_ship_list(json.api_data.api_ship);
			update_fdeck_list(json.api_data.api_deck_port);
			update_ndock_list(json.api_data.api_ndock);
			$ship_escape = {};
			$combined_flag = json.api_data.api_combined_flag;	// 連合艦隊編成有無.
			update_material(json.api_data.api_material, $material.autosupply);	// 資材を更新する. 差分を自然増加として記録する.
			var basic = json.api_data.api_basic;
			$max_ship     = basic.api_max_chara;
			$max_slotitem = basic.api_max_slotitem + 3;
			if ($battle_deck_id > 0) {
				var btlg = '前回出撃：' + $battle_log.join(' <i class="icon-arrow-right"></i>');
				$last_mission[$battle_deck_id] = btlg;
				if($combined_flag && $battle_deck_id == 1) $last_mission[2] = btlg;
				$battle_deck_id = -1;
				$do_print_port_on_slot_item = true;	// 戦闘直後の母港帰還時は、後続する slot_item で艦載機の熟練度が更新されるまで print_port() を遅延する.
			}
			else {
				print_port();
			}
		};
	}
	else if (api_name == '/api_get_member/ship_deck') {
		// 進撃. 2015-5-18メンテにて、ship2が廃止されて置き換わった.
		func = function(json) { // 保有艦、艦隊一覧を更新してcond表示する.
			delta_update_ship_list(json.api_data.api_ship_data);
			delta_update_fdeck_list(json.api_data.api_deck_data);
			print_port();
		};
	}
	else if (api_name == '/api_get_member/ship2') {
		// 間宮、伊良湖使用.
		func = function(json) { // 保有艦、艦隊一覧を更新してcond表示する.
			update_ship_list(json.api_data);
			update_fdeck_list(json.api_data_deck);
			print_port();
		};
	}
	else if (api_name == '/api_get_member/ship3') {
		// 装備換装、艦娘改造.
		func = function(json) { // 保有艦、艦隊一覧を更新してcond表示する.
			if (decode_postdata_params(request.request.postData.params).api_shipid)
				delta_update_ship_list(json.api_data.api_ship_data); // 装備解除時は差分のみ.
			else
				update_ship_list(json.api_data.api_ship_data);
			update_fdeck_list(json.api_data.api_deck_data);
			print_port();
		};
	}
	else if (api_name == '/api_get_member/mission') {
		// 遠征メニュー.
		func = function(json) { // 遠征任務の受諾をチェックする.
			on_mission_check(4);
		};
	}
	else if (api_name == '/api_get_member/deck') {
		// 遠征出発.
		func = function(json) { // 艦隊一覧を更新してcond表示する.
			update_fdeck_list(json.api_data);
			print_port();
		};
	}
	else if (api_name == '/api_req_mission/result') {
		// 遠征結果.
		func = function(json) { // 成功状況を記録する.
			var d = json.api_data;
			var id = decode_postdata_params(request.request.postData.params).api_deck_id;
			$last_mission[id] = '前回遠征：' + d.api_quest_name + ' ' + mission_clear_name(d.api_clear_result);
			for (var i = 0; i < d.api_get_material.length; ++i) { // i=0..3 燃料からボーキーまで.
				$material.mission[i]    += d.api_get_material[i];
				$material.autosupply[i] -= d.api_get_material[i];	// 後続の /api_port/port にて自然増加に誤算入される分を補正する.
			}
			var add_mission_item = function(flag, get_item) {
				var id = 0;
				switch (flag) {
				case 1: id = 6; break; // バケツ.
				case 2: id = 5; break; // バーナー.
				case 3: id = 7; break; // 歯車.
				case 4: id = get_item.api_useitem_id; break; // その他のアイテム.
				}
				if (id >= 1 && id <= 8 && get_item) {
					$material.mission[id-1]    += get_item.api_useitem_count;
					$material.autosupply[id-1] -= get_item.api_useitem_count;	// 後続の /api_port/port にて自然増加に誤算入される分を補正する.
				}
			};
			add_mission_item(d.api_useitem_flag[0], d.api_get_item1);
			add_mission_item(d.api_useitem_flag[1], d.api_get_item2);
			// 直後に /api_port/port パケットが来るので print_port() は不要.
		};
	}
	else if (api_name == '/api_get_member/practice') {
		// 演習メニュー.
		func = function(json) { // 演習任務の受諾をチェックする.
			on_mission_check(3);
		};
	}
	else if (api_name == '/api_req_member/get_practice_enemyinfo') {
		// 演習相手の情報.
		func = function(json) { // 演習相手の提督名を記憶する.
			$next_enemy = "演習相手："+ json.api_data.api_nickname;
			$next_mapinfo = { api_name : "演習" };
		};
	}
	else if (api_name == '/api_get_member/mapinfo') {
		// 海域選択メニュー.
		func = function(json) { // 海域情報を記録する.
			$mapinfo_rank = {};
			json.api_data.forEach(function(data) {
				if (data.api_eventmap)
					$mapinfo_rank[data.api_id] = data.api_eventmap.api_selected_rank;
			});
		};
	}
	else if (api_name == '/api_req_map/select_eventmap_rank') {
		// 海域難易度の初回選択／変更.
		var params = decode_postdata_params(request.request.postData.params);
		$mapinfo_rank[params.api_maparea_id * 10 + params.api_map_no] = params.api_rank;	// 1:丙, 2:乙, 3:甲.
	}
	else if (api_name == '/api_req_map/start') {
		// 海域初戦陣形選択.
		// 出撃パケットの流れ：
		//	mapinfo -> mapcell -> start -> 陣形選択 -> battle -> battle_result -> 進撃/撤退/帰還
		//	[進撃] ship_deck -> next -> 陣形選択 -> battle -> battle_result -> 進撃/撤退/帰還
		//	[撤退/帰還] port -> slot_item -> unsetslot -> useitem
		var params = decode_postdata_params(request.request.postData.params);
		$battle_deck_id = params.api_deck_id;
		$battle_count = 0;
		$battle_log = [];		dpnla.tab14init('出撃');
		$is_boss = false;
		func = on_next_cell;
	}
	else if (api_name == '/api_req_map/next') {
		// 海域次戦陣形選択.
		func = on_next_cell;
	}
	else if (api_name == '/api_req_sortie/battle'
		|| api_name == '/api_req_sortie/airbattle'
		|| api_name == '/api_req_sortie/ld_airbattle'
		|| api_name == '/api_req_combined_battle/battle'
		|| api_name == '/api_req_combined_battle/battle_water'
		|| api_name == '/api_req_combined_battle/airbattle'
		|| api_name == '/api_req_combined_battle/ld_airbattle') {
		// 昼戦開始.
		$battle_count++;
		$beginhps = null;
		$beginhps_c = null;
		func = on_battle;
	}
	else if (api_name == '/api_req_battle_midnight/battle'
		|| api_name == '/api_req_combined_battle/midnight_battle') {
		// 昼戦→夜戦追撃.
		func = on_battle;
	}
	else if (api_name == '/api_req_battle_midnight/sp_midnight'
		|| api_name == '/api_req_combined_battle/sp_midnight') {
		// 夜戦開始.
		$battle_count++;
		$beginhps = null;
		$beginhps_c = null;
		func = on_battle;
	}
	else if (api_name == '/api_req_sortie/night_to_day') {
		// 夜戦→昼戦追撃.
		func = on_battle;
	}
	else if (api_name == '/api_req_practice/battle') {
		// 演習開始.
		$battle_count = 1;
		$beginhps = null;
		$beginhps_c = null;
		$battle_log = [];		dpnla.tab14init('');
		func = on_battle;
	}
	else if (api_name == '/api_req_practice/midnight_battle') {
		// 夜演習継続.
		func = on_battle;
	}
	else if (api_name == '/api_req_sortie/battleresult'
		|| api_name == '/api_req_combined_battle/battleresult') {
		// 戦闘結果.
		func = function(json) {
			on_battle_result(json);
			var r = json.api_data.api_win_rank;
			var w = get_weekly();
			if (w.quest_state != 2) return; // 遂行中以外は更新しない.
			if ($battle_count == 1) { // 出撃数.
				w.sortie++;
				w.savetime = 0;
			}
			if (r == 'S') { // S勝利数.
				w.win_S++;
				w.savetime = 0;
			}
			if ($is_boss) { // ボス到達数、ボス勝利数.
				w.boss_cell++;
				if (r == 'S' || r == 'A' || r == 'B') w.win_boss++;
				w.savetime = 0;
			}
			if (w.savetime == 0) { save_weekly(); } // 更新があれば再保存する.
		};
	}
	else if (api_name == '/api_req_practice/battle_result') {
		// 演習結果.
		func = on_battle_result;
	}
	else if (api_name == '/api_req_combined_battle/goback_port') {
		// 護衛退避.
		on_goback_port();
	}
	if (!func) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^svdata=/, ''));
		if (!json || !json.api_data) return;
		func(json, api_name);
	});
});

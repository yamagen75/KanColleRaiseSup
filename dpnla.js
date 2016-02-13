/* ユーティリティ等 */
if(typeof(dpnla) == 'undefined'){
var dpnla = {
	dat: new Array(),	// データ保存用
	init: function(){
	/* 初期化 */
		this.tabinit(0,'t01');	this.tabinit(0,'t11');	this.tabinit(2,'t31');	this.tabinit(2,'t41');
		this.tabinit(0,'t51');	this.tabinit(0,'t56');	this.tabinit(2,'t52');
		this.dat['pmbcloserunproc'] = null;		this.matupdinit();
		this.addevent(this.ge('pmb02'),'click',function(){ dpnla.pmbclose(); });
		this.addevent(this.ge('b563c'),'click',function(){ dpnla.kcprecls(); });
	},
	tabinit: function(pt,id){
	/* タブ初期化
	 * 動作フラグ加算値(1の場合、左の値を加算する)
	 * 1:ページの(←)マイナス(→)プラス…0)なし、1)あり
	 * 2:２ヶ所の画面切替が…0)なし、1)あり
	 */
		var i = 0;	var j = 1;	var fg = new Array();
		for(i = 0;i < 2;i++){
			if(i > 0) j = Math.pow(2,i);
			fg[i] = pt & j;
		}
		this.dat[id +'_fg'] = fg;
		var ky = id +'_ns';		var ns = this.dat[ky];
		if(ns == undefined) this.dat[ky] = 0;
		var tb = this.getn(this.ge(id),'li');
		this.dat[id +'_li'] = tb;		var mx = tb.length;
		for(i = 0;i < mx;i++){
			j = i + 1;	ky = id +'_'+ j;
			if(i > 0) this.tabdyset(ky,'none',fg);
			this.addevent(tb[i],'click',function(e){ dpnla.tabclik(e); return dpnla.evtcancel(e); });
		}
		if(fg[0] > 0) mx -= 2;
		this.dat[id +'_mx'] = mx;
	},
	tabclik: function(e){
	/* タブクリック */
		var em = e.target;
		while(em.tagName.toLowerCase() != 'li'){
			em = em.parentNode;
		}
		var ep = em.parentNode;		var id = ep.id;
		var fg = this.dat[id +'_fg'];		var po = 0;
		var tb = this.dat[id +'_li'];		var tm = tb.length - 1;
		for(i = 0;i <= tm;i++){
			if(tb[i] == em){
				po = i;		break;
			}
		}
		var pa = this.posget(id);		var mx = pa[0];		var ns = pa[1];
		if(fg[0] > 0){
			if(po == 0){
				po = ns - 1;
				if(po < 0) po = 0;
			}else if(po == tm){
				po = ns + 1;
				if(po >= mx) po = mx - 1;
			}else{
				po--;
			}
		}
		this.tabsel(id,po);
	},
	evtcancel: function(e){
	/* イベントのキャンセル */
		if(!e) return false;
		e.stopPropagation();	e.preventDefault();
		return false;
	},
	tabsel: function(id,po){
	/* タブ選択 */
		var fg = this.dat[id +'_fg'];		var i = 0;	var j = 0;	var ky = '';
		var tb = this.dat[id +'_li'];		var tm = tb.length - 1;
		if(fg[0] > 0){
			j = po + 1;
			if(tb[j].className != 'active'){
				for(i = 1;i < tm;i++){
					tb[i].className = '';
					ky = id +'_'+ i;	this.tabdyset(ky,'none',fg);
				}
				tb[j].className = 'active';
				ky = id +'_'+ j;	this.tabdyset(ky,'block',fg);
			}
		}else{
			if(tb[po].className != 'active'){
				for(i = 0;i <= tm;i++){
					tb[i].className = '';
					j = i + 1;	ky = id +'_'+ j;	this.tabdyset(ky,'none',fg);
				}
				tb[po].className = 'active';
				j = po + 1;		ky = id +'_'+ j;	this.tabdyset(ky,'block',fg);
			}
		}
		this.dat[id +'_ns'] = po;
	},
	tabdyset: function(ky,vl,fg){
	/* タブ本体状態設定 */
		var oa = this.ge(ky);
		if(oa != undefined) oa.style.display = vl;
		if(fg[1] > 0){
			ky += '_a';		oa = this.ge(ky);
			if(oa != undefined) oa.style.display = vl;
		}
	},
	tabdef: function(id){
	/* タブ記憶選択 */
		var po = this.defget(id);
		this.tabsel(id,po);
	},
	defget: function(id){
	/* 選択記憶取得 */
		var pa = this.posget(id);
		var mx = pa[0];		var po = pa[1];
		if(po >= mx) po = mx - 1;
		return po;
	},
	posget: function(id){
	/* 選択記憶＆最大取得 */
		var pa = new Array();
		var ky = id +'_mx';		pa[0] = this.dat[ky];
				ky = id +'_ns';		pa[1] = this.dat[ky];
		return pa;
	},
	tmpget: function(id){
	/* テンプレート取得 */
		var ob = this.ge(id);		var tp = '';	var dm = '<!--_%DLIMT%_-->';
		if(ob != undefined) tp = ob.innerHTML;
		tp += dm;
		return tp.split(dm);
	},
	tmprep: function(pt,ra,tp){
	/* テンプレート置換
	 * 動作フラグ加算値(1の場合、左の値を加算する)
	 * 1:置換文字列の個数…0)1個、1)複数個
	 * 2:文字列か配列か…0)文字列、1)配列
	 * 4:配列の次元数…0)一次元、1)二次元
	 */
		var i = 0;	var j = 1;	var fg = new Array();
		for(i = 0;i < 3;i++){
			if(i > 0) j = Math.pow(2,i);
			fg[i] = pt & j;
		}
		var ht = tp;	var ky = '';	var rg = null;
		if(fg[1] > 0){
			if(fg[0] > 0){
				if(fg[2] > 0){
					for(i = 0;i < ra.length;i++){
						for(j = 0;j < ra[i].length;j++){
							ky = '_%va'+ i +'_'+ j +'%_';		rg = new RegExp(ky,"g");	ht = ht.replace(rg,ra[i][j]);
						}
					}
				}else{
					for(i = 0;i < ra.length;i++){
						ky = '_%va'+ i +'%_';		rg = new RegExp(ky,"g");	ht = ht.replace(rg,ra[i]);
					}
				}
			}else{
				if(fg[2] > 0){
					for(i = 0;i < ra.length;i++){
						for(j = 0;j < ra[i].length;j++){
							ky = '_%va'+ i +'_'+ j +'%_';		ht = ht.replace(ky,ra[i][j]);
						}
					}
				}else{
					for(i = 0;i < ra.length;i++){
						ky = '_%va'+ i +'%_';		ht = ht.replace(ky,ra[i]);
					}
				}
			}
		}else{
			if(fg[0] > 0){
				rg = new RegExp('_%va0%_',"g");		ht = ht.replace(rg,ra);
			}else{
				ht = ht.replace('_%va0%_',ra);
			}
		}
		return ht;
	},
	tmpviw: function(pt,id,ht){
	/* テンプレート表示 pt 0:上書き 1:追記(イベント消失注意) */
		var ob = this.ge(id);		var ha = '';
		if(ob != undefined){
			if(pt > 0) ha = ob.innerHTML;
			ob.innerHTML = ha + ht;
		}
	},
	tmpagemk: function(id,mx,pt){
	/* ページ切替タブ作成 */
		var tk = 'tp0_1';		var i = 0;
		if(pt) tk = 'tp0_2';
		var tp = this.tmpget(tk);		var ht = this.tmprep(0,id,tp[0]);
		ht += this.tmprep(0,1,tp[1]);
		if(mx > 1){
			for(i = 2;i <= mx;i++){
				ht += this.tmprep(0,i,tp[2]);
			}
		}
		ht += tp[3];
		return ht;
	},
	tmptabmk: function(id,rb){
	/* 通常タブ作成 */
		var tp = this.tmpget('tp0_2');	var i = 0;	var mx = rb.length;
		var ht = this.tmprep(0,id,tp[0]);		ht += this.tmprep(0,rb[0],tp[1]);
		if(mx > 1){
			for(i = 1;i < mx;i++){
				ht += this.tmprep(0,rb[i],tp[2]);
			}
		}
		ht += tp[3];
		return ht;
	},
	tab14init: function(vl){
	/* 戦闘タブ初期化 */
		this.tmpviw(0,'c41',vl);	this.tmpviw(0,'c42','&nbsp;');	this.tmpviw(0,'c44','');
		this.tmpviw(0,'c45','');	this.tmpviw(0,'c47','');	this.tmpviw(0,'t41_1','');
		this.tmpviw(0,'t41_2','');	this.tmpviw(0,'t41_2_a','');	this.tabsel('t41',0);
	},
	kcprecviw: function(pt){
	/* 記録表示 pt 0:logbook 1:enemy_list 2:enemy_db */
		var i = 0;	var j = 0;	var k = 0;	var va = null;	var vb = '';	var vc = null;	var vd = null;
		switch(pt){
		 case 0:
			va = load_storage('logbook',[]);
			for(i in va){
				vb += va[i] +'\n';
			}
			break;
		 case 1:
			va = load_storage('enemy_list');
			vb = '艦隊ID\t艦隊名(陣形)\t編成\n';
			for(i in va){
				vb += i +'\t'+ va[i].join('\t') +'\n';
			}
			break;
		 case 2:
			va = load_storage('enemy_db');	vd = Object.keys(va);
			vd.sort(function(a,b){ return (a > b) ? 1 : -1; });
			vb = '司令部Lv\t難度\t海域\t今週\t通算\t艦隊名(陣形)\t編成\n';
			for(i in vd){
				k = vd[i];
				for(j in va[k].data){
					vc = va[k].data[j];
					vb += vc.lv +'\t'+ vc.r +'\t'+ k +'\t'+ vc.w +'\t'+ vc.n +'\t';
					vb += vc.name.replace(/, /g,'\t') +'\n';
				}
			}
			break;
		}
		this.ge('c57').value = vb;
	},
	kcprecdel: function(pt){
	/* 記録消去確認 */
		var ky = '';	var ra = new Array();
		switch(pt){
		 case 0:
			ky = 'logbook';		ra = ['b561v','b561d'];		break;
		 case 1:
			ky = 'enemy_list';	ra = ['b562v','b562d'];		break;
		 case 2:
			ky = 'enemy_db';	ra = ['b562v','b562d'];		break;
		}
		this.dat['kcprecdelarg'] = [pt,ky,ra];
		var ob = this.ge(ra[1]);
		if(ob != undefined){
			ob.disabled = true;		ob.style.visibility = 'hidden';	// 無効化＆非表示
		}
		this.dat['pmbcloserunproc'] = function(){
			var pa = dpnla.dat['kcprecdelarg'];
			var oa = dpnla.ge(pa[2][1]);
			if(oa != undefined){
				oa.disabled = false;	oa.style.visibility = 'visible';	// 有効化＆表示
			}
		};
		var tp = this.tmpget('tp0_5');
		var ra = ['本当に消去しても、よろしいですか？','pmb04','pmb05'];
		this.pmbopen(330,70,280,100,this.tmprep(2,ra,tp[0]));
		this.addevent(this.ge(ra[1]),'click',function(){ dpnla.kcprecdelgo(); });
		this.addevent(this.ge(ra[2]),'click',function(){ dpnla.pmbclose(); });
	},
	kcprecdelgo: function(){
	/* 記録消去 pt 0:logbook 1:enemy_list 2:enemy_db */
		var va = {};	var pt = this.dat['kcprecdelarg'];
		var ky = pt[1];		var ra = pt[2];		var ob = this.ge(ra[0]);
		switch(pt[0]){
		 case 0:
			va = [];	$logbook = [];	break;
		 case 1:
			$enemy_list = {};		break;
		 case 2:
			$enemy_db = {};		break;
		}
		save_storage(ky,va);
		if(ob != undefined){
			ob.disabled = true;		ob.style.visibility = 'hidden';	// 無効化＆非表示
		}
		this.dat['pmbcloserunproc'] = null;
		this.pmbclose();
	},
	kcprecls: function(){
	/* 記録表示欄クリア */
		this.ge('c57').value = '';
	},
	matupdinit: function(){
	/* 資材増減歴初期化 */
		var k = this.getmatupdkey();
		// this.addevent(this.ge('b141v'),'click',function(){ dpnla.matupdview(); });
		// this.ge('i142v').value = '';
		// this.ge('i143v').value = '';
		
	},
	matupdsave: function(){
	/* 資材増減歴保存 */
		var k = this.getmatupdkey();
		
		this.matupdchgkey();
		
	},
	matupdchgkey: function(){
	/* 資材増減歴保存初期設定 */
		var k = this.getmatupdkey();
		
	},
	matupdview: function(){
	/* 資材増減歴集計表示 */
		// var fo = this.ge('i142v');
		// var to = this.ge('i143v');
		
	},
	getmatupdkey: function(){
	/* 資材増減歴保存キー取得 */
		var d = new Date();		var a = new Date();
		if($svDateTime) d = $svDateTime;
		var c = this.daytimchg(3,d);
		if(c[3] < 5){
			a.setTime(d.getTime() - (6 * 3600 * 1000));
		}else{
			a = d;
		}
		return this.daytimchg(4,a);
	},
	getmatupdary: function(pt){
	/* 資材増減項目別配列取得 */
		var ra = new Array();
		switch(pt){
			case 0:		ra = $material.now;		break;
			case 1:		ra = $material.beg;		break;
			case 2:		ra = $material.quest;				break;
			case 3:		ra = $material.mission;			break;
			case 4:		ra = $material.dropitem;		break;
			case 5:		ra = $material.destroyship;	break;
			case 6:		ra = $material.destroyitem;	break;
			case 7:		ra = $material.autosupply;	break;
			case 8:		ra = $material.charge;			break;
			case 9:		ra = $material.ndock;				break;
			case 10:	ra = $material.createship;	break;
			case 11:	ra = $material.createitem;	break;
			case 12:	ra = $material.remodelslot;	break;
		}
		return ra.concat();
	},
	kcpstimeinit: function(){
	/* 開始日時を記憶 */
		var a = new Date();		var b = new Date();
		if($svDateTime) a = $svDateTime;
		b.setTime(a.getTime());
		this.dat['kcpstimesavedat'] = b;
	},
	kcpstimeview: function(){
	/* 経過時間を返却 */
		var b = this.dat['kcpstimesavedat'];	var a = new Date();
		if(!b) b = new Date();
		if($svDateTime) a = $svDateTime;
		var c = a.getTime() - b.getTime();
		return this.strtimchg(c,1);
	},
	pmbopen: function(la,ta,wa,ha,hb){
	/* ポップアップメッセージボックスを開く */
		var po = this.ge('pmb01');	var mo = this.ge('pmb03');
		if(mo != undefined) mo.innerHTML = hb;
		if(po != undefined){
			po.style.left = la +'px';		po.style.top = ta +'px';
			po.style.width = wa +'px';	po.style.height = ha +'px';
			po.style.display = 'block';
		}
	},
	pmbclose: function(){
	/* ポップアップメッセージボックスを閉じる */
		var ky = 'pmbcloserunproc';		var cp = this.dat[ky];
		var po = this.ge('pmb01');	var mo = this.ge('pmb03');
		if(cp) cp();
		this.dat[ky] = null;
		if(mo != undefined) mo.innerHTML = '';
		if(po != undefined){
			po.style.display = 'none';
			po.style.left = '0px';	po.style.top = '0px';
			po.style.width = '1px';		po.style.height = '1px';
		}
	},
	getmbstrlen: function(s){
	/* 文字数カウント */
		var es = encodeURI(s);	var i = 0;	var ca = 0;		var cm = 0;
		for(i = 0;i < es.length;i++){
			if(es.charAt(i) == '%'){
				i += 2;		cm++;
			}else{
				ca++;
			}
		}
		return Math.floor(cm / 3) * 2 + ca;
	},
	daytimchg: function(p,d){
	/* 日付オブジェクトの値を日時文字列に変換する */
		var a = new Array();	var r = '';		var i = 0;
		a[0] = d.getYear();		a[1] = d.getMonth() + 1;	a[2] = d.getDate();
		if(a[0] < 2000) a[0] += 1900;
		a[3] = d.getHours();	a[4] = d.getMinutes();	a[5] = d.getSeconds();
		var b = a.concat();		a[0] = ''+ a[0];
		for(i = 1;i < 6;i++){
			if(a[i] < 10){
				a[i] = '0'+ a[i];
			}else{
				a[i] = ''+ a[i];
			}
		}
		switch(p){
		 case 1:	// 12/31 23:59
			r = a[1] +'/'+ a[2] +' '+ a[3] +':'+ a[4];	break;
		 case 2:	// 12/31 23:59:59
			r = a[1] +'/'+ a[2] +' '+ a[3] +':'+ a[4] +':'+ a[5];		break;
		 case 3:	// 数値配列返却
			r = new Array();	r = b;	break;
		 case 4:	// 文字列配列返却
			r = new Array();	r = a;	break;
		 default:	// 2014/12/31 23:59:59
			r = a[0] +'/'+ a[1] +'/'+ a[2] +' '+ a[3] +':'+ a[4] +':'+ a[5];	break;
		}
		return r;
	},
	strtimchg: function(tm,pt){
	/* ミリ秒の値を時分秒に変換する */
		var a = new Array();	var i = 0;
		a[0] = Math.floor(tm / 1000);		a[1] = Math.floor(a[0] / 60);
		a[2] = Math.floor(a[1] / 60);		a[3] = a[0] % 60;		a[4] = a[1] % 60;
		for(i = 2;i < 5;i++){
			if(a[i] < 10) a[i] = '0'+ a[i];
		}
		var r = a[2] +':'+ a[4] +':'+ a[3];
		if(pt) r = a[2] +':'+ a[4];
		return r;
	},
	addevent: function(em,ty,fc){
	/* エレメントへのイベント追加 */
		if(window.addEventListener){
			em.addEventListener(ty,fc,false);
		}else{
			var ev = 'on'+ ty;
			if(window.attachEvent){
				em.attachEvent(ev,fc);
			}else{
				em[ev] = fc;
			}
		}
	},
	getn: function(em,tg){
	/* エレメント内のタグ取得 */
		return em.getElementsByTagName(tg);
	},
	ge: function(id){
	/* エレメントの取得 */
		return document.getElementById(id);
	}
};
}
dpnla.addevent(window,'load',function(){ dpnla.init(); /* 初期起動 */ });

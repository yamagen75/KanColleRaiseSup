/* ゲーム画面位置調整等用 */
var cont = document.createElement('div');
cont.style.whiteSpace = 'pre-wrap';
cont.style.position = 'absolute';
cont.style.top = '860px';
cont.style.left = '0px';
cont.style.backgroundColor = '#fff';
cont.style.width = '770px';
cont.style.height = '80px';
cont.id = 'emorgp1';
/* 操作するオブジェクト「DMMヘッダ」を取得する */
var hd_nvnm = 'dmm-ntgnavi-renew';
var contd = document.getElementById(hd_nvnm);
if(contd == undefined){
	hd_nvnm = 'dmm-ntgnavi';
	var hd_tgs = document.getElementsByTagName('div');
	for(var hd_i = 0;hd_i < hd_tgs.length;hd_i++){
		var hd_clnm = hd_tgs[hd_i].className;
		if(hd_clnm.indexOf(hd_nvnm) >= 0){
			contd = hd_tgs[hd_i];		break;
		}
	}
}
/* 設定読込 */
var flgdef = { topleftfg:1 };
var layoutvl = localStorage['orglayoutsetup'];
var layoutfg = layoutvl ? JSON.parse(layoutvl) : flgdef;
var layoutbn = '左上余白を0pxにする';
if(layoutfg.topleftfg < 1) layoutbn = '左上余白を10pxにする';
var htma = '<div id="emorgp2" style="margin:5px;">';
htma += '<button type="button" onClick="orgplopenclose(1);" style="margin:0 20px 5px 0;">';
htma += '< 閉じる</button><strong>艦これの艦娘育成を支援する GoogleChrome拡張</strong>';
htma += '<button type="button" id="emorgp4" onClick="orgdmmhedonoff();" ';
htma += 'style="margin:0 0 5px 20px;">DMM.com ﾍｯﾀﾞｰ･ﾌｯﾀｰ表示</button>';
htma += '<button type="button" id="emorgp5" onClick="orglayoutsetflgsave();" ';
htma += 'style="margin:0 0 5px 20px;">'+ layoutbn +'</button>';
htma += '<div>デベロッパーツールを、Opt+Cmd+I(Mac)，Ctrl+Shift+I または F12 キーを押して起動してください。';
htma += '</div><div style="margin-top:2px;">デベロッパーツールに「艦これ情報」のタブが追加されない場合';
htma += 'には、デベロッパーツールを起動し直してください。</div></div>';
htma += '<div id="emorgp3" style="display:none;">';
htma += '<button type="button" onClick="orgplopenclose(0);" ';
htma += 'style="margin:5px 0 0 0;padding:0;">開<br />く<br />></button></div>';
var scrp = document.createElement('script');
var htmb = 'function orgplopenclose(pt){ var fa = "block"; var fb = "none"; var fc = "770px"; ';
htmb += 'if(pt > 0){ fa = "none"; fb = "block"; fc = "18px"; } ';
htmb += 'document.getElementById("emorgp1").style.width = fc; ';
htmb += 'document.getElementById("emorgp2").style.display = fa; ';
htmb += 'document.getElementById("emorgp3").style.display = fb; } ';
htmb += 'function orgdmmhedonoff(){ var ho = orgdmmhedelemntget("'+ hd_nvnm +'"); ';
htmb += 'var fo = orgdmmhedelemntget("area-naviapp"); var fa = "block"; ';
htmb += 'var bn = document.getElementById("emorgp4"); var fb = "DMM.com ﾍｯﾀﾞｰ･ﾌｯﾀｰ非表示"; ';
htmb += 'if(ho.style.display != "none"){ fa = "none"; fb = "DMM.com ﾍｯﾀﾞｰ･ﾌｯﾀｰ表示"; } ';
htmb += 'ho.style.display = fa; fo.style.display = fa; bn.innerHTML = fb; } ';
htmb += 'function orglayoutsetflgsave(){ var fb = "左上余白を10pxにする"; ';
htmb += 'var ga = document.getElementById("area-game"); var fa = "0px"; ';
htmb += 'var bn = document.getElementById("emorgp5"); var vl = { topleftfg:0 }; ';
htmb += 'if(ga.style.marginTop != "10px"){ fa = "10px"; fb = "左上余白を0pxにする"; vl.topleftfg = 1; } ';
htmb += 'ga.style.marginTop = fa; ga.style.marginLeft = fa; bn.innerHTML = fb; ';
htmb += 'localStorage["orglayoutsetup"] = JSON.stringify(vl); } ';
htmb += 'function orgdmmhedelemntget(nm){ var hd = document.getElementById(nm); ';
htmb += 'if(hd == undefined){ var tgs = document.getElementsByTagName("div"); ';
htmb += 'for(var i = 0;i < tgs.length;i++){ var cnm = tgs[i].className; ';
htmb += 'if(cnm.indexOf(nm) >= 0){ return tgs[i]; } } }else{ return hd; } }';
/* 操作するオブジェクト「area-game」「main-ntg」「foot」「area-naviapp」を取得する */
var contb = document.getElementById('area-game');
var contc = document.getElementById('main-ntg');
var conte = document.getElementById('foot');
var contf = undefined;
var ft_tgs = document.getElementsByTagName('div');
for(var ft_i = 0;ft_i < ft_tgs.length;ft_i++){
	var ft_clnm = ft_tgs[ft_i].className;
	if(ft_clnm.indexOf('area-naviapp') >= 0){
		contf = ft_tgs[ft_i];		break;
	}
}
var htmc = '';
if(contb == undefined) htmc += '<div>area-gameが取得出来ません。</div>';
if(contc == undefined) htmc += '<div>main-ntgが取得出来ません。</div>';
if(contd == undefined) htmc += '<div>'+ hd_nvnm +'が取得出来ません。</div>';
if(conte == undefined) htmc += '<div>footが取得出来ません。</div>';
if(contf == undefined) htmc += '<div>area-naviappが取得出来ません。</div>';
if(htmc == ''){
	contb.style.textAlign = 'left';
	var layoutfa = '10px';
	if(layoutfg.topleftfg < 1) layoutfa = '0px';
	contb.style.marginTop = layoutfa;
	contb.style.marginLeft = layoutfa;
	contd.style.display = 'none';
	conte.style.display = 'none';
	contf.style.display = 'none';
	contc.style.paddingBottom = '0px';
	scrp.innerHTML = htmb;
	document.head.appendChild(scrp);
}else{
	htma = htmc;
}
cont.innerHTML = htma;
document.body.appendChild(cont);

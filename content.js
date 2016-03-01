/* ゲーム画面位置調整等用 */
var cont = document.createElement('div');
cont.style.whiteSpace = 'pre-wrap';
cont.style.position = 'absolute';
cont.style.top = '635px';
cont.style.left = '0px';
cont.style.backgroundColor = '#fff';
cont.style.width = '650px';
cont.style.height = '70px';
cont.id = 'emorgp1';
/* 操作するオブジェクト「DMMヘッダ」を取得する */
var hd_nvnm = 'dmm-ntgnavi-renew';
var contd = document.getElementById(hd_nvnm);
if(contd == undefined){
	hd_nvnm = 'dmm-ntgnavi';
	var hd_tgs = document.getElementsByTagName('div');
	for(var hd_i = 0;hd_i < hd_tgs.length;hd_i++){
		if(hd_tgs[hd_i].className == hd_nvnm){
			contd = hd_tgs[hd_i];		break;
		}
	}
}
var htma = '<div id="emorgp2" style="margin:5px;">';
htma += '<button type="button" onClick="orgplopenclose(1);" style="margin:0 20px 5px 0;"><< 閉じる</button>';
htma += '<strong>艦これの艦娘育成を支援する GoogleChrome拡張</strong>';
htma += '<button type="button" id="emorgp4" onClick="orgdmmhedonoff(1);" ';
htma += 'style="margin:0 0 5px 20px;">DMM.com ヘッダー表示</button>';
htma += '<button type="button" id="emorgp5" onClick="orgdmmhedonoff(0);" ';
htma += 'style="margin:0 0 5px 20px;display:none;">DMM.com ヘッダー非表示</button>';
htma += '<div>デベロッパーツールを、Opt+Cmd+I(Mac)，Ctrl+Shift+I または F12 キーを押して起動してください。';
htma += '</div><div style="margin-top:2px;">デベロッパーツールに「艦これ情報」のタブが追加されない場合';
htma += 'には、デベロッパーツールを起動し直してください。</div></div>';
htma += '<div id="emorgp3" style="display:none;">';
htma += '<button type="button" onClick="orgplopenclose(0);" ';
htma += 'style="margin:5px 0 0 0;padding:0;">開<br />く<br />></button></div>';
var scrp = document.createElement('script');
var htmb = 'function orgplopenclose(pt){ var fa = "block"; var fb = "none"; var fc = "650px"; ';
htmb += 'if(pt > 0){ fa = "none"; fb = "block"; fc = "18px"; } ';
htmb += 'document.getElementById("emorgp1").style.width = fc; ';
htmb += 'document.getElementById("emorgp2").style.display = fa; ';
htmb += 'document.getElementById("emorgp3").style.display = fb;';
htmb += ' } function orgdmmhedonoff(pt){ var fa = "none"; var fb = "inline-block"; var fc = "none"; ';
htmb += 'var fd = "816px"; ';
htmb += 'if(pt > 0){ fa = "inline-block"; fb = "none"; fc = "block"; fd = "996px"; } ';
htmb += 'document.getElementById("emorgp4").style.display = fb; ';
htmb += 'document.getElementById("emorgp5").style.display = fa; ';
htmb += 'orgdmmhedelemntget("'+ hd_nvnm +'").style.display = fc; ';
htmb += 'document.body.style.minWidth = fd; } function orgdmmhedelemntget(nm){ ';
htmb += 'var hd = document.getElementById(nm); if(hd == undefined){ ';
htmb += 'var tgs = document.getElementsByTagName("div"); ';
htmb += 'for(var i = 0;i < tgs.length;i++){ if(tgs[i].className == nm){ return tgs[i]; } }';
htmb += ' }else{ return hd; } }';
/* 操作するオブジェクト「area-game」「game_frame」を取得する */
var contb = document.getElementById('area-game');
var contc = document.getElementById('game_frame');
var htmc = '';
if(contb == undefined) htmc += '<div>area-gameが取得出来ません。</div>';
if(contc == undefined) htmc += '<div>game_frameが取得出来ません。</div>';
if(contd == undefined) htmc += '<div>'+ hd_nvnm +'が取得出来ません。</div>';
if(htmc == ''){
	contb.style.textAlign = 'left';		contb.style.marginTop = '5px';
	contd.style.display = 'none';		contc.width = '840px';
	document.body.style.minWidth = '816px';
	scrp.innerHTML = htmb;	document.head.appendChild(scrp);
}else{
	htma = htmc;
}
cont.innerHTML = htma;	document.body.appendChild(cont);

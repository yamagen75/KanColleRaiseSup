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
var htma = '<div id="emorgp2" style="margin:5px;">';
htma += '<input type="button" value="<< 閉じる" onClick="orgplopenclose(1);" style="margin:0 20px 5px 0;">';
htma += '<strong>艦これの艦娘育成を支援する GoogleChrome拡張</strong>';
htma += '<input id="emorgp4" type="button" value="DMM.com ヘッダー表示" onClick="orgdmmhedonoff(1);" ';
htma += 'style="margin:0 0 5px 20px;">';
htma += '<input id="emorgp5" type="button" value="DMM.com ヘッダー非表示" onClick="orgdmmhedonoff(0);" ';
htma += 'style="margin:0 0 5px 20px;display:none;"><div>';
htma += 'デベロッパーツールを、Opt+Cmd+I(Mac)，Ctrl+Shift+I または F12 キーを押して起動してください。</div>';
htma += '<div style="margin-top:2px;">デベロッパーツールに「艦これ情報」のタブが追加されない場合には、';
htma += 'デベロッパーツールを起動し直してください。</div>';
htma += '</div><div id="emorgp3" style="display:none;">';
htma += '<input type="button" value="開\n>" onClick="orgplopenclose(0);" ';
htma += 'style="margin:5px 0 0 0;padding:0;"></div>';
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
htmb += 'document.getElementById("dmm-ntgnavi-renew").style.display = fc; ';
htmb += 'document.body.style.minWidth = fd; }';
/* 操作するオブジェクト(area-game,game_frame,dmm-ntgnavi-renew)が取得出来れば実行する */
var contb = document.getElementById('area-game');
var contc = document.getElementById('game_frame');
var contd = document.getElementById('dmm-ntgnavi-renew');
if(!(contb == undefined || contc == undefined || contd == undefined)){
	contb.style.textAlign = 'left';		contb.style.marginTop = '5px';
	contd.style.display = 'none';		contc.width = '840px';
	document.body.style.minWidth = '816px';
	scrp.innerHTML = htmb;	document.head.appendChild(scrp);
	cont.innerHTML = htma;	document.body.appendChild(cont);
}

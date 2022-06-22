function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

var curChangeRate = 0.0;
var curBtcusdt = 0.0;
var binance_ws = "wss://stream.binance.com:9443/ws/{symbol}@miniTicker";
var binance_ws_futures = "wss://fstream.binance.com/ws/{symbol}@miniTicker";
var bybit_ws_futures = "wss://stream.bybit.com/realtime_public";
var bitmex_ws_futures = "wss://www.bitmex.com/realtime";

function binanceConnection(symbol) {
	var ws_endpoint = "";
	var typeName = "";
	if (localStorage.getItem("ttype") == 'cu') {
		ws_endpoint = binance_ws.replace('{symbol}', symbol);
		typeName = 'Spot';
	} else {
		ws_endpoint = binance_ws_futures.replace('{symbol}', symbol);
		typeName = 'Futures';
	}

	const socket = new ReconnectingWebSocket(ws_endpoint);
	socket.maxReconnectInterval = 3000;
	socket.addEventListener("message", function (event) {
		let obj = JSON.parse(event.data);
		let lastPrice = parseFloat(obj.c);
		let highPrice = parseFloat(obj.h);
		let lowPrice = parseFloat(obj.l);
		let highlow = '';
		if (lastPrice > 10.0) {
			let tmp = addCommas(lastPrice.toFixed(2)).split('.');
			$("#mainDisplay1").html(localStorage.getItem("market") + ' : ' + tmp[0] + '.'+tmp[1]);
			highlow = addCommas('H ' + highPrice.toFixed(0)) + ' / L ' + addCommas(lowPrice.toFixed(0))
			document.title = addCommas(lastPrice.toFixed(2));
		} else {
			$("mainDisplay1").html(addCommas(lastPrice.toFixed(4)));
			highlow = addCommas('H ' + highPrice.toFixed(2)) + ' / L ' + addCommas(lowPrice.toFixed(2));
			document.title = addCommas(lastPrice.toFixed(4));
		}
		$("#mainDisplay2").html(typeName + ' / ' + symbol.toUpperCase() + ' / ' + highlow);
		curBtcusdt = lastPrice;
	});
}

function bybitConnection(symbol) {
	const socket = new ReconnectingWebSocket(bybit_ws_futures);
	socket.maxReconnectInterval = 3000;
	let sendMsg = '{"op": "subscribe", "args": ["trade.{symbol}"]}';
	socket.addEventListener('open', function () {
		socket.send(sendMsg.replace('{symbol}', symbol));
	});
	socket.addEventListener("message", function (event) {
		let obj = JSON.parse(event.data);
		try {
			let lastPrice = parseFloat(obj.data[0].price);
			if (lastPrice > 10.0) {
				let tmp = addCommas(lastPrice.toFixed(2)).split('.');
				$("#mainDisplay1").html(localStorage.getItem("market") + ' : ' + tmp[0] + '.'+tmp[1]);
				document.title = addCommas(lastPrice.toFixed(2));
			} else {
				$("#mainDisplay1").html(addCommas(lastPrice.toFixed(4)));
				document.title = addCommas(lastPrice.toFixed(4));
			}
			$("#mainDisplay2").html('Futures / ' + symbol.toUpperCase());
			curBtcusdt = lastPrice;
		} catch (e) {
		}
	});
	
	setInterval(function() { 
		time();
	}, 1000);
}

function bitmexConnection(symbol) {
	const socket = new ReconnectingWebSocket(bitmex_ws_futures);
	socket.maxReconnectInterval = 3000;
	let sendMsg = '{"op": "subscribe", "args": ["trade:{symbol}"]}';
	socket.addEventListener('open', function () {
		if (symbol == 'BTCUSDT') {
			symbol = 'XBTUSD';
		} else if (symbol.indexOf('ETH') > -1 || symbol.indexOf('XRP') > -1 || symbol.indexOf('LTC') > -1 || symbol.indexOf('BCH') > -1 || symbol.indexOf('ETC') > -1) {
			symbol = symbol.replace('USDT', 'USD');
		}
		socket.send(sendMsg.replace('{symbol}', symbol));
	});
	socket.addEventListener("message", function (event) {
		let obj = JSON.parse(event.data);
		try {
			let lastPrice = parseFloat(obj.data[0].price);
			if (lastPrice > 10.0) {
				let tmp = addCommas(lastPrice.toFixed(2)).split('.');
				$("#mainDisplay1").html(localStorage.getItem("market") + ' : ' + tmp[0] + '.'+tmp[1]);
				document.title = addCommas(lastPrice.toFixed(2));
			} else {
				$("#mainDisplay1").html(addCommas(lastPrice.toFixed(4)));
				document.title = addCommas(lastPrice.toFixed(4));
			}
			$("#mainDisplay2").html('Futures / ' + symbol.toUpperCase());
			curBtcusdt = lastPrice;
		} catch (e) {
		}
	});
	
	setInterval(function() { 
		time();
	}, 1000);
}

function exchangeRateReqListener () {
	//console.log(this.responseText);
	const obj = JSON.parse(this.responseText);
	const basePrice = parseFloat(obj[0].basePrice);
    $("#exchangeRate").text('(Won-dollar : ' + addCommas(basePrice) + ')');
    curChangeRate = basePrice;
}

function exchangeRate() {
	var res = new XMLHttpRequest();
	res.addEventListener("load", exchangeRateReqListener);
	res.open("GET", "https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD");
	res.send();
}

function upbitConnection(symbol) {
	const socket = new ReconnectingWebSocket("wss://api.upbit.com/websocket/v1");
	socket.maxReconnectInterval = 3000;
	socket.addEventListener('open', function () {
		socket.send('[{"ticket":"btcd.site"},{"type":"ticker","codes":["KRW-'+symbol+'"],"isOnlyRealtime":true}]');
	});
	socket.addEventListener("message", function (event) {
		let reader = new FileReader();
		reader.readAsText(event.data);
  		reader.onload = function() {
    		let json = JSON.parse(reader.result);
	        $("#upbitDisplay1").html('UPBIT : ' + addCommas(json.trade_price));
	        if (curBtcusdt > 0.0) {
		        let binancekrw = curBtcusdt * curChangeRate;
		        $("#koreaPrimeDisplay").html('Korea Prime : ' + (((json.trade_price - binancekrw) / binancekrw) * 100).toFixed(2) + '%');
	        }
			/***
			$("mainDisplay1").html(addCommas(json.trade_price));
			document.title = addCommas(addCommas(json.trade_price));
			***/
    	}
	});
}

function longShortRateReqListener () {
	const obj = JSON.parse(this.responseText);
	let longRate = 0.0;
	let shortRate = 0.0;
	for (i=0; i<obj.data[0].list.length; i++) {
		let exchangeName = obj.data[0].list[i].exchangeName;
		if (exchangeName.toUpperCase() == localStorage.getItem("market")) {
			longRate = parseFloat(obj.data[0].list[i].longRate);
			shortRate = parseFloat(obj.data[0].list[i].shortRate);
		}
	}
	$("#longRate").css("width", longRate.toFixed(2) + '%');
    $("#longRate").text('Long : ' + longRate.toFixed(2) + '%');
    $("#shortRate").css("width", shortRate.toFixed(2) + '%');
    $("#shortRate").text('Short : ' + shortRate.toFixed(2) + '%');
}

function longShortRate(symbol, interval) {
	var res = new XMLHttpRequest();
	res.addEventListener("load", longShortRateReqListener);
	res.open("GET", "https://fapi.coinglass.com/api/futures/longShortRate?timeType="+interval+"&symbol=" + symbol);
	res.send();
}

function bitgetListener () {
	const obj = JSON.parse(this.responseText);
	let lastPrice = parseFloat(obj.data.last);
	let highPrice = parseFloat(obj.data.high24h);
	let lowPrice = parseFloat(obj.data.low24h);
	let highlow = '';
	if (lastPrice > 10.0) {
		let tmp = addCommas(lastPrice.toFixed(2)).split('.');
		$("#mainDisplay1").html(localStorage.getItem("market") + ' : ' + tmp[0] + '.'+tmp[1]);
		highlow = addCommas('H ' + highPrice.toFixed(0)) + ' / L ' + addCommas(lowPrice.toFixed(0))
		document.title = addCommas(lastPrice.toFixed(2));
	} else {
		$("mainDisplay1").html(addCommas(lastPrice.toFixed(4)));
		highlow = addCommas('H ' + highPrice.toFixed(2)) + ' / L ' + addCommas(lowPrice.toFixed(2));
		document.title = addCommas(lastPrice.toFixed(4));
	}
	$("#mainDisplay2").html('Futures / ' + symbol.toUpperCase() + ' / ' + highlow);
	curBtcusdt = lastPrice;
}

function bitget(symbol) {
	var res = new XMLHttpRequest();
	res.addEventListener("load", bitgetListener);
	res.open("GET", "https://api.bitget.com/api/mix/v1/market/ticker?symbol="+symbol+"_UMCBL");
	res.send();
}

function scriptQuery(){ 
	var script = $('#main');
	const params = script[0].src.substring(script[0].src.lastIndexOf('?')+1, script[0].src.length);
	const json = JSON.parse('{"' + decodeURI(params).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
	return json;
}

function time() {
    let unix_timestamp = Date.now();
	var date = new Date(unix_timestamp);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var seconds = "0" + date.getSeconds();
	var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	$("#timeDisplay").text(formattedTime);
}

function init() {
	if (localStorage.getItem("storage") != 'f798bcaa-c6ac-4785-802e-7153400c3338') {
		reset();
	}
	let market = localStorage.getItem("market");
	let symbol = localStorage.getItem("symbol");
	let longShort = localStorage.getItem("longShortInterval");
	let chart = localStorage.getItem("chartInterval");
	let reload = localStorage.getItem("reloadInterval");
	let ttype = localStorage.getItem("ttype");
	let ctype = localStorage.getItem("ctype");
	$("#market").val(market);
	$("#symbol").val(symbol);
	if (market == 'BYBIT' || market == 'BITMEX' || market == 'BITGET') {
		$("#ttype").val('ft');
		$("input:radio[name='spotFutures']:radio[value='ft']").prop('checked', true);
		localStorage.setItem("ttype", "ft");
	} else {
		$("input:radio[name='spotFutures']:radio[value='"+ttype+"']").prop('checked', true);
		//$("#ttype").val(ttype);
	}
	//$('#marketLogo').html('<img src="icon/'+market+'.png" width="15px;">');
	$("#ctype").val(ctype);
	$("#longShortInterval").val(longShort);
	$("#chartInterval").val(chart);
	$("#reloadInterval").val(reload);
	let indicators = ',"studies": [{{arg}}]';
	let arg = '';
	let ma = '"MASimple@tv-basicstudies"';
	let boll = '"BB@tv-basicstudies"';
	let pivot = '"PivotPointsStandard@tv-basicstudies"';
	let ichimoku = '"IchimokuCloud@tv-basicstudies"';
    let rsi = '"RSI@tv-basicstudies"';
    let wr = '"WilliamR@tv-basicstudies"';
    let macd = '"MACD@tv-basicstudies"';
    
    if (localStorage.getItem("indicator_ma") == 'Y') {
    	arg += ma + ",";
    	$("#ma").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_boll") == 'Y') {
    	arg += boll + ",";
    	$("#boll").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_rsi") == 'Y') {
    	arg += rsi + ",";
    	$("#rsi").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_wr") == 'Y') {
    	arg += wr + ",";
    	$("#wr").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_macd") == 'Y') {
    	arg += macd + ",";
    	$("#macd").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_pivot") == 'Y') {
    	arg += pivot + ",";
    	$("#pivot").prop( "checked", true );
    }
    if (localStorage.getItem("indicator_ichimoku") == 'Y') {
    	arg += ichimoku + ",";
    	$("#ichimoku").prop( "checked", true );
    }
    
    indicators = indicators.replace('{{arg}}', arg.substring(0, arg.length-1));
    let chartSymbol = symbol;
    if (market == 'BINANCE' && ttype == 'ft') {
    	chartSymbol = chartSymbol + 'PERP';
    } else if (market == 'BITMEX') {
		if (chartSymbol == 'btcusd' || chartSymbol == 'btcusdt') {
			chartSymbol = 'xbtusd';
		} else if (chartSymbol.indexOf('eth') > -1 || chartSymbol.indexOf('xrp') > -1 || chartSymbol.indexOf('ltc') > -1 || chartSymbol.indexOf('bch') > -1) {
			chartSymbol = chartSymbol.replace('usdt', 'usd');
		}
    }
    if (ttype == 'ft') {
    	$(".card-body").css("background-color", '#455590');
    }
    if (ctype == 'line') {
    	ctype = '2';
    } else if (ctype == 'heikinashi') {
    	ctype = '8';
    } else {
    	ctype = '1';
    }
    
    let hide_side_toolbar = true;
    if (localStorage.getItem("drawing_tools_bar") == 'Y') {
    	hide_side_toolbar = false;
    	$("#drawingtoolbar").prop( "checked", true );
    }

	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const userLocale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
	const userLocaleSplit = userLocale.split('-');
	let locale = userLocaleSplit[1].toLowerCase();
	let tradingViewJson = JSON.parse('{"autosize": true,"hide_side_toolbar":'+hide_side_toolbar+',"theme": "dark","style": "'+ctype+'","locale": "'+locale+'","timezone": "'+timezone+'","interval": "'+chart+'","toolbar_bg": "#f1f3f6","enable_publishing": false,"save_image": false'+indicators+',"symbol": "'+market+':' + chartSymbol.toUpperCase() + '","container_id": "tv_btcusdt", "show_popup_button": true}');
	new TradingView.widget(tradingViewJson);
	if (market == 'BINANCE') {
		binanceConnection(symbol);
	} else if (market == 'BYBIT') {
		bybitConnection(symbol.toUpperCase());
	} else if (market == 'BITMEX') {
		bitmexConnection(symbol.toUpperCase());
	} else if (market == 'BITGET') {
		setInterval(function() { 
			bitget(symbol.toUpperCase());
		}, 1000);
	}
	
	upbitConnection(symbol.toUpperCase().replace('USDT', ''));

	longShortRate(symbol.toUpperCase().replace('USDT', ''), longShort);
	setInterval(function() { 
		longShortRate(symbol.toUpperCase().replace('USDT', ''), longShort);
	}, 5000);

	$(".tradingViewArea").css("height", localStorage.getItem("chart_height") + 'px');
	if (reload > 0) {
		setInterval(function() { 
			location.reload();
		}, (reload * 60 * 1000));
	}
}

function chartAreaHight(size) {
	let curSize = localStorage.getItem("chart_height");
	if (curSize == null) {
		curSize = 300;
	}
	curSize = parseInt(curSize) + parseInt(size);
	$('#chartArea').height(curSize);
	localStorage.setItem("chart_height", curSize);
}

$( document ).ready(function() {
	window.dataLayer = window.dataLayer || [];
	function gtag(){dataLayer.push(arguments);}
	gtag('js', new Date());
	gtag('config', 'G-Q7S6NP87HT');
	time();
	setInterval(function() { 
		time();
	}, 1000);	
	exchangeRate();
	setInterval(function() { 
		exchangeRate();
	}, 60000);
	init();
});

function setting() {
	localStorage.setItem("market", $("#market").val());
	localStorage.setItem("symbol", $("#symbol").val());
	localStorage.setItem("ttype", $("input[name='spotFutures']:checked").val());
	localStorage.setItem("ctype", $("#ctype").val());
	localStorage.setItem("longShortInterval", $("#longShortInterval").val());
	localStorage.setItem("chartInterval", $("#chartInterval").val());
	localStorage.setItem("reloadInterval", $("#reloadInterval").val());
	if ($("#ma:checked").val() == 'Y') {
		localStorage.setItem("indicator_ma", 'Y');
	} else {
		localStorage.setItem("indicator_ma", 'N');
	}
	
	if ($("#boll:checked").val() == 'Y') {
		localStorage.setItem("indicator_boll", 'Y');
	} else {
		localStorage.setItem("indicator_boll", 'N');
	}
	
	if ($("#pivot:checked").val() == 'Y') {
		localStorage.setItem("indicator_pivot", 'Y');
	} else {
		localStorage.setItem("indicator_pivot", 'N');
	}	
	
	if ($("#ichimoku:checked").val() == 'Y') {
		localStorage.setItem("indicator_ichimoku", 'Y');
	} else {
		localStorage.setItem("indicator_ichimoku", 'N');
	}
	
	if ($("#rsi:checked").val() == 'Y') {
		localStorage.setItem("indicator_rsi", 'Y');
	} else {
		localStorage.setItem("indicator_rsi", 'N');
	}
	
	if ($("#wr:checked").val() == 'Y') {
		localStorage.setItem("indicator_wr", 'Y');
	} else {
		localStorage.setItem("indicator_wr", 'N');
	}
	
	if ($("#macd:checked").val() == 'Y') {
		localStorage.setItem("indicator_macd", 'Y');
	} else {
		localStorage.setItem("indicator_macd", 'N');
	}
	
	if ($("#drawingtoolbar:checked").val() == 'Y') {
		localStorage.setItem("drawing_tools_bar", 'Y');
	} else {
		localStorage.setItem("drawing_tools_bar", 'N');
	}
	
	localStorage.setItem("chart_height", $('#tv_btcusdt').height());
	location.reload();
}

function reset() {
	localStorage.setItem("storage", 'f798bcaa-c6ac-4785-802e-7153400c3338');
	localStorage.setItem("market", 'BINANCE');
	localStorage.setItem("symbol", 'btcusdt');
	localStorage.setItem("ttype", 'cu');
	localStorage.setItem("ctype", 'candle');
	localStorage.setItem("longShortInterval", '10');
	localStorage.setItem("chartInterval", '15');
	localStorage.setItem("chart_height", '300');
	localStorage.setItem("reloadInterval", '0');
	localStorage.removeItem("indicator_ma");
	localStorage.removeItem("indicator_boll");
	localStorage.removeItem("indicator_rsi");
	localStorage.removeItem("indicator_wr");
	localStorage.removeItem("indicator_macd");
	localStorage.removeItem("indicator_pivot");
	localStorage.removeItem("indicator_ichimoku");
	localStorage.removeItem("drawing_tools_bar");
	location.reload();
}

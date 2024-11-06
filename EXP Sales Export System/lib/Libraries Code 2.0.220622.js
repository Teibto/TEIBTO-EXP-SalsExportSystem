/**
* @NApiVersion 2.x
* @NModuleScope Public 
*
* Other Function Release 23/12/2019 V.4.2
*
* @summary Teibto Libraries Function
*
* @author  Pradchaya Areerom <pradchaya@teibto.com>
*
* @version 3.0
*
* @changes 3.0 Pradchaya
* 	08/03/2018 16:30	Order function by Category
* @changes 3.2 Pradchaya
* 	26/10/2018 13:55	Add elapsed in INT LOG EXECUTION record
* @changes 4.0 Pradchaya
* 	07/09/2019 11:55	Change to SuiteScript 2.0
* @changes 4.1 Pradchaya
* 	04/12/2019 14:30	Fix create log error nlapiLogExecution is undefined
* @changes 4.2 Pradchaya
* 	23/12/2019 14:30	Fix error on search.run().each() error limit 4000 lines
* name: "SSS_SEARCH_FOR_EACH_LIMIT_EXCEEDED", message: "No more than 4000 search results may be returned a…c so that no more than 4000 results are returned."
* @changes 4.3 Pradchaya
* 	14/04/2020 13:30	Add loadSavedSearchWithExpression
* @changes 4.4 Pradchaya
* 	24/08/2021 18:00	Made Base64 available for libCode
*
*/

var email, format, record, runtime, search, message;

define([ 'N/email', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/ui/message' ],
/**
 * @param {email} _email
 * @param {format} _format
 * @param {record} _record
 * @param {runtime} _runtime
 * @param {search} _search
 * @param {message} _message
 */
function(_email, _format, _record, _runtime, _search, _message) {
	email = _email;
	format = _format;
	record = _record;
	runtime = _runtime;
	search = _search;
	message = _message;

	return new libCode_220622();
});

function libCode_220622() {

	// ################################################################################################
	// ################################################################################################
	// ========== Set Prototype Function
	// ################################################################################################
	// ################################################################################################
	Number.prototype.noExponents = function() {
		var data = String(this).split(/[eE]/);
		if (data.length == 1) return data[0];

		var z = '', sign = this < 0 ? '-' : '', str = data[0].replace('.', ''), mag = Number(data[1]) + 1;

		if (mag < 0) {
			z = sign + '0.';
			while (mag++)
				z += '0';
			return z + str.replace(/^\-/, '');
		}
		mag -= str.length;
		while (mag--)
			z += '0';
		return str + z;
	};

	/**
	 * Base64 Object to use in script
	 */
	var Base64 = {
		_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		encode : function(e) {
			var t = "";
			var n, r, i, s, o, u, a;
			var f = 0;
			e = this._utf8_encode(e);
			while (f < e.length) {
				n = e.charCodeAt(f++);
				r = e.charCodeAt(f++);
				i = e.charCodeAt(f++);
				s = n >> 2;
				o = (n & 3) << 4 | r >> 4;
				u = (r & 15) << 2 | i >> 6;
				a = i & 63;
				if (isNaN(r)) u = a = 64;
				else if (isNaN(i)) a = 64;

				t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a);
			}
			return t;
		},
		decode : function(e) {
			var t = "";
			var n, r, i;
			var s, o, u, a;
			var f = 0;
			e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
			while (f < e.length) {
				s = this._keyStr.indexOf(e.charAt(f++));
				o = this._keyStr.indexOf(e.charAt(f++));
				u = this._keyStr.indexOf(e.charAt(f++));
				a = this._keyStr.indexOf(e.charAt(f++));
				n = s << 2 | o >> 4;
				r = (o & 15) << 4 | u >> 2;
				i = (u & 3) << 6 | a;
				t = t + String.fromCharCode(n);
				if (u != 64) t = t + String.fromCharCode(r);
				if (a != 64) t = t + String.fromCharCode(i);
			}
			t = this._utf8_decode(t);
			return t;
		},
		_utf8_encode : function(e) {
			e = e.replace(/\r\n/g, "\n");
			var t = "";
			for (var n = 0; n < e.length; n++) {
				var r = e.charCodeAt(n);
				if (r < 128) {
					t += String.fromCharCode(r);
				} else if (r > 127 && r < 2048) {
					t += String.fromCharCode(r >> 6 | 192);
					t += String.fromCharCode(r & 63 | 128);
				} else {
					t += String.fromCharCode(r >> 12 | 224);
					t += String.fromCharCode(r >> 6 & 63 | 128);
					t += String.fromCharCode(r & 63 | 128);
				}
			}
			return t;
		},
		_utf8_decode : function(e) {
			var t = "";
			var n = 0;
			var r = c1 = c2 = 0;
			while (n < e.length) {
				r = e.charCodeAt(n);
				if (r < 128) {
					t += String.fromCharCode(r);
					n++;
				} else if (r > 191 && r < 224) {
					c2 = e.charCodeAt(n + 1);
					t += String.fromCharCode((r & 31) << 6 | c2 & 63);
					n += 2;
				} else {
					c2 = e.charCodeAt(n + 1);
					c3 = e.charCodeAt(n + 2);
					t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
					n += 3;
				}
			}
			return t;
		}
	};
	this.Base64 = Base64;

	// ################################################################################################
	// ################################################################################################
	// ========== Text Function
	// ################################################################################################
	// ################################################################################################
	this.fnText = {
		addComma : this.addComma,
		addComma2Point : this.addComma2Point,
		removeComma : this.removeComma,
		setPointMinimum : this.setPointMinimum,
	};

	/**
	 * @param {Number} num
	 * @returns {string} Return number added comma
	 */
	function addComma(num) {
		if (!isNaN(num)) {
			// num = Number(num).toFixed(pointAmount);
			if (num.toString().indexOf('.') == -1) {
				num = num.toString() + '.0';
				num = num.toString().replace(/\B(?=(\d{3})+(?!\d).)/g, ",");
				num = num.slice(0, num.length - 2);
			} else {
				num = num.toString().replace(/\B(?=(\d{3})+(?!\d).)/g, ",");
			}
			return num;
			// return num.toString().replace(/\B(?=(\d{3})+(?!\d).)/g, ",");
		} else {
			return 0;
		}
	}
	this.addComma = addComma;

	/**
	 * @param {Number} num
	 * @returns {string} Return number added comma with point in 2 digit
	 */
	function addComma2Point(num) {
		if (num === undefined || num === null || num === '') return nvl(num);
		return addComma(Number(num).toFixed(2));
	}
	this.addComma2Point = addComma2Point;

	/**
	 * @param {string} str
	 * @returns {Number} Return number removed comma
	 */
	function removeComma(str) {
		if (nvl(str) == '') str = '';
		str = str.toString();
		str = str.replace(/,/g, '');
		if (isNaN(str)) {
			return 0;
		} else {
			return Number(str);
		}
	}
	this.removeComma = removeComma;

	/**
	 * @param {Number,String} num Number Need to get minimum point
	 * @param {Number} point Point of number
	 * @returns {String}
	 */
	function setPointMinimum(num, point) {
		if (!point) point = 2;

		if (num == null || num == '') return num;

		var splitNum = num.toString().split('.');
		if (splitNum.length == 1) return Number(num).toFixed(point);
		else if (splitNum[1].length <= point) return Number(num).toFixed(point);
		else return num;
	}
	this.setPointMinimum = setPointMinimum;

	// ################################################################################################
	// ################################################################################################
	// ========== Number Function
	// ################################################################################################
	// ################################################################################################
	this.fnNumber = {
		addNumber : this.addNumber,
		dividedNumber : this.dividedNumber,
		minusNumber : this.minusNumber,
		multipliedNumber : this.multipliedNumber,
		numberFormat : this.numberFormat,
		toFixed2 : this.toFixed2,
	};

	/**
	 * @param {Number} num1
	 * @param {Number} num2
	 * @returns {Number} Return num1 + num2
	 */
	function addNumber(_num1, _num2) {
		var num1 = Number(nvl(_num1, 0));
		var num2 = Number(nvl(_num2, 0));
		var point1 = num1.noExponents().replace(/[-0-9]*./, '').length;
		var point2 = num2.noExponents().replace(/[-0-9]*./, '').length;
		var pointmax = (point1 > point2) ? point1 : point2;
		num1 = num1 + num2;
		num1 = num1.toFixed(pointmax);
		return Number(num1);
	}
	this.addNumber = addNumber;

	/**
	 * @param {Number} num1
	 * @param {Number} num2
	 * @param {Number} pointmax (Optional, default 1) point of divided number
	 * @returns {Number} Return num1 / num2
	 */
	function dividedNumber(_num1, _num2, pointmax) {
		var num1 = Number(nvl(_num1, 0));
		var num2 = Number(nvl(_num2, 1));
		if (num2 == 0) return 1;
		var point1 = num1.noExponents().replace(/[-0-9]*./, '').length;
		var point2 = num2.noExponents().replace(/[-0-9]*./, '').length;
		num1 = num1 / num2;
		if (nvl(pointmax) != '') {
			num1 = num1.toFixed(pointmax);
		}
		return Number(num1);
	}
	this.dividedNumber = dividedNumber;

	/**
	 * @param {Number} num1
	 * @param {Number} num2
	 * @returns {Number} Return num1 - num2
	 */
	function minusNumber(_num1, _num2) {
		var num1 = Number(nvl(_num1, 0));
		var num2 = Number(nvl(_num2, 0));
		var point1 = num1.noExponents().replace(/[-0-9]*./, '').length;
		var point2 = num2.noExponents().replace(/[-0-9]*./, '').length;
		var pointmax = (point1 > point2) ? point1 : point2;
		num1 = num1 - num2;
		num1 = num1.toFixed(pointmax);
		return Number(num1);
	}
	this.minusNumber = minusNumber;

	/**
	 * @param {Number} num1
	 * @param {Number} num2
	 * @returns {Number} Return num1 * num2
	 */
	function multipliedNumber(_num1, _num2) {
		var num1 = Number(nvl(_num1, 0));
		var num2 = Number(nvl(_num2, 0));
		var point1 = num1.noExponents().replace(/[-0-9]*./, '').length;
		var point2 = num2.noExponents().replace(/[-0-9]*./, '').length;
		var pointmax = point1 + point2;
		num1 = num1 * num2;
		num1 = num1.toFixed(pointmax);
		return Number(num1);
	}
	this.multipliedNumber = multipliedNumber;

	/**
	 * @param {Number} num number for set format
	 * @param {Number} beforeDot (default 0) amount of number length
	 * @param {Number} afterDot amount of point
	 * @param {bool} haveComma need add comma
	 * @returns {string} Return number on format (Example: numberFormat(345.63,5,8,true) = "00,345.63000000")
	 */
	function numberFormat(num, beforeDot, afterDot, haveComma) {
		if (nvl(num) == '') num = '0';
		if (nvl(beforeDot) == '') beforeDot = 0;
		if (!isNaN(num)) {
			var oldBeforeDot = Number(num).toFixed(0).toString().length;
			if (oldBeforeDot > beforeDot) beforeDot = oldBeforeDot;
			if (nvl(afterDot) != '' && !isNaN(afterDot)) {
				num = Number(num).toFixed(afterDot);
			}
			num = num.toString();
			for (var i = 0; i < beforeDot; i++) {
				num = '0' + num.toString();
			}
			num = num.slice(-beforeDot);
			if (haveComma == true) num = addComma(num);
		}
		return num;
	}
	this.numberFormat = numberFormat;

	/**
	 * Update Prototype Number.toFixed
	 */
	// Number.prototype.toFixed = function(decimalPlaces) {
	// var factor = Math.pow(10, decimalPlaces || 0);
	// var v = (Math.round(Math.round(this * factor * 100) / 100) / factor).toString();
	// if (v.indexOf('.') >= 0) {
	// return v + factor.toString().substr(v.length - v.indexOf('.'));
	// }
	// return v + '.' + factor.toString().substr(1);
	// };
	function toFixed2(num, decimalPlaces) {
		decimalPlaces = Number(decimalPlaces);
		var factor = Math.pow(10, decimalPlaces || 0);
		var v = (Math.round(Math.round(num * factor * 100) / 100) / factor).toString();
		if (v.indexOf('.') >= 0) {
			return v + factor.toString().substr(v.length - v.indexOf('.'));
		}
		return v + '.' + factor.toString().substr(1);
	}
	this.toFixed2 = toFixed2;

	// ################################################################################################
	// ################################################################################################
	// ========== Date/Time Function
	// ################################################################################################
	// ################################################################################################
	this.fnDate = {
		addZeroToDate : this.addZeroToDate,
		addZeroToDateTime : this.addZeroToDateTime,
		getCurrentDate : this.getCurrentDate,
		getDateFormat : this.getDateFormat,
		getDateInBkk : this.getDateInBkk,
		getDateTime : this.getDateTime,
		getShowTime : this.getShowTime,
		getShowTimeSec : this.getShowTimeSec,
		stopWatch : this.stopWatch,
	};

	/**
	 * @param {string} dateStr "D/M/YYYY" change to format "DD/MM/YYYY"
	 * @returns {string} Return new date
	 */
	function addZeroToDate(dateStr) {
		// Input : (string)"d/m/yyyy"
		// Output : (string)"dd/mm/yyyy"
		var date = getDateTime(dateStr);
		if (date == 0) return '';
		date = new Date(date);
		return getDateFormat(date, 'd/m/Y');
	}
	this.addZeroToDate = addZeroToDate;

	/**
	 * @param {string} dateStr "D/M/YYYY H:I" change to format "DD/MM/YYYY HH:II"
	 * @returns {string} Return new date
	 */
	function addZeroToDateTime(dateStr) {
		// Input : (string)"d/m/yyyy h:i"
		// Output : (string)"dd/mm/yyyy hh:ii"
		var date = getDateTime(dateStr);
		if (date == 0) return '';
		date = new Date(date);
		return getDateFormat(date, 'd/m/Y H:i');
	}
	this.addZeroToDateTime = addZeroToDateTime;

	/**
	 * Return current date/time object default +7 Thailand
	 * 
	 * @returns {Date} Return current Date object
	 */
	function getCurrentDate(timezoneFromUTC) {
		if (nvl(timezoneFromUTC) == '' || isNaN(timezoneFromUTC)) timezoneFromUTC = 7;
		var date = new Date();
		date.setHours(date.getHours() + (date.getTimezoneOffset() / 60) + Number(timezoneFromUTC));
		return date;
	}
	this.getCurrentDate = getCurrentDate;

	/**
	 * @param {Date} date object Date to get Format
	 * @param {string} format character set need to change to date format 
	 * ['d'=date, m=month, Y=year(YYYY), y=year(YY) 2 digits, H=hour in 24, h=hour in 12, i=minute, s=second, p=am\pm, P=AM/PM]
	 * @returns {string} Return Date Format
	 */
	function getDateFormat(date, format) {
		if (date == null || date == '') {
			date = new Date();
			date.setHours(date.getHours() + (date.getTimezoneOffset() / 60) + 7);
		}
		var d = date.getDate();
		var m = date.getMonth() + 1;
		var Y = date.getFullYear();
		var y = Y.toString().slice(-2);
		var H = date.getHours();
		var h = H;
		if (h > 12) h -= 12;
		var i = date.getMinutes();
		var s = date.getSeconds();
		var p = 'am';
		var P = 'AM';
		if (date.getHours() > 11) {
			p = 'pm';
			P = 'PM';
		}
		d = ('0' + d.toString()).slice(-2);
		m = ('0' + m.toString()).slice(-2);
		H = ('0' + H.toString()).slice(-2);
		i = ('0' + i.toString()).slice(-2);
		s = ('0' + s.toString()).slice(-2);
		format = format.replace('d', d);// date
		format = format.replace('m', m);// month
		format = format.replace('Y', Y);// year
		format = format.replace('y', y);// year 2 digit
		format = format.replace('H', H);// hour
		format = format.replace('h', h);// hour
		format = format.replace('i', i);// minute
		format = format.replace('s', s);// second
		format = format.replace('p', p);// am/pm
		format = format.replace('P', P);// AM/PM
		return format;
	}
	this.getDateFormat = getDateFormat;

	/**
	 * @param {Date} date optional
	 * @returns {Date} Date Object in UTC+7
	 */
	function getDateInBkk(date) {
		if (!date) date = new Date();
		date.setHours(date.getHours() + (date.getTimezoneOffset() / 60) + 7);
		return date;
	}
	this.getDateInBkk = getDateInBkk;

	/**
	 * @param {string} str convert date "DD/MM/YYYY HH:MM" in string to time in millisecond
	 * @returns {Number} Return time in millisecond
	 */
	function getDateTime(str) {
		var strSplit = '';
		try {
			if (str != null && isNaN(str)) {
				if (str.length > 0) {
					if (str.indexOf('/') != -1) strSplit = '/';
					else if (str.indexOf('.') != -1) strSplit = '.';
					str = str.replace(/  /g, ' ');
				}
				if (str.toString().split(' ').length == 2) {
					var date = str.split(' ')[0].split(strSplit);
					var hour = str.split(' ')[1].split(':');
					if (date.length != 3) {
						return 0;
					} else if (hour.length != 2) {
						return 0;
					}
					return (new Date(date[2], date[1] - 1, date[0], hour[0], hour[1]).getTime());
				} else {
					var date = str.toString().split(strSplit);
					if (date.length != 3) {
						return 0;
					}
					return (new Date(date[2], date[1] - 1, date[0]).getTime());
				}
			}
		} catch (e) {
			alert('getDateTime Error : \nString = ' + JSON.stringify(str));
		}
		return 0;
	}
	this.getDateTime = getDateTime;

	/**
	 * Return time format "0D 0H 0M" from time in millisecond
	 * 
	 * @param {double} time Time in millisecond for convert to format "0D 0H 0M"
	 * @returns {object} Return time string
	 */
	function getShowTime(time) {
		var day = Math.floor(time / (24 * 60));
		var hour = Math.floor((time - (day * 24 * 60)) / 60);
		var minute = ((time - (day * 24 * 60)) - (hour * 60)) + 'M';
		if (hour > 0) minute = hour + 'H ' + minute;
		if (day > 0) minute = day + 'D ' + minute;
		return minute;
	}
	this.getShowTime = getShowTime;

	/**
	 * Return time format "0D 0H 0M 0.000s" from time in millisecond
	 * 
	 * @param {double} time Time in millisecond for convert to format "0D 0H 0M 0.000s"
	 * @returns {object} Return time string
	 */
	function getShowTimeSec(time) {
		var ans = '';
		var day = Math.floor(time / (86400000));
		var hour = Math.floor(minusNumber(time, (day * 86400000)) / 3600000);
		var minute = Math.floor(minusNumber(minusNumber(time, (day * 86400000)), (hour * 3600000)) / 60000);
		var sec = minusNumber(minusNumber(minusNumber(time, (day * 86400000)), (hour * 3600000)), (minute * 60000)) / 1000;

		ans += sec.toFixed(3) + 's';
		if (minute > 0) ans = minute + 'M ' + ans;
		if (hour > 0) ans = hour + 'H ' + ans;
		if (day > 0) ans = day + 'D ' + ans;
		return ans;
	}
	this.getShowTimeSec = getShowTimeSec;

	/**
	 * 
	 * @param {Number} timer
	 * @returns {String}
	 */
	function stopWatch(timer) {
		return "(Elapsed: " + getShowTimeSec(new Date().getTime() - timer) + ") ";
	}
	this.stopWatch = stopWatch;

	// ################################################################################################
	// ################################################################################################
	// ========== Tools Function
	// ################################################################################################
	// ################################################################################################
	this.fnTools = {
		arrObjToCSV : this.arrObjToCSV,
		clone : this.clone,
		cloneObj : this.cloneObj,
		createLogRecordV3 : this.createLogRecordV3,
		CSVFileToArray : this.CSVFileToArray,
		CSVSplitLine : this.CSVSplitLine,
		CSVtoArray : this.CSVtoArray,
		GenerateNonceValue : this.GenerateNonceValue,
		getErrorMessage : this.getErrorMessage,
		loadSavedSearch : this.loadSavedSearch,
		loadSavedSearchWithExpression : this.loadSavedSearchWithExpression,
		nvl : this.nvl,
		nvl2 : this.nvl2,
		randomNumber : this.randomNumber,
		randomString : this.randomString,
		strToObj : this.strToObj,
	};

	/**
	 * @param {Array} data array of object to create CSV content
	 * @returns {string} Return CSV content
	 */
	function arrObjToCSV(data, separatedBy) {

		// Example
		// [ {
		// // a : 1, b : 2, c : 3
		// },{
		// // a : 4, b : 5, c : 6
		// } ]
		// To CSV
		// "a","b","c"
		// "1","2","3"
		// "4","5","6"

		if (separatedBy === undefined || separatedBy === null || separatedBy === '') separatedBy = ',';

		var ans = new Array(); // "";
		if (data.length > 0) {
			// var columnCount = 0;
			var tmpHeader = new Array();
			for ( var key in data[0]) {
				tmpHeader.push(String(key).replace(/\"/g, '""'));
				// if (columnCount > 0) ans += ','; ans += '"' + key + '"'; columnCount++;
			}
			// ans += '\r\n';
			ans.push(tmpHeader.join(separatedBy));
			for (var i = 0; i < data.length; i++) {
				// columnCount = 0;
				var tmpLine = new Array();
				for ( var key in data[i]) {
					if (typeof data[i][key] === 'string') tmpLine.push('"' + String(data[i][key]).replace(/\"/g, '""') + '"');
					else tmpLine.push(data[i][key]);
					// if (columnCount > 0) ans += ','; ans += '"' + data[i][key] + '"'; columnCount++;
				}
				// ans += '\r\n';
				ans.push(tmpLine.join(separatedBy));
			}
		}
		return ans.join('\r\n');
	}
	this.arrObjToCSV = arrObjToCSV;

	/**
	 * Copy Javascript Array
	 * 
	 * @param {object} arr Array need to copy
	 * @returns {object} Return copy array
	 */
	function clone(arr) {
		var ans = new Array();
		try {
			if (arr != null) {
				var i = arr.length;
				if (i >= 0) {
					while (i--) {
						ans[i] = arr[i];
					}
				}
			}
		} catch (e) {
			if (typeof alert !== 'undefined') alert(e.message);
			else if (typeof log !== 'undefined' && typeof log.error !== 'undefined') log.error("libCode.clone ERROR", e);
		}
		return ans;
	}
	this.clone = clone;

	/**
	 * Copy Javascript Object
	 * 
	 * @param {object} arr Object need to copy
	 * @returns {object} Return copy object
	 */
	function cloneObj(arr) {
		var ans = new Array();
		try {
			ans = strToObj(JSON.stringify(arr), {});
		} catch (e) {
			if (typeof alert !== 'undefined') alert(e.message);
			else if (typeof log !== 'undefined' && typeof log.error !== 'undefined') log.error("libCode.cloneObj ERROR", e);
		}
		return ans;
	}
	this.cloneObj = cloneObj;

	/**
	 * To Create INT LOG Execution Logs Record Bundle in SDN POS Account
	 * @param {String} TITLE is record name
	 * @param {String} SERVICE_KEY is category of log
	 * @param {String} NONCE is reference key from other API
	 * @param {String} RECORD_TYPE is NetSuite record type
	 * @param {String} RECORD_ID is NetSuite record id
	 * @param {String} MESSAGE is short message for this log
	 * @param {String} LOG_CONTENT is content of log
	 * @param {String} ERROR_OBJ is object error from getErrorMessage() function
	 * @returns {Void}
	 */
	function createLogRecordV3(TITLE, SERVICE_KEY, NONCE, RECORD_TYPE, RECORD_ID, MESSAGE, LOG_CONTENT, ERROR_OBJ, ELAPSED_TIME) {
		var now = new Date();
		var contextScript = runtime.getCurrentScript();
		var contextUser = runtime.getCurrentUser();
		var obj = record.create({
			type : 'customrecord_int_log_exe_logs',
			isDynamic : true
		});
		obj.setValue('altname', nvl(TITLE).toString().slice(0, 300));// + getDateFormat(now, ' Ymd_His')
		obj.setValue('custrecord_int_log_role', contextUser.role);
		obj.setValue('custrecord_int_log_incoming_datetime', now);
		obj.setValue('custrecord_int_log_execution_script', contextScript.id);
		obj.setValue('custrecord_int_log_execution_context', runtime.executionContext);
		obj.setValue('custrecord_int_log_remaining_usage', contextScript.getRemainingUsage());
		obj.setValue('custrecord_int_log_mark_for_delete', false);
		obj.setValue('custrecord_int_log_service_key', SERVICE_KEY || 'UNKNOW_SERVICE');
		obj.setValue('custrecord_int_log_nonce_value', nvl(NONCE).toString().slice(0, 300));
		obj.setValue('custrecord_int_log_record_type', nvl(RECORD_TYPE).toString().slice(0, 300));
		obj.setValue('custrecord_int_log_record_id', nvl(RECORD_ID).toString().slice(0, 300));
		obj.setValue('custrecord_int_log_message', nvl(MESSAGE).toString().slice(0, 4000));

		try {
			if (ELAPSED_TIME == null) {
				if (typeof LOG_CONTENT === "object") {
					if (nvl(LOG_CONTENT["ELAPSED"]) !== "") ELAPSED_TIME = LOG_CONTENT["ELAPSED"];
					else if (nvl(LOG_CONTENT["elapsed"]) !== "") ELAPSED_TIME = LOG_CONTENT["elapsed"];
				}
				if (!!ELAPSED_TIME) ELAPSED_TIME = nvl(ELAPSED_TIME).toString().replace('s', '');
			}
			if (nvl(ELAPSED_TIME) !== '' && !isNaN(ELAPSED_TIME)) obj.setValue('custrecord_int_log_elapsed', ELAPSED_TIME);
		} catch (e) {
			log.error({
				title : "createLogRecordV3",
				details : 'Cannot get and set elapsed time. ' + nvl(e, {}).message
			});
			// nlapiLogExecution('ERROR', 'createLogRecordV3', 'Cannot get and set elapsed time. ' + nvl(e, {}).message);
		}

		if (!!ERROR_OBJ) {
			obj.setValue('custrecord_int_log_is_error', true);
			if (typeof ERROR_OBJ === "string" || ERROR_OBJ instanceof String) {
				obj.setValue('custrecord_int_log_error_code', 'NO_ERROR_CODE');
				obj.setValue('custrecord_int_log_error_message', ERROR_OBJ);
			} else {
				obj.setValue('custrecord_int_log_error_code', nvl(ERROR_OBJ.code).toString().slice(0, 300));
				obj.setValue('custrecord_int_log_error_message', nvl(ERROR_OBJ.message).toString().slice(0, 4000));
				var errStackTrace = nvl(ERROR_OBJ.errStackTrace) || nvl(ERROR_OBJ.stack);
				if (typeof errStackTrace === "array" || errStackTrace instanceof Array) {
					errStackTrace = errStackTrace.join(',<BR>');
				}
				obj.setValue('custrecord_int_log_error_stack_trace', nvl(errStackTrace).toString().slice(0, 99990));
			}
		}

		var content = JSON.stringify(LOG_CONTENT);
		var maxLength = 99990;
		for (var i = 1; !!content && content.length > 0; i++) {
			var setContent = content.toString();
			if (setContent.length > maxLength) {
				setContent = content.slice(0, maxLength);
				content = content.slice(maxLength);
			} else {
				content = '';
			}
			obj.selectNewLine({
				sublistId : 'recmachcustrecord_int_log_parent'
			});
			obj.setCurrentSublistValue({
				sublistId : 'recmachcustrecord_int_log_parent',
				fieldId : 'custrecord_int_log_content',
				value : setContent
			});
			obj.commitLine({
				sublistId : 'recmachcustrecord_int_log_parent'
			});
			if (content == null || content == '' || content.length <= 0) break;
		}
		return obj.save();
	}
	this.createLogRecordV3 = createLogRecordV3;

	/**
	 * @param {string} fileContent CSV File content to convert to Javascript Object in Array
	 * @returns {Array} Return array of object values, or NULL if CSV string not well formed.
	 */
	function CSVFileToArray(csvFileContent) {
		var lines = CSVSplitLine(csvFileContent.trim());
		var result = [];
		var headers = CSVtoArray(lines[0]);

		for (var i = 1; i < lines.length; i++) {
			var obj = {};
			var currentline = CSVtoArray(lines[i]);

			for (var j = 0; j < headers.length; j++) {
				obj[headers[j]] = currentline[j];
			}
			result.push(obj);
		}

		return result;
	}
	this.CSVFileToArray = CSVFileToArray;

	/**
	 * @param {String} csvFileContent csv content
	 */
	function CSVSplitLine(csvFileContent) {
		var splitLineKey = "\r\n";
		if (csvFileContent.indexOf("\r\n") == -1) {
			if (csvFileContent.indexOf("\n") != -1) splitLineKey = "\n";
			if (csvFileContent.indexOf("\r") != -1) splitLineKey = "\r";
		}
		return csvFileContent.split(splitLineKey);
	}
	this.CSVSplitLine = CSVSplitLine;

	/**
	 * @param {string} text CSV content to convert to Javascript Object in Array
	 * @returns {Array} Return array of string values, or NULL if CSV string not well formed.
	 */
	function CSVtoArray(text) {
		var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		// Return NULL if input string is not well formed CSV string.
		if (!re_valid.test(text)) return null;
		var a = []; // Initialize array to receive values.
		text.replace(re_value, // "Walk" the string using replace with callback.
		function(m0, m1, m2, m3) {
			// Remove backslash from \' in single quoted values.
			if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
			// Remove backslash from \" in double quoted values.
			else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
			else if (m3 !== undefined) a.push(m3);
			return ''; // Return empty string.
		});
		// Handle special case of empty last value.
		if (/,\s*$/.test(text)) a.push('');
		return a;
	}
	this.CSVtoArray = CSVtoArray;

	/**
	 * 
	 * @returns {String} Nonce unique value
	 */
	function GenerateNonceValue() {
		return new Date().getTime().toString(36).toUpperCase() + ' ';
	}
	this.GenerateNonceValue = GenerateNonceValue;

	/**
	 * @param {nlobjError} error Error Object
	 * @returns {Object}
	 */
	function getErrorMessage(error) {
		if (!!error) {
			var responseJSON = new Object();
			if (!!error) {
				if (error instanceof Object) { // Known Error
					if (!!error.id) responseJSON.id = error.id;
					responseJSON.code = error.name || error.code;
					responseJSON.message = error.message;
					responseJSON.stack = error.stack;
					if (!!error.type) responseJSON.type = error.type;
					if (!!error.eventType) responseJSON.eventType = error.eventType;
					responseJSON.remainingusage = runtime.getCurrentScript().getRemainingUsage();
				} else { // Unknown Error
					responseJSON = {
						"code" : 'SCRIPT_ERROR',
						"message" : error.toString(),
						"remainingusage" : runtime.getCurrentScript().getRemainingUsage()
					};
				}
			} else {
				responseJSON = {
					"code" : 'UNEXPECTED_ERROR',
					"message" : null,
					"remainingusage" : runtime.getCurrentScript().getRemainingUsage()
				};
			}
			return responseJSON;
		}
		return 'NULL ERROR';
	}
	this.getErrorMessage = getErrorMessage;

	/**
	 * @param {String} searchType Saved Search Type (Require when searchId is empty)
	 * @param {String} searchId Saved Search ID (Require when searchType is empty, NULL to Create new Script Search)
	 * @param {Array} filters Add Saved Search Filter (Optional)
	 * @param {Array} columns Add Saved Search Column (Optional)
	 * @param {Array} replaceColumns Replace Saved Search Column (Optional)
	 * @param {Number} startRowIndex Start Line of Search (Optional)
	 * @param {Number} rowAmount Size of Line Need to Search (Optional)
	 * @returns {Array}
	 */
	function loadSavedSearch(searchType, searchId, filters, columns, replaceColumns, startRowIndex, rowAmount) {
		var searchResult = new Array();

		var loadSearch = null;
		if (!!searchId) {
			loadSearch = search.load({
				type : searchType,
				id : searchId,
			});
			if (!!filters) loadSearch.filters = loadSearch.filters.concat(filters);
			if (!!columns) loadSearch.columns = loadSearch.columns.concat(columns);
			if (!!replaceColumns) loadSearch.columns = replaceColumns;

		} else {
			loadSearch = search.create({
				type : searchType,
				filters : filters,
				columns : columns
			});
		}

		if (!startRowIndex) {
			// loadSearch.run().each(function(result) {
			// searchResult.push(result);
			// if (!!rowAmount && searchResult.length >= rowAmount) return false;
			// return true;
			// });
			// !!!!! - run().each() has error
			// name: "SSS_SEARCH_FOR_EACH_LIMIT_EXCEEDED", message: "No more than 4000 search results may be returned a…c so that no more than 4000 results are returned."

			// --- New Search Solution
			var results = loadSearch.run();
			var searchCount = 0;
			var resultslice = new Array();
			do {
				var resultslice = results.getRange({
					start : searchCount,
					end : searchCount + 1000
				});
				resultslice.forEach(function(slice) {
					if (!rowAmount || searchResult.length < rowAmount) {
						searchResult.push(slice);
						searchCount++;
					}
				});
				if (!!rowAmount && searchResult.length >= rowAmount) break;
			} while (resultslice.length >= 1000);
		} else if (!!startRowIndex && !!rowAmount) {
			var runSearch = loadSearch.run();
			var maxRange = startRowIndex + rowAmount;
			for (var i = startRowIndex; i <= maxRange; i += 1000) {
				runSearch.getRange({
					start : i,
					end : (i + 1000 < maxRange) ? i + 1000 : maxRange
				}).forEach(function(result) {
					searchResult.push(result);
				});
			}
		}
		return searchResult;
	}
	this.loadSavedSearch = loadSavedSearch;

	/**
	 * @param {String} searchType Saved Search Type (Require when searchId is empty)
	 * @param {String} searchId Saved Search ID (Require when searchType is empty, NULL to Create new Script Search)
	 * @param {Array} filterExps Add Saved Search Filter (Optional)
	 * @param {Array} columns Add Saved Search Column (Optional)
	 * @param {Array} replaceColumns Replace Saved Search Column (Optional)
	 * @param {Number} startRowIndex Start Line of Search (Optional)
	 * @param {Number} rowAmount Size of Line Need to Search (Optional)
	 * @returns {Array}
	 */
	function loadSavedSearchWithExpression(searchType, searchId, filterExpressions, columns, replaceColumns, startRowIndex, rowAmount) {
		var searchResult = new Array();

		var loadSearch = null;

		var newfilterExpressions = new Array();
		for ( var x in filterExpressions) {
			if (!!filterExpressions[x].name) {
				var _name = filterExpressions[x].name;
				if (filterExpressions[x].name.indexOf('formula') != -1) {
					// "formulatext: NVL('T','')", "is", "T"
					_name += ': ' + filterExpressions[x].formula;
				} else {
					if (!!filterExpressions[x].join) _name = filterExpressions[x].join + '.' + _name;
				}
				newfilterExpressions.push([ _name, filterExpressions[x].operator, filterExpressions[x].values ]);
			} else {
				newfilterExpressions.push(filterExpressions[x]);
			}
		}

		if (!!searchId) {
			loadSearch = search.load({
				type : searchType,
				id : searchId,
			});

			log.debug({
				title : 'loadSavedSearchWithExpression loadSearch.filterExpression',
				details : loadSearch.filterExpression
			});
			log.debug({
				title : 'loadSavedSearchWithExpression filterExpressions',
				details : filterExpressions
			});

			// if (!!filterExpressions) loadSearch.filterExpression = loadSearch.filterExpression.concat(filterExpressions);
			if (!!loadSearch.filterExpression && loadSearch.filterExpression.length > 0) {
				var tmpFilters = new Array();
				for (var i = 0; i < loadSearch.filterExpression.length; i++) {
					tmpFilters.push(loadSearch.filterExpression[i]);
				}
				if (newfilterExpressions.length > 0) {
					tmpFilters.push('AND', newfilterExpressions);
				}
				log.debug({
					title : 'loadSavedSearchWithExpression tmpFilters',
					details : tmpFilters
				});
				loadSearch.filterExpression = tmpFilters;
			} else {
				loadSearch.filterExpression = newfilterExpressions;
			}

			if (!!columns) loadSearch.columns = loadSearch.columns.concat(columns);
			if (!!replaceColumns) loadSearch.columns = replaceColumns;

		} else {
			loadSearch = search.create({
				type : searchType,
				filters : filterExpressions,
				columns : columns
			});
		}

		if (!startRowIndex) {
			// loadSearch.run().each(function(result) {
			// searchResult.push(result);
			// if (!!rowAmount && searchResult.length >= rowAmount) return false;
			// return true;
			// });
			// !!!!! - run().each() has error
			// name: "SSS_SEARCH_FOR_EACH_LIMIT_EXCEEDED", message: "No more than 4000 search results may be returned a…c so that no more than 4000 results are returned."

			// --- New Search Solution
			var results = loadSearch.run();
			var searchCount = 0;
			var resultslice = new Array();
			do {
				var resultslice = results.getRange({
					start : searchCount,
					end : searchCount + 1000
				});
				resultslice.forEach(function(slice) {
					if (!rowAmount || searchResult.length < rowAmount) {
						searchResult.push(slice);
						searchCount++;
					}
				});
				if (!!rowAmount && searchResult.length >= rowAmount) break;
			} while (resultslice.length >= 1000);
		} else if (!!startRowIndex && !!rowAmount) {
			var runSearch = loadSearch.run();
			var maxRange = startRowIndex + rowAmount;
			for (var i = startRowIndex; i <= maxRange; i += 1000) {
				runSearch.getRange({
					start : i,
					end : (i + 1000 < maxRange) ? i + 1000 : maxRange
				}).forEach(function(result) {
					searchResult.push(result);
				});
			}
		}
		return searchResult;
	}
	this.loadSavedSearchWithExpression = loadSavedSearchWithExpression;

	/**
	 * If input data is NULL then return output data
	 * 
	 * @param {object} input Check null
	 * @param {object} output Return output when input is null
	 * @returns {object} object Return input when input is not null
	 */
	function nvl(input, output) {
		if (input != null) return input;
		if (output != null) return output;
		return '';
	}
	this.nvl = nvl;

	/**
	 * If input data is NULL then return outpu1 else return output2
	 * 
	 * @param {object} input Check null
	 * @param {object} output1 Return output1 when input is not null
	 * @param {object} output2 Return output2 when input is null
	 * @returns {object} object Return value
	 */
	function nvl2(input, output1, output2) {
		if (input != null) return nvl(output1);
		return nvl(output2);
	}
	this.nvl2 = nvl2;

	/**
	 * 
	 * @param {Number} minNumber
	 * @param {Number} maxNumber
	 * @returns {Number} Random Number
	 */
	function randomNumber(minNumber, maxNumber) {
		var length = minusNumber(maxNumber, minNumber);
		var rand = Math.random() * length;
		rand = Math.round(rand);
		rand = addNumber(rand, minNumber);
		return rand;
	}
	this.randomNumber = randomNumber;

	/**
	 * 
	 * @param {Number} minCharLength
	 * @param {Number} maxCharLength
	 * @param {String} type number, string, en, th, hex, HEX
	 * @returns {String} Random String
	 */
	function randomString(minCharLength, maxCharLength, type) {
		var ans = new Array();
		var charList = ' 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ๐๑๒๓๔๕๖๗๘๙กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรถฤลฦวศษสหฬอฮฯะัาำิี฿ืุูเแโใไๅๆ็่้๊๋์ํ';
		if (type == 'number') charList = '0123456789';
		else if (type == 'string') charList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ๐๑๒๓๔๕๖๗๘๙กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรถฤลฦวศษสหฬอฮฯะัาำิี฿ืุูเแโใไๅๆ็่้๊๋์ํ';
		else if (type == 'en') charList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		else if (type == 'th') charList = '๐๑๒๓๔๕๖๗๘๙กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรถฤลฦวศษสหฬอฮฯะัาำิี฿ืุูเแโใไๅๆ็่้๊๋์ํ';
		else if (type == 'hex') charList = '0123456789acbdef';
		else if (type == 'HEX') charList = '0123456789ABCDEF';
		var length = minusNumber(maxCharLength, minCharLength);
		var rand = Math.random() * length;
		rand = Math.round(rand);
		rand = addNumber(rand, minCharLength);
		for (var i = 0; i < rand; i++) {
			var tmp = Math.floor(Math.random() * charList.length);
			ans.push(charList.charAt(tmp));
		}
		return ans.join('').toString();
	}
	this.randomString = randomString;

	/**
	 * Convert JSON string to js object and return empty array when convert error.
	 * 
	 * @param {string} str JSON String
	 * @param {object} newvar Return this newvar if cannot parse JSON String
	 * @returns {object} object from JSON parse string
	 */
	function strToObj(str, newvar) {
		var ans = new Array();
		try {
			ans = JSON.parse(str);
		} catch (e) {
			if (newvar != null) ans = newvar;
			else ans = new Array();
		}
		return ans;
	}
	this.strToObj = strToObj;

	// ################################################################################################
	// ################################################################################################
	// ========== HTML Function
	// ################################################################################################
	// ################################################################################################
	this.fnHTML = {
		countLine : this.countLine,
		countLineBreakAll : this.countLineBreakAll,
		decodeString : this.decodeString,
		download : this.download,
		encodeString : this.encodeString,
		escapeString : this.escapeString,
		exportHTMLTableToExcel : this.exportHTMLTableToExcel,
		getScriptPath : this.getScriptPath,
	};

	/**
	 * @param {string} str text to count line
	 * @param {Number} numOfLine amount character in one line
	 * @returns {Number} Return amount of line
	 */
	function countLine(str, numOfLine) {
		var ans = 0;
		if (str != null && str != '') {
			// ans++;
			str = str.replace(/-/g, " "); // replce '-' to ' ' for check new line
			str = str.replace(/\//g, " "); // replce '/' to ' ' for check new line
			str = str.replace(/[ัิ-ู็-์]/g, ''); // remove some character in TH
			var arr = str.split(' ');
			var count = 0;
			for (var i = 0; i < arr.length; i++) {
				if (i == 0 || count + arr[i].length >= numOfLine) {
					ans++;
					count = 0;
				}
				count += arr[i].length + 1;
			}
		}
		return ans;
	}
	this.countLine = countLine;

	/**
	 * @param {string} str text to count line
	 * @param {Number} numOfLine amount character in one line
	 * @returns {Number} Return amount of line
	 */
	function countLineBreakAll(str, numOfLine) {
		var ans = 0;
		if (str != null && str != '') {
			str = str.replace(/-/g, " "); // replce '-' to ' ' for check new line
			str = str.replace(/\//g, " "); // replce '/' to ' ' for check new line
			str = str.replace(/[ัิ-ู็-์]/g, ''); // remove some character in TH
			if (!numOfLine) numOfLine = 1;
			ans = Math.ceil(str.length / numOfLine);
		}
		return ans;
	}
	this.countLineBreakAll = countLineBreakAll;

	/**
	 * Unescape XML format String
	 * 
	 * @param {string} str escape XML string
	 * @returns {string} Return value
	 */
	function decodeString(str) {
		str = nvl(str).toString();
		str = str.replace(/&lt;/g, '<');
		str = str.replace(/&gt;/g, '>');
		str = str.replace(/&amp;/g, '&');
		return str;
	}
	this.decodeString = decodeString;

	/**
	 * @param {string} filename download filename
	 * @param {string} text file content in text/plain
	 * @returns {Void}
	 */
	function download(filename, text) {
		var pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);

		if (document.createEvent) {
			var event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		} else {
			pom.click();
		}
	}
	this.download = download;

	/**
	 * Escape String for XML format
	 * // ' = &apos;
	 * // " = &quot;
	 * // & = &amp;
	 * // < = &lt;
	 * // > = &gt;
	 * 
	 * @param {string} str unescape XML string
	 * @returns {string} Return value
	 */
	function encodeString(str) {
		str = nvl(str).toString();
		str = str.replace(/</g, '&lt;');
		str = str.replace(/>/g, '&gt;');
		str = str.replace(/&/g, '&amp;');
		return str;
	}
	this.encodeString = encodeString;

	/**
	 * @param {string} data
	 * @returns {string} Return escaped String
	 */
	function escapeString(data) {
		for ( var i in data) {
			if (data[i] == null) continue;
			if (data[i] == '') continue;
			if (!isNaN(data[i])) continue;
			if (typeof data[i] == 'string') {
				if (data[i].slice(0, 1) == '"') data[i] = data[i].slice(1);
				if (data[i].slice(-1) == '"') data[i] = data[i].slice(0, -1);
			} else if (typeof data[i] == 'object') {
				data[i] = escapeString(data[i]);
			}
		}
		return data;
	}
	this.escapeString = escapeString;

	/**
	 * @param {String} table Tag ID of parent table tag
	 * @param {String} name fileName
	 * @param {String} css CSS of Table
	 * @returns {String} URL of download file
	 */
	function exportHTMLTableToExcel(table, fileName, css) {
		try {
			// ##### Define Variable and Function for Excel
			var uri = 'data:application/vnd.ms-excel;base64,';
			var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->{css}</head><body>{table}</body></html>';
			var base64xls = function(s) {
				return window.btoa(unescape(encodeURIComponent(s)));
			};
			var format = function(s, c) {
				return s.replace(/{(\w+)}/g, function(m, p) {
					return c[p];
				});
			};

			// ##### Get Table Data
			if (!table.nodeType) table = document.getElementById(table);
			var ctx = {
				worksheet : fileName || 'Worksheet',
				table : table.innerHTML,
				css : css || ''
			};

			var fileContent = format(template, ctx);

			// ===== OLD Solution (limit file size by browser)
			// var URLresult = uri + base64xls(fileContent);
			// window.location.href = URLresult;
			// ==============================================

			// ===== New Solution
			var BlobData = new Blob([ fileContent ], {
				type : 'application/vnd.ms-excel;charset=UTF-8'
			});
			var URLresult = URL.createObjectURL(BlobData);
			// ==============================================

			// ##### Download file with file name
			var pom = document.createElement('a');
			pom.setAttribute('href', URLresult);
			pom.setAttribute('download', fileName + '.xls');
			if (document.createEvent) {
				var event = document.createEvent('MouseEvents');
				event.initEvent('click', true, true);
				pom.dispatchEvent(event);
			} else {
				pom.click();
			}

			return URLresult;
		} catch (e) {
			alert('Export EXCEL Error: ' + e.message);
		}
	}
	this.exportHTMLTableToExcel = exportHTMLTableToExcel;

	/**
	 * To Generate Function URL on Script Client Side
	 * 
	 * @param foo Javascript Function
	 * @returns URL of Function
	 */
	function getScriptPath(foo) {
		return window.URL.createObjectURL(new Blob([ foo.toString().match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/)[1] ], {
			type : 'text/javascript'
		}));
	}
	this.getScriptPath = getScriptPath;

	// ################################################################################################
	// ################################################################################################
	// ========== Image Function
	// ################################################################################################
	// ################################################################################################
	this.fnImage = {
		failImgContent : this.failImgContent,
		okImgContent : this.okImgContent,
		runningImgContent : this.runningImgContent,
		startImgContent : this.startImgContent,
	};

	/**
	 * @returns URL Image File
	 */
	function failImgContent() {
		var data = 'data:image/png;base64,';
		data += 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2Afk';
		data += 'IaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBb';
		data += 'lCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G';
		data += '/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k';
		data += '4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRB';
		data += 'yAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXA';
		data += 'CTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQR';
		data += 'NY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2ep';
		data += 'O6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acK';
		data += 'pxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFos';
		data += 'tqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsb';
		data += 'xt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5';
		data += 'QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAq';
		data += 'qBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2';
		data += 'pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/';
		data += 'PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtb';
		data += 'Ylu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn';
		data += '7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz';
		data += '/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAACWpJREFUeNrMmn9wVNUVxz/3vrf73mY3m1+gSFDE4ASNQRHEHykoQmmd2lY7Oq3UQTvWKjoV7dSWUsdh+AdG+4d1FMbaTlu1tjPKWKsWiwgVDEEIjQQCpIhURbRYErLZH++9';
		data += '3fdu/3i72U0Auy8J0juTTCbz9u33e+6553zPOVcopQi0PA+E8H+AvtUra4yr5m3KffrxRdnDH+Ee/QwvcQzPyqByOYSuI80IMl6NVjeW0Piz0cfV77a3rJ9dtWhJLwBK+T9SEnSJsgkIIfA8hRDgeVi7/rHP6tzRaO/Zidv7HzzLAiEQmgZSIoQEAShQygPPQ7kuKIU0';
		data += 'TbSaMRgXXow5dXq32XzpFKQskBAEsGp5BDzPt47yyHRsU6n1r2K/141ybIRhIDQdpJZHC/lfQ7/KJ4QAz0W5OZRtI8IGxuRGovOuJzJtpkDI4veNmEDJ1mY6tq1Kb1q3yOrc4VvaMEH4pAjqhv6ODnxe2RYohTl1OhWz56+OTJt5z1BXDU6g8H8hSK57RSX+/DzKshAV';
		data += 'FcVdGa2Vt7ZKpxGmSfyGBcTmf12UYghGQHkgJH2vvDDJPfzh++mtm5BmBDRtdIGfiIjr4llpKq64msjYcWdHvvXdQwU8J/zIycCn2jbOdXZ3vJ9uewsZrfRffirBl5w1GY2TbnuL1Ht7P7Ja35w14KonWPpxbiMkmY3rLk+1rl/vHOhGq4z70eOLWkqBctEq41h7d+E5';
		data += 'zqYszK5smbvZxydOsgNCCISgq0mEUx1btzoHutFilV8s+FIerosWq8Q5sA/7nbc3dTWJcP5QixMT8DwFUL/0Kdvq3I48jeAHk4hjdbZT/7On7FKcgwnkQ1amfYtKbViLjMXhNIMvJSFjcVIb15Jpbx1IpEUCy5ZJpMRqfXNWYs2zoOnDi+un+lxoOok1z2G1vjkLKWHZ';
		data += 'MumHUdcFKel74RnV/9qLyMqA1hfCz67KC/A8wY2kaXj9CSq/dhNVNy8UAxELKUlv37Io3boBGYkEC5UiLwvsTHmpX0jI5VCOHVy4eR4yEiHduoHMjrbFhV2QALlD/1rlHusBLVS+ZaREZR1ERQxjSjMqk/58UFKibAutto5wQyMqncrrpyBuFMI91kP2w4OPAfDww572';
		data += 'wJlmjbWv66fKthDlWkUIH7weovbO+4nfuIDc4Y9wDu5HGJHjjSAlyrGRsTh19y4hNv8bOAe6yR76AGEYgTWU19eLu73zcXPWLEsaV17bkzvyCSJUpvXzbqNVVlO76EHM5ktBKWrufICKK6/GSyYGW7YU/H1LCZ3bgAgb1C76CZHpV6Cy2f8p2Ep3QYRC5I58gvGVa3sA';
		data += 'pLV3V/4lAaxv24Qbm3zwnq/xha5Tc8diKq66Jk9C5t3GRlZWUXffUsKTzvfrglwOGaskes1Xh6FiJSqbxdq3y7ePc6AbEQqXH0U8DxGpILP9bRIvPutbOx+biyTm4KWSKMdBxquo++FSwudO9snik3X276X3d0+W77YlWk2EwjgHuv1E96Pmycv8RBbsRULTsfbshFwO';
		data += 'o+ni4hZrGpFpM8kd+RSvr5cxDzxMeOJ5efCA1HD27+XokyvxUkmEHgoYUgVCgLIt9LozduvFkBY8ecmKGInXXkShqLppYYmi1Ki+9Qd4/Qn0ceOLoVlq2Pv30vPESrxMGhE2hqFw1YBrikjkUV05DsKMlO9CpS9SIKMx+l9bA0pRdfNtvjsphayIIqMxBhSkkNj/3EPP';
		data += 'kyvxMhlEODx8eS4kKmvhpZKTdOXmfIE3LPWgwPN3Irn2JcjlqPr29xgo0EsqKmt3B71PP4ZnjRB8IZC4Ll4qhfT9f0RCBaQATSPTvgW3r/d42QBYHe/g9nyGNMyRF0bCd1Xl2EMKmmGWgcrKoNXUMWbxQ2g1dUXLlxzO6lvvQuVypN5a56tdb3TUrvS3ewTgbQutpo66';
		data += '+36OXn9O0bqlHYX8Oai57R6iV88v5okRbDpSIsIGUgxXPg9omzHULX6I0ISJRasKgbWznb4XnimSyNccNbffmyfRP3wS+XAto1F0EQ4Hj0BSojJptLozGLP4IfTxZ5eESom9p5Pe3/wSt7cHclmqbrlj8E7cfi8IQWrj68hYZXAD5pOZjMYO6iJs+I2lQmetTCEXmjCR';
		data += '2rsfRD+rPg9e+XF+z06OrnoUsg5adS39f3sZpRTVC74/mMTCRUjDJLnx9fJ1WOEEKxdhGKhM5kGpjT3Tr31F+SGMXA5t7DgfvFJ+71Nq2F3vcnTVI5B1IBRCub7mSa77C8f+8PTAuSgUUaFzJw8rAqmcizZ2HOaMq9bIcEMjKuuULyUKWmhHGz2rHvFltaZj7e7g6OpH';
		data += 'IZuFUKjoUp7nk3jjFY499ysfg66Tbvs7vb99wm8GB05iDuGGRoSmoZsXNJPa8Ndg58DzkNEY6Xc2I8JhIjNa6Pn1Y6hs1neHoXG+hIQI6YQmNvjgpVZMeoH8P4Q5pdnnc2zFihqr/1BP7rN/B/TFwnnI+gpTan7r8fM+X/q8pgcHn/+8PvZMzMoJtVVLlvQKpRSJl55X';
		data += 'iZf/NLwEU1qMlFsQBXl+UPTT8JIJ4t/8DvEbFwg8z+8Lhc6ZdL9WXQtugOpoaAu+XDBBny8l7mbRqmsInTPpfgCWL5cjb6t8UStv/ePbKsuXSwBjfP3s0Fn1KNsOvgunegmBcmxC4+oxxtfPLli/OB/Is8m0t6qe1b9ARCpOfSt9GJm/9u4fE7msRZSOoOTAYEEpIjNa';
		data += 'RHTOdXjJRPD4fKpWviMXnXOdD37INLPkLykAPl5xl2FOnYH7f0BCaBpesh/zksv4eMVdRinO4wkopVCKpi7lGJd/aXa4YQpusv+0kRCahpvsxzj/Asym6c1NXcrJRy918gmN8Ju0lS1zN0sp5wlNW293d/n5YbjTyGEcWITE7U9gXjiVWMuc2WbL3N0nm5OVMeT74P30';
		data += '1s2necinThoZyxizkh+z/hFlW36EKhQoowkcUJk0wjCJ33BLfsx6guxdNoHSrCklVse23yc3rl1od707ioNuvwVTGHQbTZcQm3PdM+a0mbeNfNA9RE0WxqyZd7ep5Buv+q29rH9VYNhXDRwbETIINzQS+/L1RC6ZKQbGuaNy1WCwxU5w2aO90d7TOYLLHlMxL55x0Lzo';
		data += '0vNO7WWPobsx9LpNy7y27OFDjblPDuEePYKX6MPLZFBuDqHpyEgEGa9CqzsD/awJhMZP6LZb1185Gtdt/jsALBPy5okl/kwAAAAASUVORK5CYII=';
		return data;
	}
	this.failImgContent = failImgContent;

	/**
	 * @returns URL Image File
	 */
	function okImgContent() {
		var data = 'data:image/png;base64,';
		data += 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2Afk';
		data += 'IaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBb';
		data += 'lCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G';
		data += '/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k';
		data += '4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRB';
		data += 'yAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXA';
		data += 'CTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQR';
		data += 'NY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2ep';
		data += 'O6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acK';
		data += 'pxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFos';
		data += 'tqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsb';
		data += 'xt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5';
		data += 'QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAq';
		data += 'qBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2';
		data += 'pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/';
		data += 'PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtb';
		data += 'Ylu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn';
		data += '7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz';
		data += '/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAB8hJREFUeNrMmk1sXFcVx//n3vfezHjGHzOZOLGx07iJaWlIlMYURwIq1LSEblqlFIklSC0CCouGIsEGRWyoBIhEUFiEBRsQaloWbKBRIlVWUsXQOElDExwHKIm/MrFnPPZ4';
		data += 'Pt579x4W773xzMRJZpwZ10/yym/u+/3Puffcc+65xMxo9GFoEAgAAQAu33g93h1/+q95JzWcs6dQsOdQUotQugDNCoIkpIggJDsQsZKIWZ9Am9k9msqcenb3th9mglEZDIJoiIUaEcDw3iUQGBq3lsbOzS9fHp7Lf4iik4arCyAiEAwQiQqRHhyzBsMFM8MQEYTNBJJt';
		data += 'u7Apunt0S/u+/QRR9Y2mCvCsLsDQSC2N8UeZd5ApTECzDUEhCJIg8q3HAUbNxwCAyH9FQ7OC5hIEWYhHBrE9fhDd7fso+E493qhDwIprZ5dGfzaZPfPa7dwFAAQpwiAieGM0PhUBKv9e6SIAxubY4+jr/PzPt7YP/6B2qjYswAP3PvTf9N94Yu4tuLoIU7SVvdKsJ7C2';
		data += 'o/MwRBiDyRcxkPgyBRP3blPqrgI8eMIHU3/o05S5Ob34HgwRAZEEc/PA7wAiAWYFVxfQ2/E5CCm37NnyrVTAU/uIe8HfzJz+Qt79982p7FmYMgZAtBQ+WBuAgCljmMqeQaE0f+uj+ZPDXuC409jG3eD/l31n31T2vZGF4nVYRgeYFdbvYTAzLKMD8/krUGyfI+ahh5IH';
		data += 'x2o9IWodSCBodpBavHR+oTgBU8bWGb7SGwqmjGGhMIFU4dL5Ex+S5S9qWlUAQzMAXE39kVO5CzBl+8cGXy2iHancBTyW/H2pkrNKQBCyZpZG+UbmFKwNAF8pwpLtuJE5hZmlUQ420goBRwRBYHLx5PC122+CSK4xrrd2XRBJXLv9JiYXTw57YfeIEN6/fqwBYLmYPpez';
		data += 'ZyBFCLxuAqiutIHBkCKEnD2D5WL6XMAtAutPZ8++NJkdgSEiLQ+VlejMLlwu1ZU2MGsYIoLJ7Aims2dfIgiIwPo5Z+Z40V2AWKfpQxBwuYSwEUc8MghHL6/kUvfwgyCJoruAnDNzvLwTn7nxelyrdDpvpyDIbLkAIgGlbZiiDZ/pfw2xUB/en/wF5nIfwJKx+0xfL8y3';
		data += 'md0QRiIhAGBn4pnZvD27vvAyiqH+76Mz/DAkWdjX+z1sbX8Cip17Jm+eF0zknVnsTDwzKwAgs3zVUtoFEa0TfAxDfYfRFd7hp9UuTBlDf9dTdY5DUNpFevmKJZgVMsUJSGECzOsE/2oZHgAEGcgUxvHP2d/VV5ExQwoTC8XrMG4ujhzI2ykvy2zR9AngLd/yneGHy/BE';
		data += 'ApnCNYxNHYOjliHJui8H+3tC3k5BhGTsR5rthmvRihrr3gUHCShdgiXb7w4/eRSOykNS/fsPQUBxCUJp+4DSdt01aHUMV37m6K4qZAW+A0N9r64Kf37yKByd9y2vG/q+1g6ErXLQ7FYmeHX9WLELIomhvsPYmTwER+fL1Vv98L+EuwZ4fxBodmFobZeLtnrxNRSksLC3';
		data += '9xVsatuFTW27oNnFxNzbMEQbiCSULvrwh9EZHqiBH8f5yaNwdWFt8D4Hg+8saOqtmvb0fhObo3ug2QWRwGDyBQCE63Nvg0jAkl0+/PYq+HRhHGMPDF9RUgph+fO/sQg0szgKpYsQZJQjw2DyEHYmD8GSnavD55sJ71VmhiVjHkTdewBDkomp7AgUl7C35xVIEcAQdmx6';
		data += 'Hv1dTyFsxMuAHvy/MDZ1rGmWBzMEGRAS1mkPoLETOsvoxOzSP3Bx5g14Ucw7jBIkfXgGuBL+KFxdbA68zyCECVHi3E/FGgYNqqQVESWsHA0ywOzDX/XhS5BkNu0siaEhKQTR3/Hk6TarG8yq4b2gSsT0igjNugL+WNPhgz2ozeqGIJKIhwehtNPQXnCHiNz7uDj9Blxd';
		data += 'hCCJ+fyVlsAHe4DSDrrCO738IR79lC2FAV5jMlfpicszx5HKXcKFqV/5c77J8MECFgYS0cfslYLGTafzzoMVNN4O7ZQjj0ArEsTqgoY0KxAErs29xRO3/wzLiD1gTUxVS60Vma3t5jC4+QV8MvkiCcJPBADEzJ6Xw0YXNKsG0orV48PKH1pgfYWw0YWY2fNyuSYOmgnj';
		data += 'qT/x9fRfNtShVrX1JRy1hB2J5/BI99eIob1FHHghGk7sj1k9fjikjQUPgtIlRK0ehGRif8Bd7g8EXphZGuWLU7/2zoegN5AAAVcXsLf3u+jpGKaAV1S+wGD0tA/TtvjTsNWSf8S4MaaOrZawLX7Ah1/pZooalQQAV+a+HuqO7YWzAUQE87479jhOzH0jVBvnRO0OwWB8';
		data += 'dRfb3ZG9Q13hQTgq97GJCODjkUfQEXn00SO72EZN8WWsmmeA8VDy4JiQxpOC5Mh8/ioso/0BupFrWLJEsN1FJKOfxpboE/u3b/rS+Gp9svs2+cZvnRgoqFv/2ahNvobbrEoXYbSwzerqPKQIYzD5FQwknl17m7Vaht/oXvz7b25m3/323PJlAGhBoxtIRnejv/OLv93a';
		data += '8dnvPHCju7aAaPZVA2blHU6Rha7IIAZac9Wg2l5eg+0+lz3IAGGVyx7QYL73ZQ+vWBfEdRbp1MzrNsvOreHl0jQKjnfdxtUFMLsgMmAE123MJKKhXkTNLU25bvP/AQAIaLIIDkaWxAAAAABJRU5ErkJggg==';
		return data;
	}
	this.okImgContent = okImgContent;

	/**
	 * @returns URL Image File
	 */
	function runningImgContent() {
		var data = 'data:image/gif;base64,';
		data += 'R0lGODlhKAAoAPUJANze3Nza3MTCxMzKzMzOzNTS1Ly+vMTGxNTW1Ly6vDQ2NFxeXCwqLCwuLAQCBHRydCQmJCQiJFRSVFRWVAQGBGRiZGxqbBweHISChAwODGRmZBwaHHR2dLS2tBQWFKSmpGxubIyKjBQSFKyqrERCRAwKDERGRHx+fDQyNExOTKyurJSSlJyanHx6';
		data += 'fFxaXKSipLSytExKTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFBgAJACwAAAAAKAAoAAAG/8CEcEgcAhCEgYCQQDAipocKUaxaqwGlQWAwDJobh9ixsRiu6GG2u+0KvojwWJxZfNNFQMHdZsPl';
		data += 'c2IeKwB4QgADfVxtb2CBgQsBhgEHfH1df49zkWkAhZRci4yZmg6cAYVViASfi6JbBU0SERSPpwdMVXsGBJKUbAIFAZJqBhyAnAiVBlREAaFercHEVwUcFLeM1AmJo5/baQK+ldC5CQGXmKmGztDaQgSWoeDsCK5sBrEA7myx7FXx+IQ6gi+UgHX/1Ah4tQXJQnz5ElpJ';
		data += 'xK9AN2jiJGIpuEXLq4Maizxj+OaAAJNK/IUkoqTlmzsrY8oMOeCAzZvmZBK4edPjlq+BM5/9bHPgIjB6Eu0Bw0RA1CKVK+O5C4Yg3UKk7ISmQ4WxX0ypSzM25ZhRY9V7sISgYzgA4T+hDKl18+MLaxUErSxBHYlp3BK3Ipu2PbdsC7g9bz7NXTKMyJGx6s49pIdo8Jqu';
		data += 'SxIgwsyrFVTHeRli0kzSzQBfgJ2ZhAjtyz5GrAfjQQS7oOupsFn9K4B20e10bj5P0mJbskBYdvEE4N3ntlNhM9UuT0m4qLDkQ4IAACH5BAUGABEALAIAAQAmACcAAAb/wIhwSCwaiRrBcclMMIelp3RKrTqrWKbgmu1uBYYsIYB1KrMHhgZA3R6E7CEi0vIYDw2Hg1Ul';
		data += 'SBEPRHh6Dht+RVxdQ2mEehWKUgMQjXoZb0MJYGCQHSWUeoFCZomKD58OEHMRm5BEBR6nHRGjrUSmnydDYbVDHacSQ1u8Qggbnw2XBweHvAsKz9Apw9PU1dbXs9ikXKTTpGdw1luq3ZADRJsHbFes1Jm7EQbCwq2XXGeH9HG1mgnMRAT2GShAJosSN1IEgIMkT9WSAwbk';
		data += 'weuyDMvCJ1z2PZEnZIvEi5hWRTTwb8m/URGLcBTyEdI9I2ZWlZOSryO8SyzbKWLWLWZJCkVs/FTUiEAjkyAAIfkEBQYAAAAsHAAVAAwAEQAABU8gIAKVYp7SWGxO6zZj587TaM0uJhIe3iYijc/BQAA+QwdHNID4MoNRE/cYMZ2tS8EqOjQclA93dGBUuQZCAKC2GgTv';
		data += '6BgOH4ve9pFAng8BACH5BAUGAAAALBQAHQARAAsAAAZHQIBwCEgEAAeiUkioOBbHpRAB04gcWKjyFTBtsOBsdIj4hsMLZfl81k7NbCxnvI5fXmo4OPMgLOtYEC0DUgABCigTGAZjUkEAIfkEBQYAAAAsBgAPACAAGQAABmlAgHBILBqJoKNyyWw6n9CodEqtWq/YrHbL';
		data += '7Xq/z0EHalgmhwMI5VHgph3wDaiDILadHzQDzo8/hDFTB3t9fRJCHlIDDYWFh1QBGo2GVgErG5MOj1YEGhmNm1cHDxCUWwgJJxMoFgB1UkEAIfkEBQYAAAAsAAAVACEAEAAABmlAkmJItACOyKRyiVxEHNAoJMCsMhEAUzRKEVi/ysc2egKbAaox9II9WxEXtYPj/lrk';
		data += '3TpylDSU1AtUegAHDEkLYy6Cg0sDHlELWIWMSytQLlgEhpRKAQuBhA2cTAGCoqNVmqiroyweq0EAIfkEBQYABAAsAAAGACAADQAABmBAgpCACAyPyKTyGJhUjMuoNORwLIYCg0EgkEYPoqoVevBKARNxdQFFmJcJinoNfSsr82pmYFciPHkOGH1IIAQjgRBuhENuIIGD';
		data += 'jEcPJHkUZZJHF3kQdZkEJAqioxafR0EAIfkEBQYABAAsBgAAABQACwAABlBAgnBIQIxApsiCyBQCEhWPY+qQNImHSYlKtV4DIRGX62UiJuNxmThopMlXwoHxnq6ZB/eYAjkRAnEHEFQRJwIIRIAcG1gMFCeIcVcDBpJEQQAh+QQJBgAIACwUAAAAEQALAAAEQBAcMUgA';
		data += 'KOsNhDGeYG1cmHzgEJBIh5pgQboeeKIElrk26FO6Vsj3G2AGu0GNaDBmGpxAQXACsmYESmbAuG4u3ggAIfkEBQYACgAsEQAAABcAJwAABrBAhRBwEAwIAYBwyWxOFAGBwSAVIJtYxTNwoCam1EEgu9xKp9WvoKDMmqnoL5jQdioA5zzcWGduu2l7A0pJTBFDA2dwU4NQ';
		data += 'BwRkdwEFeY1RUwiRQwRGY1x7Y5pQY0RoVJCiQp95CQKhogisYAWpQgReVVR9kXhgAnKvopx7p7VQamoGA8a9iwYHxgoEB9SJA8vR2drbCincSyjf4uPk5ebn6OnRT+Ls3+7c8Nvy2vTRQQAh+QQFBgALACwRABUAFwATAAAETnDJSSs5OI/KJxCGAIJH1yFGGibGZloj';
		data += 'CxYvFcRgGtQTMaYjAG+ByCV+tOEtBDzuhovlykCATgIHoEBolUgRXdshGb5yy+i0es1WUNzhCAAh+QQJBgAKACwGAB0AHgALAAAEU1CpJau9NgDM+w2EQUiAUFHK4FUBQggGPGzKYa4WMMCw4QsziWCEkwR6saSPQCtWSspYghd0Gnu8hNRQsD55UizCy8JqY4UA+bs9';
		data += 'pNeZw2Hw9kQAACH5BAUGAAoALAYAHQAeAAsAAAR/0LkVVEAq670DsIJhCMmEBYdRVFxHGMSHisKCAWFOBGwGIIScYSAThCqoEI1GUAAGwtGICGoiUqPEcuhUZkWimAUwU+a0gkH3KwxRncGEEi1S47akvFhTaC/tflICGC0BcVJTFlh5IzstLmdcOCQ0K4+PZAUDB00A';
		data += 'BwcDKx+XEQAh+QQJBgAKACwAAAoAKAAeAAAFuKAijmRpnmiqrmzrvnAsz3Rt32SE73zv/4ODcEj4jQQGpEAJsAVQA0MyIRU8bciEyCAiCKhTQ+GWDAsKiDIyKWjaylMEQJlYi2nR9frQ/VarVzFwXyUBVVRfA24xfApgXCQEhwaKIoErCCV0hUtSBIsvAgNHUweXCgVJ';
		data += 'lQGdLpAkSScAA5VbgypKBkUijbJNrINSKZOiNYgoUyOeL2qIWil6r4J+SibHjmc0wSd/Y0YkS7s74iaZLSEAIfkECQYACgAsAAAAACgAKAAABf+gIo5k+ZRoqq5s675wLM90bd8pAOAxMBA7BYPHKhgMBNGAqAoIDM/BbgBhlgZHQUIgVWBhgYACcMhCk6IA9Mjuzpxr';
		data += '6FasIGS3a7oM8ZSzC2NPWn6ANQSDglAACGx9AgJBNHBxWgGHiAkGhTaHd0cFWHFQejWMWokDiXKQOHCOCQcDB7MCs2g4BAe1s7FWvr6yvLZEucKxiY+KrYKJsZ6jOHwGmX0/g4S4a4gFppSsNZOvCACCeJ82WI5HBzuHmZSkMN2rmmmeWm4yAWXX0CJ2frqEkbfDlZxb';
		data += 'Cpz0AZKwTIF4JSxxKVjuQDwjExMmOzNwxKJORwQKQoDCh8AylM5TjEmlbQ3DfQhJ6NCYsk0gNvcERkqxjxI1KEvIaft5hGELAHbK+TEQVJ1Toy4KvNLW1E85AZvAdFK3pGfKhzYkBgyESAABiDQAWJKVhEwsbjtXhAAAIfkEBQYACQAsAAAAACgAKAAABP8wyUknQGQI';
		data += 'ksARAxEAVWmWgWYIhjF07LqKZz2lrby+QZzvAVsJUGixfC7YUbcqkISdgS525CFlMcLTFjgYv7kXYIlkDbYmAKm7/IJgTN05MUqH1tSfoEBXXeddHCVFBjRdOXsBQRYBBD6AAix8FD0ykIlcBSBBOCsCixJSWICgQop9YIJ0cS5oUBJsiCuLBGBHpa+rcRtwV5O5FLVg';
		data += 'Kxd6nq7APWUGjZE/Br/AFCpTGW6z0iUIrH56yNKVWDsfHxrR2RMDGiAgL+jv8PEJAwf19qrxBPb23c4C38mOLDkgyscneQgMtgihEJq8Wm32bCtz8F04JCPI5DgHDKKsg46BjFWUNtHWpADcAHJpkwOUqDCccNVAgAdMNGULOX3QwsURIC9GcBUBseblhlMWMDzCw0Im';
		data += 'AHVFxR3h8FQjC549OEpQQ4flDzFXqAzgpJLOh2dLwIrTM0fI07WI1OZZwvOVJlsLez1rki1FWCvXMFm8GwOswQIy0SkqYM4sQcSJS0QAADs=';
		return data;
	}
	this.runningImgContent = runningImgContent;

	/**
	 * @returns URL Image File
	 */
	function startImgContent() {
		var data = 'data:image/png;base64,';
		data += 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2Afk';
		data += 'IaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBb';
		data += 'lCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G';
		data += '/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k';
		data += '4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRB';
		data += 'yAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXA';
		data += 'CTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQR';
		data += 'NY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2ep';
		data += 'O6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acK';
		data += 'pxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFos';
		data += 'tqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsb';
		data += 'xt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5';
		data += 'QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAq';
		data += 'qBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2';
		data += 'pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/';
		data += 'PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtb';
		data += 'Ylu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn';
		data += '7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz';
		data += '/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAACZZJREFUeNrsW3tQVNcZ/5279+7j7oVlgTUGkMVHFGISTS2MA21ME7EGOqmdjn1YNZjxkWhN7aTEBDLT9A+cVCejo6NJYyfBZ6ehnZqZSjvi1JiGJgWNSTURjLGALKEiuyzs';
		data += 'vfu6d0//WLh7kZfiXl6T7y/OuXsu5/e75/vO953zfYRSCj0l1FX3ayXQ8krYdxmy2ABZvAIl2I6I7AWVewAAhE0Aw9pgME0Ha50L1poNTsiBwZz5ijEp7zd6zo/oQUDIe576vzoO/41qyGLDXb2LtWbDMq0IlntXwWhbRCYsAeHOs7mB7vo6qfVthH2f6/K1OOF+8Bnr';
		data += 'YE7MzeNSltRPCAKC7trCoPv0KV/TXkTC7oH/gDGDS1wAo20RWOs8GCxOGEzTAWKoJ6C1AEBBCkCVXCXYDsXfDFlsRMj7McLdn4BGAgPeyXDJELKegyl56TJTckHNOBFAIboOUW9DKSKhm/1fyibA4iiGeVoRWCH7OCj9bHSzI/fJvsaSwI2T8HecVG2GSoQxFbbsXbCm';
		data += 'P0UAMnYEhLzn/tJ1eduKkKf2Fn29D9YZG2FKfvQEEKmPs7YuDLrPrhSvH4QsXun3xGgvQFLO7iqjLfdHuhPgb6+inovrEZG71T6DOR0Js16EMSlvBwAR+oo11FVX1nPtVSgBV2w1sImwP/h7WKavJDoRQOFtKKU9/31No98crDM2gM9YVw0aqcVYCmEKpNbKIvH6m6CR';
		data += 'sNqdMPN52LJ33bZK3BYBXU2VSRFvjUdqOx776pZM2B94AwyXUo5xlEi4s8Jz6Rko/ha1j09bBcZWaE/KKum6awK6miqT5Jt/9AQ6/q72mVMLkThvx79AIycxEYQwxd2NZfmBm7ENwexYDjb1xyOSMAIBFO5P11Cp7ZiG3dUQsrbuAtCFiSVJvqZ9pVLbUc1cf4bkBUeG';
		data += 'VQdmuDd6G1/qB96a+SyErK3lExA8AHQJWVvLBedmtUNqOwZv44vDLnFmaGv/J9pz7bcxNtPXwppRUo4JLnz6U+V8+lq13XNtJ/ztVfSOCAh56495Lq5X26bUpRCcW3Zhkojg3LLLnFqotj0XNyDkrT92mzaAouOjR2jQ84Fq7VO+8eeJY/DuwDB2fvzD/L7dwWT/FhyL';
		data += '3x9gDwasANF1SAUPwsE+/3VMOvAAQCMn7Q+8ARAuGrN4PoDYWkmHVYGgu7bQ2/BCbCllbgRjTC3HJBWGSykXMjdqjPp2BN21hcMQcPpUJNShurd8Rkk1Jrnw6SUnDOb0qNMU6kDQffrUoASEu95b6GvaG3MpZ23HmLu3+viK9QmztqstX9NehDvP5g4gIOA5d6EvnjdY';
		data += 'nDDZF+/BFBGTffEeg8XZ6zq7Eeiur7uFAArx+puabWQzKKUdU4UASmmH1kESW34HgMYICHk+pLL4RdTwG3iYUx6rwRQTU8pj1cTAAwBk6SpCng+pSoDUXqUJIp4ApZH3phoBoJFas6Mo5ia3vxNbAdpIz3LP9zFVxXLPk+rffZjZkLeuQj26JixYIacaNKLfh1CkCqnt';
		data += 'OIKdZ6AEWmJGN/lR8GmrQAy8bn4HK+RUg7BFoHLvwWvdTkbxt5SpZ2uJC3Xb+ihIuq/l9YqOuschXj8IWboKGgmBRkKQxS8gXj+IjrrH4WveVwFC5uulBsbEhWpTkZpKmXD3J2oHZ8uFXuC7G57fLLVWYtjVRSOQXEfR9fkvV1GQdD3mosUY7vkPmLDvcuyhkK0LAWLz';
		data += '/s1B9z9v+/chTy3ElgObdSFAgzHsuwxGCTSrHQZLlg46L1ZoT2luVyTXEVBFrIj3fLQYlUAzGCXwVeyh0RF3AqS2PwBUGQ1z0bHxJkCDUQndBBNRejQhtDHu3l+w88y4jB36mCCGkco+MNrrJj0cIK2KjeXYod3iGEaq9Ax/KDr+pzpG/c8MCJugbebHXefMzrsYm6EH';
		data += 'ZBUjMSSAYQwaAmgo7nuvKeU7ox+b/G0dnJIYRsIKYAzmezVWMf4RMJ/2E4AYRrH8DeDTfhr3+WgxGoypYLRLVPE3xV+NDUI5n7Z6FMStBjEIcY8LtBgNZicYTsjReEYNuhgaq3PLgTtZzkZ7AazOLQf0mIsWIyfkgOESHoo99J7Tx5iDuhKzXzvAZ5QAhBlukwafvhpJ';
		data += '9+8+TkBduhDgjeVtcAkPgTHwWeqNT6j7AkCYAr1IEDKfLXfknYZ1xnqw/GyAsCAGHqx1Hqwz1sORVwPBubV81Ck1I3tBBSFN8MdaZu4hlFK0v59NZbERAJC84DBY67xJexcwnMjilQr3p2ui4K1zMf2Rxuh6NDuWqz/y/+/dKXsipMVmdjwR9QoAgJ++UnNU9Dfd1GB8';
		data += 'vUqmINARu+fpw8xErW4+Yfk5fUdWCHb+o2iq4Q92nimiihRd/vwcGO35RCUAILBmblJ/7Gs+AEKIY8p8fEIcvub9sW05cxP6bonVPcmcmJvHcPZeZ6EZQc9H26bM1/f8e5vij0aWDGeHOTE3T40M1D0xZUm9kPULdVA0O4TJnfzwmdyea6+qLcH5HLR5xkz/4GPpMqb3';
		data += 'xEQJuCC5KldMdviS69CKvoRKxuiA2fHdH/RTj1szRMTWt6nn4tO9TzmkfvPdcc8FHK1Ewu6Km+eeBGg0kdL+4FuwZqzrlyIywC+1ZpQQo713F6RheC49AxCmeNIZPjCFnkubVPBGewGsGSUD8uWYwYYm5eyuYlhbr0FsQXdjWT6ApEmEP8l7pezRvvwghrUhKWd31WD5';
		data += 'gkMmSvrbq2jnhVjyNZ++FoJzy6RQBV/z/grJdVhtpzz8zpBJ1EOGZpbpK0nCzFKNMTkMyXW4YqKDl1xH+oFPmPmrYTPIv06VHdGU2JbatcGS1HYU3VdeLp1QhpEwxd1XXu4H3uxYDsa21D5S2vzX6fJ3XzCxEXx6yYn4l8iM7OFJrsoVY1IwcevuMGjJzOyXYLTljk3J';
		data += 'jPdcWc+XO8a6ZCYmQxdNzYV1xgaYUpYcj/uxFiHzg51nV4170ZRWJcTWSuptfGHwsrlp34PZUQRWyB59PRFhCmRfQ1Ggoxr+G38dvGxu3s5eD28My+b6hZru2sJgZ80pX/O+QQsnQVgYEx8GZ1sElp8Flp8dvfIiTD1opAYEIYApBo3kKoFWyNKXkKVrCHvPRw9pqTxQ';
		data += '+7lkCM6fw5SybDwLJ/tLrHT2LWizTuIpnJADPuPpiVU6O7iNOE+ltiMI3DgJWbp6V+9i+TkwTysGn7ZmYhdPD0mGWj7/GWRfI2Spt3w+7AFVJBDCRS8pOTsYzg6WnwtWmAdOmD8m5fP/HwC5O2WYQouzbAAAAABJRU5ErkJggg==';
		return data;
	}
	this.startImgContent = startImgContent;

	// ----- Display Type List
	var DisplayType = {
		NORMAL : {
			displayType : 'NORMAL'
		},
		HIDDEN : {
			displayType : 'HIDDEN'
		},
		READONLY : {
			displayType : 'READONLY'
		},
		DISABLED : {
			displayType : 'DISABLED'
		},
		ENTRY : {
			displayType : 'ENTRY'
		},
		INLINE : {
			displayType : 'INLINE'
		},
	};
	this.DisplayType = DisplayType;
	// ----- Layout Type List
	var LayoutType = {
		NORMAL : {
			layoutType : 'NORMAL'
		},
		OUTSIDE : {
			layoutType : 'OUTSIDE'
		},
		OUTSIDEBELOW : {
			layoutType : 'OUTSIDEBELOW'
		},
		OUTSIDEABOVE : {
			layoutType : 'OUTSIDEABOVE'
		},
		STARTROW : {
			layoutType : 'STARTROW'
		},
		MIDROW : {
			layoutType : 'MIDROW'
		},
		ENDROW : {
			layoutType : 'ENDROW'
		},
	};
	this.LayoutType = LayoutType;

	// ----- Break Type List
	var BreakType = {
		NONE : {
			breakType : 'NONE'
		},
		STARTCOL : {
			breakType : 'STARTCOL'
		},
		STARTROW : {
			breakType : 'STARTROW'
		},
	};
	this.BreakType = BreakType;
}

// ========== Define Global Variable
// ----- Display Type List
var DisplayType = {
	NORMAL : {
		displayType : 'NORMAL'
	},
	HIDDEN : {
		displayType : 'HIDDEN'
	},
	READONLY : {
		displayType : 'READONLY'
	},
	DISABLED : {
		displayType : 'DISABLED'
	},
	ENTRY : {
		displayType : 'ENTRY'
	},
	INLINE : {
		displayType : 'INLINE'
	},
};

// ----- Layout Type List
var LayoutType = {
	NORMAL : {
		layoutType : 'NORMAL'
	},
	OUTSIDE : {
		layoutType : 'OUTSIDE'
	},
	OUTSIDEBELOW : {
		layoutType : 'OUTSIDEBELOW'
	},
	OUTSIDEABOVE : {
		layoutType : 'OUTSIDEABOVE'
	},
	STARTROW : {
		layoutType : 'STARTROW'
	},
	MIDROW : {
		layoutType : 'MIDROW'
	},
	ENDROW : {
		layoutType : 'ENDROW'
	},
};

// ----- Break Type List
var BreakType = {
	NONE : {
		breakType : 'NONE'
	},
	STARTCOL : {
		breakType : 'STARTCOL'
	},
	STARTROW : {
		breakType : 'STARTROW'
	},
};

// var libCode = libco

// ################################################################################################
// ################################################################################################
// ========== Archive SuiteScrip 1.0 Script
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ========== General Function
// ################################################################################################
// ################################################################################################

/**
 * Add Image Button to Form
 *
 * @param {nlobjForm} form
 * @param {String} defaultButtonId
 * @param {String} defaultButtonName
 * @param {String} buttonScript
 * @param {Number} imageId file id in file cabinet
 */
// function addImageButton(form, defaultButtonId, defaultButtonName, buttonScript, imageId) {
// // #################################################################################################
// form.addButton(defaultButtonId, ' ', buttonScript);
//
// // ===
// var css = new Array();
// css.push('<style>');
// css.push('#' + defaultButtonId + ', #secondary' + defaultButtonId + '{');
// css.push(" background-image: URL('" + nlapiResolveURL('mediaitem', imageId) + "') !important;");
// css.push(' background-repeat: no-repeat !important;');
// css.push(' background-position: 50% 50% !important;');
// css.push(' background-size: 28px 28px !important;');
// css.push('}');
// css.push('</style>');
//
// var script = new Array();
// script.push('<script>');
// var rand1 = randomString(10, 10, 'en');
// var rand2 = randomString(10, 10, 'en');
// script.push('var count_' + rand1 + ' = 0;');
// script.push('var countSec_' + rand2 + ' = 0;');
//
// script.push('function setButtonTitle_' + rand1 + '(){');
// script.push(' var tmp = document.getElementById("' + defaultButtonId + '");');
// script.push(' if(!tmp && count_' + rand1 + ' < 10){count_' + rand1 + '++;setTimeout(setButtonTitle_' + rand1 + ', 1000);return;}');
// script.push(' if(!!tmp) {tmp.setAttribute("title", "' + defaultButtonName + '");}');
// script.push('}');
//
// script.push('function setButtonSecondaryTitle_' + rand2 + '(){');
// script.push(' var tmp = document.getElementById("secondary' + defaultButtonId + '");');
// script.push(' if(!tmp && countSec_' + rand2 + ' < 10){countSec_' + rand2 + '++;setTimeout(setButtonSecondaryTitle_' + rand2 + ', 1000);return;}');
// script.push(' if(!!tmp) {tmp.setAttribute("title", "' + defaultButtonName + '");}');
// script.push('}');
//
// script.push('setButtonTitle_' + rand1 + '();');
// script.push('setButtonSecondaryTitle_' + rand2 + '();');
// script.push('</script>');
// var field = form.addField('custpage_css_' + randomString(10, 10, 'en').toLowerCase(), 'inlinehtml', '');
// field.setDefaultValue(css.join('\n') + script.join('\n'));
// // #################################################################################################
// }
// this.addImageButton = addImageButton;
/**
 * Add Image Button to Form
 *
 * @param {nlobjForm} form
 * @param {String} defaultButtonId
 * @param {String} defaultButtonName
 * @param {String} buttonScript
 * @param {Number} imageId file id in file cabinet
 */
// function addImageButtonShortText(form, defaultButtonId, defaultButtonName, buttonScript, imageId, buttonShortText) {
// // #################################################################################################
// if (!buttonShortText) buttonShortText = ' ';
// else buttonShortText = '...' + buttonShortText;
// form.addButton(defaultButtonId, buttonShortText, buttonScript);
//
// // ===
// var css = new Array();
// css.push('<style>');
// css.push('#' + defaultButtonId + ', #secondary' + defaultButtonId + '{');
// css.push(" background-image: URL('" + nlapiResolveURL('mediaitem', imageId) + "') !important;");
// css.push(' background-repeat: no-repeat !important;');
// css.push(' background-position: 1px 50% !important;');
// css.push(' background-size: 28px 28px !important;');
// css.push('}');
// css.push('</style>');
//
// var script = new Array();
// script.push('<script>');
// var rand1 = randomString(10, 10, 'en');
// var rand2 = randomString(10, 10, 'en');
// script.push('var count_' + rand1 + ' = 0;');
// script.push('var countSec_' + rand2 + ' = 0;');
//
// script.push('function setButtonTitle_' + rand1 + '(){');
// script.push(' var tmp = document.getElementById("' + defaultButtonId + '");');
// script.push(' if(!tmp && count_' + rand1 + ' < 10){count_' + rand1 + '++;setTimeout(setButtonTitle_' + rand1 + ', 1000);return;}');
// script.push(' if(!!tmp) {tmp.setAttribute("title", "' + defaultButtonName + '");}');
// script.push('}');
//
// script.push('function setButtonSecondaryTitle_' + rand2 + '(){');
// script.push(' var tmp = document.getElementById("secondary' + defaultButtonId + '");');
// script.push(' if(!tmp && countSec_' + rand2 + ' < 10){countSec_' + rand2 + '++;setTimeout(setButtonSecondaryTitle_' + rand2 + ', 1000);return;}');
// script.push(' if(!!tmp) {tmp.setAttribute("title", "' + defaultButtonName + '");}');
// script.push('}');
//
// script.push('setButtonTitle_' + rand1 + '();');
// script.push('setButtonSecondaryTitle_' + rand2 + '();');
// script.push('</script>');
// var field = form.addField('custpage_css_' + randomString(10, 10, 'en').toLowerCase(), 'inlinehtml', '');
// field.setDefaultValue(css.join('\n') + script.join('\n'));
// // #################################################################################################
// }
// this.addImageButtonShortText = addImageButtonShortText;
/**
 * @param {Number} name file name
 * @param {Number} type save as file type
 * @param {Number} msg message
 * @param {Number} data file content
 * @param {Number} folderid file location
 * @returns {Void}
 */
// this.createFileLog =createFileLog; function createFileLog(name, type, msg, data, folderid) {
// var now = new Date();
// now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
// now.setHours(now.getHours() + 7);
// data = {
// data : nvl(data, new Object()),
// message : msg
// };
// if (!type) type = '.txt';
// var file = nlapiCreateFile(name + ' ' + getDateFormat(now, 'Ymd-His') + type, 'PLAINTEXT', JSON.stringify(data));
// // if (folderid == null || folderid == '') folderid = 81;
// file.setFolder(folderid);
// file.setDescription(msg);
// nlapiSubmitFile(file);
// }
/**
 * @param {String} name log filename
 * @param {String} type log type
 * @param {String} msg log message
 * @param {Object} data log content
 * @returns {Void}
 */
// this.createLogRecord =createLogRecord; function createLogRecord(name, type, msg, data) {
// var now = new Date();
// // ##### Get Current Time in TH
// now.setHours(now.getHours() + (now.getTimezoneOffset() / 60) + 7);
//
// var obj = nlapiCreateRecord('customrecord_integration_log');
// if (type == null || type == '') {
// type = 'Unknow';
// }
// obj.setFieldValue('altname', getDateFormat(now, 'Ymd_His') + ' ' + name);
// obj.setFieldValue('custrecord_inte_rectype', type);
// obj.setFieldValue('custrecord_inte_income_datetime', nlapiDateToString(now, 'datetimetz'));
// obj.setFieldValue('custrecord_inte_message', JSON.stringify(msg));
// var content = JSON.stringify(data);
// var maxLength = 99990;
// for (var i = 0; i < 10; i++) {
// var setContent = content.toString();
// if (setContent.length > maxLength) {
// setContent = content.slice(0, maxLength);
// content = content.slice(maxLength);
// } else {
// content = '';
// }
// obj.setFieldValue('custrecord_inte_contect_' + i.toFixed(0), setContent);
// if (content == null || content == '' || content.length <= 0) break;
// }
// return nlapiSubmitRecord(obj);
// }
/**
 * @param {String} name log filename
 * @param {String} type log type
 * @param {String} msg log message
 * @param {Object} data log content
 * @returns {Void}
 */
// this.createLogRecordV2 =createLogRecordV2; function createLogRecordV2(name, type, msg, data, nonce) {
// var now = new Date();
// // ##### Get Current Time in TH
// now.setHours(now.getHours() + (now.getTimezoneOffset() / 60) + 7);
//
// var obj = nlapiCreateRecord('customrecord_integration_log');
// if (type == null || type == '') {
// type = 'unknow';
// }
// obj.setFieldValue('altname', name + getDateFormat(now, ' Ymd_His'));
// obj.setFieldValue('custrecord_inte_rectype', type);
// obj.setFieldValue('custrecord_inte_execution_context', nlapiGetContext().getExecutionContext());
// obj.setFieldValue('custrecord_inte_income_datetime', nlapiDateToString(now, 'datetimetz'));
// obj.setFieldValue('custrecord_inte_nonce', nvl(nonce));
// if (msg == null) msg = '';
// if (typeof msg === 'string') {
// msg = nvl(msg).slice(0, 99990);
// } else {
// msg = nvl(JSON.stringify(msg, null, 2)).slice(0, 99990);
// }
// obj.setFieldValue('custrecord_inte_message', msg);
// var content = JSON.stringify(data);
// var maxLength = 99990;
// for (var i = 1; !!content && content.length > 0; i++) {
// var setContent = content.toString();
// if (setContent.length > maxLength) {
// setContent = content.slice(0, maxLength);
// content = content.slice(maxLength);
// } else {
// content = '';
// }
// obj.selectNewLineItem('recmachcustrecord_parent_inte_log');
// obj.setCurrentLineItemValue('recmachcustrecord_parent_inte_log', 'custrecord_inte_content', setContent);
// obj.commitLineItem('recmachcustrecord_parent_inte_log');
// // obj.setFieldValue('custrecord_inte_contect_' + i.toFixed(0), setContent);
// if (content == null || content == '' || content.length <= 0) break;
// }
// return nlapiSubmitRecord(obj);
// }

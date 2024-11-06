/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 *
 * @summary     Client Script of "Address".
 * @author      Rakop M. [2024/08/14] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CURRENT_RECORD, REC_TYPE, REC_ID;
var USE_SUB, USER_ROLE_ID, USER_ID;
var SHIPMASTER;
var refreshId;
var key_addr = '# To Be Generated';
var msg, dialog, format, currentRec, runtime, search, error, record, url;
define(['N/ui/message', 'N/ui/dialog', 'N/format', 'N/currentRecord', 'N/runtime', 'N/search', 'N/error', 'N/record', 'N/url'],

    /**
     * @param {type} _msg
     * @param {type} _dialog
     * @param {type} _format
     * @param {type} _currentRec
     * @param {type} _runtime
     * @param {type} _search
     * @param {type} _error
     * @return {}
     */
    function (_msg, _dialog, _format, _currentRec, _runtime, _search, _error, _record, _url) {
        msg = _msg;
        dialog = _dialog;
        format = _format;
        currentRec = _currentRec;
        runtime = _runtime;
        search = _search;
        error = _error;
        record = _record;
        url = _url;

        USER_ROLE_ID = runtime.getCurrentUser().role;
        USER_ID = runtime.getCurrentUser().id;
        USE_SUB = runtime.isFeatureInEffect('SUBSIDIARIES');

        return {
            pageInit: Address_pageInit,
            fieldChanged: Address_fieldChanged,
            // lineInit: Address_lineInit,
            // validateLine: Address_validateLine,
            // saveRecord: Address_saveRecord
        };
    }
);


// ################################################################################################
// ===== Client Function
// ################################################################################################
function Address_pageInit(scriptContext, currentRecord, mode) {
    try {
        window.onbeforeunload = null;
        CURRENT_RECORD = scriptContext.currentRecord;

        try {
            SHIPMASTER = CURRENT_RECORD.getValue('addr1');
            if (!!SHIPMASTER && SHIPMASTER.toString().indexOf(key_addr) != -1) {
                SHIPMASTER = SHIPMASTER.replace(key_addr, '');
                var address_mapping = getAddressMapping();

                var data_look = [];
                for (var key in address_mapping) {
                    data_look.push(key);
                }

                var rec_look = search.lookupFields({
                    type: 'customrecord_exp_shippingmaster',
                    id: SHIPMASTER,
                    columns: data_look
                });

                for (var key in address_mapping) {
                    var id = address_mapping[key];
                    var value = rec_look[key];
                    if (id != 'country') {
                        CURRENT_RECORD.setValue({
                            fieldId: id,
                            value: value,
                            ignoreFieldChange: true
                        });
                    }
                }
                CURRENT_RECORD.setValue({
                    fieldId: 'custrecord_exp_shipmasteraddress',
                    value: SHIPMASTER
                });
            }
        } catch (e) {
            console.log('ERROR | pageInit 1 | ' + e);
        }
    } catch (e) {
        console.log('ERROR | pageInit | ' + e);
    }
}
function Address_fieldChanged(scriptContext, currentRecord, sublistId, fieldId, line, column) {
    try {
        CURRENT_RECORD = scriptContext.currentRecord;
        var currentSublist = scriptContext.sublistId;
        var currentLine = scriptContext.line;
        var currentField = scriptContext.fieldId;

        try {
            var check_field = ['custrecord_exp_shipmasteraddress'];
            if (check_field.indexOf(currentField) != -1) {
                var shipmaster_address = CURRENT_RECORD.getValue('custrecord_exp_shipmasteraddress');
                if (!!shipmaster_address) {
                    var address_mapping = getAddressMapping();
                    var data_look = [];
                    for (var key in address_mapping) {
                        data_look.push(key);
                    }

                    var rec_look = search.lookupFields({
                        type: 'customrecord_exp_shippingmaster',
                        id: shipmaster_address,
                        columns: data_look
                    });

                    for (var key in address_mapping) {
                        var id = address_mapping[key];
                        var value = rec_look[key];
                        if (id == 'country') {
                            var addr1 = CURRENT_RECORD.getValue('addr1');
                            if (CURRENT_RECORD.getText(id) != value[0].text) {
                                CURRENT_RECORD.setValue({
                                    fieldId: 'addr1',
                                    value: shipmaster_address + key_addr,
                                    ignoreFieldChange: true
                                });
                                CURRENT_RECORD.setText(id, value[0].text);
                            }
                            else {
                                CURRENT_RECORD.setValue('addr1', shipmaster_address + key_addr);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('ERROR | fieldChanged | currentSublist = ' + currentSublist + ' | currentLine = ' + currentLine + ' | currentField = ' + currentField);
            console.log('ERROR | fieldChanged | ' + e);
        }

        try {
            var check_field = ['addr1'];
            if (check_field.indexOf(currentField) != -1) {
                var shipmaster_address = CURRENT_RECORD.getValue('addr1');
                if (!!shipmaster_address && shipmaster_address.toString().indexOf(key_addr) != -1) {
                    shipmaster_address = shipmaster_address.replace(key_addr, '');
                    var address_mapping = getAddressMapping();

                    var data_look = [];
                    for (var key in address_mapping) {
                        data_look.push(key);
                    }

                    var rec_look = search.lookupFields({
                        type: 'customrecord_exp_shippingmaster',
                        id: shipmaster_address,
                        columns: data_look
                    });

                    for (var key in address_mapping) {
                        var id = address_mapping[key];
                        var value = rec_look[key];
                        if (id != 'country') {
                            CURRENT_RECORD.setValue({
                                fieldId: id,
                                value: value,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.log('ERROR | fieldChanged | currentSublist = ' + currentSublist + ' | currentLine = ' + currentLine + ' | currentField = ' + currentField);
            console.log('ERROR | fieldChanged | ' + e);
        }

    } catch (e) {
        console.log('ERROR | ' + e);
    }
}

function Address_lineInit(scriptContext, currentRecord, sublistId) {
    try {
        CURRENT_RECORD = scriptContext.currentRecord;;
        REC_TYPE = CURRENT_RECORD.type;
        REC_ID = CURRENT_RECORD.id;
        var currentSublist = scriptContext.sublistId;
        var currentLine = scriptContext.line;
        var currentField = scriptContext.fieldId;

        try {

        } catch (e) {
            console.log('ERROR | lineInit 1 | ' + e);
        }
    } catch (e) {
        console.log('ERROR | lineInit | ' + e);
    }
}

function Address_validateLine(scriptContext, currentRecord, sublistId) {
    try {
        CURRENT_RECORD = scriptContext.currentRecord;;
        REC_TYPE = CURRENT_RECORD.type;
        REC_ID = CURRENT_RECORD.id;
        var currentSublist = scriptContext.sublistId;
        var currentLine = scriptContext.line;
        var currentField = scriptContext.fieldId;

        try {

        } catch (e) {
            console.log('ERROR | validateLine | ' + e);
        }
    } catch (e) {
        console.log('ERROR | validateLine | ' + e);
    }
    return true;
}

function Address_saveRecord(scriptContext, currentRecord, sublistId) {
    try {
        window.onbeforeunload = null;
        CURRENT_RECORD = scriptContext.currentRecord;;
        REC_TYPE = CURRENT_RECORD.type;
        REC_ID = CURRENT_RECORD.id;
        var currentSublist = scriptContext.sublistId;
        var currentLine = scriptContext.line;
        var currentField = scriptContext.fieldId;

        try {

        } catch (e) {
            console.log('ERROR | saveRecord | ' + e);
        }
    } catch (e) {
        console.log('ERROR | saveRecord | ' + e);
    }
  	return true;
}

// ################################################################################################
// ===== Client Library Function
// ################################################################################################
function getAddressMapping () {
    var address_mapping = {};
        address_mapping['custrecord_exps_shipcountry'] = 'country';
        address_mapping['custrecord_exps_shippingadd1'] = 'addr1';
        address_mapping['custrecord_exps_shippingadd2'] = 'addr2';
        address_mapping['custrecord_exps_shippingadd3'] = 'addr3';
        address_mapping['custrecord_exps_shipcity'] = 'city';
        address_mapping['custrecord_exps_shipstate'] = 'state';
        address_mapping['custrecord_exps_shipzipcode'] = 'zip';
        address_mapping['custrecord_exps_shipphone'] = 'addrphone';
    return address_mapping;
}

// ################################################################################################
// ===== Library Function
// ################################################################################################
function getSearch(recordType, searchId, columns, filters) {
    var searchResults = [],
        searchOptions = {},
        searchObj = {};

    if (!!searchId) {
        searchObj = search.load({ id: searchId });

        //Copy the filters from objSearch into default Filters, Columns
        searchOptions.columns = searchObj.columns;
        searchOptions.filters = searchObj.filters

        //Push the new filter, column into default Filters, Columns
        for (var i in columns) {
            searchOptions.columns.push(columns[i]);
        }

        for (var i in filters) {
            searchOptions.filters.push(filters[i]);
        }

        //Copy the modified default Filters, Columns back into searchObj
        searchObj.columns = searchOptions.columns;
        searchObj.filters = searchOptions.filters;
    } else {
        if (!!recordType) { searchOptions.type = recordType; }
        if (!!columns) { searchOptions.columns = columns; }
        if (!!filters) { searchOptions.filters = filters; }

        searchObj = search.create(searchOptions);
    }

    var myPagedData = {};
    var myPage = {};
    var i = 0;

    myPagedData = searchObj.runPaged({ pageSize: 1000 });
    myPagedData.pageRanges.forEach(function (pageRange) {
        myPage = myPagedData.fetch({ index: pageRange.index });
        myPage.data.forEach(function (result) {
            searchResults.push(result);
        });
    });

    return searchResults;
}

function nvle(input, output) {
    if (!!input && !isNaN(input)) return Number(input).toString();
    if (!!input || input === 0) return input;
    if (!!output || output === 0) return output;
    return '';
}

Date.prototype.YYYYMMDDHHMMSS = function () {
    var yyyy = this.getFullYear().toString();
    var MM = pad(this.getMonth() + 1, 2);
    var dd = pad(this.getDate(), 2);
    var hh = pad(this.getHours(), 2);
    var mm = pad(this.getMinutes(), 2);
    var ss = pad(this.getSeconds(), 2);
    return yyyy + MM + dd + hh + mm + ss;
};

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function showLoading(percent) {
    if (!percent) percent = '';
    var loadingHTML = '';
        loadingHTML += '<div id="loadingScreen" style="position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(127, 140, 141, 0.75); z-index: 1001; cursor:wait;">';// display:none
        loadingHTML += '<table border="0" width="100%" height="100%"><tr><td align="center" valign="middle">';
        loadingHTML += '<table border="0" width="200px" height="100px" style="border-radius: 5px; background-color: rgba(10,10,10, 0.8); color: rgba(149, 165, 166, 1.0);">';
        loadingHTML += '<tr><td align=center valign="middle" style="padding:0px 20px;font-weight: bold; font-size:13pt;">';
        loadingHTML += ' <br>In Progress ... '+percent+'<br><img width="220" height="25" src="'+ getImageLoading() +'"/>';
        loadingHTML += '</td>';
        loadingHTML += '</tr>';
        loadingHTML += '</table>';
        loadingHTML += '</td></tr></table>';
        loadingHTML += '</div>';
    return loadingHTML;
}

function getImageLoading() {
    return 'data:image/gif;base64,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';
}
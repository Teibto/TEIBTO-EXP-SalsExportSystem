/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 *
 * @summary     Client Script of "customscript_exp_sl_combine_pro_inv".
 * @author      Rakop M. [2024/08/21] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CURRENT_RECORD, TABLE_DATA, STEP;
var TIMER_INTERVAL, LINE_INDEX, IS_WAITING;
var USE_SUB, USER_ROLE_ID, USER_ID;
var SL_SCRIPT_ID = 'customscript_exp_sl_combine_pro_inv';
var PARAMS, FIELD_FORMAT;
var ADDRESS_MAP = {};
var CUSTOMER_ADDRESS_MAP = {};
var REC_COUNT = 0;
var msg, dialog, email, format, currentRec, runtime, search, task, error, record, url, https;
define(['N/ui/message', 'N/ui/dialog', 'N/format', 'N/currentRecord', 'N/runtime', 'N/search', 'N/error', 'N/record', 'N/url', 'N/https'],

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
    function(_msg, _dialog, _format, _currentRec, _runtime, _search, _error, _record, _url, _https) {
        msg = _msg;
        dialog = _dialog;
        format = _format;
        currentRec = _currentRec;
        runtime = _runtime;
        search = _search;
        error = _error;
        record = _record;
        url = _url;
        https = _https;

        USER_ROLE_ID = runtime.getCurrentUser().role;
        USER_ID = runtime.getCurrentUser().id;
        USE_SUB = runtime.isFeatureInEffect('SUBSIDIARIES');
        STEP = '';
        PARAMS = {};

        return {
            pageInit: SL_pageInit,
            // saveRecord: SL_saveRecord,
            fieldChanged: SL_fieldChanged,
            // lineInit: SL_lineInit,
            // validateDelete: SL_validateDelete,
            // sublistChanged: SL_sublistChanged,
            markListAll: markListAll,
            unmarkListAll: unmarkListAll,
            resetFilter: resetFilter
        };
    }
);


// ################################################################################################
// ===== Client Function
// ################################################################################################
function SL_pageInit(context) {

    console.log(new Date()+' | SL_pageInit');
    window.onbeforeunload = null;
    CURRENT_RECORD = context.currentRecord;
    STEP = CURRENT_RECORD.getValue('step');

    // ################################################################################################
    // ===== Preview - Remove Label Subtab
    // ################################################################################################
    try {
        if (STEP == 'Preview') {
            console.log(new Date()+' | showLoading');
            // document.getElementById('loadingScreen').style.display = '';
            setTimeout(function() {
                try {
                    var element = document.getElementById("custpage_proforma_invoice_details_tab_mh");
                        element.classList.remove("bgsubtabbar");
                        element.style.display = 'none';
                } catch (e) {
                    alert(e.message)
                    console.log('ERROR | '+e);
                }
                // document.getElementById('loadingScreen').style.display = 'none';
            }, 100);
        }

    } catch (e) {
        console.log('ERROR | '+e);
        log.error('pageInit | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID, e);
    }

    // ################################################################################################
    // ===== GenerateCommercialInvoice - Default Value
    // ################################################################################################
    try {
        if (STEP == 'GenerateCommercialInvoice') {
            console.log(new Date()+' | showLoading');
            // document.getElementById('loadingScreen').style.display = '';
            setTimeout(function() {
                try {
                    if (!!CURRENT_RECORD.getValue('params')) PARAMS = JSON.parse(CURRENT_RECORD.getValue('params'));
                    if (!!CURRENT_RECORD.getValue('field_format')) FIELD_FORMAT = JSON.parse(CURRENT_RECORD.getValue('field_format'));
                    if (!!CURRENT_RECORD.getValue('address_map')) ADDRESS_MAP = JSON.parse(CURRENT_RECORD.getValue('address_map'));
                    if (!!CURRENT_RECORD.getValue('customer_address_map')) CUSTOMER_ADDRESS_MAP = JSON.parse(CURRENT_RECORD.getValue('customer_address_map'));
                } catch (e) {
                    alert(e.message)
                    console.log('ERROR | '+e);
                }
                // document.getElementById('loadingScreen').style.display = 'none';
            }, 100);
        }

    } catch (e) {
        console.log('ERROR | '+e);
        log.error('pageInit | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID, e);
    }

    // ################################################################################################
    // ===== UpdateProformaInvoice - Update Status Display
    // ################################################################################################
    try {
        if (STEP == 'UpdateProformaInvoice') {
            console.log(new Date()+' | showLoading');
            setTimeout(function() {
                var subListId = 'custpage_proforma_invoice_list';
                var lineCount = CURRENT_RECORD.getLineCount(subListId);
                LINE_INDEX = 0;
                REC_COUNT = 0;
                IS_WAITING = false;
                TIMER_INTERVAL = setInterval(function() {
                    try {
                        if (IS_WAITING == false) {
                            IS_WAITING = true;
                            if (LINE_INDEX == lineCount) {
                                clearInterval(TIMER_INTERVAL);
                            } else {
                                var replace = '<p style="color:blue"><b>In progress... </b>'+getIconLoad()+'</p>';
                                var listId = 'line'+LINE_INDEX+'_status';
                                html = document.getElementById(listId);
                                html.innerHTML = replace;
                                setTimeout(function() {
                                    if (lineCount-1 == LINE_INDEX) {
                                        createProcessRecord(lineCount, LINE_INDEX, true, subListId);
                                    }
                                    else {
                                        createProcessRecord(lineCount, LINE_INDEX, false, subListId);
                                    }
                                    LINE_INDEX++;
                                    IS_WAITING = false;
                                }, 100);
                            }
                        }
                    } catch (e) {
                        clearInterval(TIMER_INTERVAL);
                        console.log('ERROR | '+e);
                        nlapiSetFieldValue('custpage_html_loading', '');
                    }
                }, 1);
            }, 100);
        }
    } catch (e) {
        console.log('ERROR | '+e);
        log.error('pageInit | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID, e);
    }
}

function SL_fieldChanged(context) {
    try {

        var currentSublist = context.sublistId;
        var currentField = context.fieldId;
        var currentLine = context.line;

        // ################################################################################################
        // ===== Default Currecy By Customer
        // ################################################################################################
        try {
            if (STEP == 'InProgress') {
                var check_field = ['custpage_customer'];
                if (check_field.indexOf(currentField) != -1) {
                    var cus_id = CURRENT_RECORD.getValue('custpage_customer');
                    if (!!cus_id) {
                        CURRENT_RECORD.setValue('custpage_currency', getCurrencyByCustomer(cus_id));
                    }
                }

            }
        } catch(e) {
            console.log('ERROR | fieldChanged | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine+' | currentField = '+currentField);
            console.log('ERROR | fieldChanged | '+STEP+' | '+e);
            alert(e)
        }

        // ################################################################################################
        // ===== Check Select Checkbox
        // ################################################################################################
        try {
            if (STEP == 'Preview') {
                var check_field = ['custpage_from_date', 'custpage_to_date', 'custpage_tranid'];
                if (check_field.indexOf(currentField) != -1) {
                    refreshPage();
                }

            }
        } catch(e) {
            console.log('ERROR | fieldChanged | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine+' | currentField = '+currentField);
            console.log('ERROR | fieldChanged | '+STEP+' | '+e);
            alert(e)
        }

        // ################################################################################################
        // ===== Check Ship To Select set value to Ship To Address
        // ################################################################################################
        try {
            if (STEP == 'GenerateCommercialInvoice') {
                var check_field = ['custpage_shipaddresslist'];
                if (check_field.indexOf(currentField) != -1) {
                    var ship_select = CURRENT_RECORD.getValue('custpage_shipaddresslist');
                    if (!!ship_select) {
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_shipaddress',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['addressbookaddress_text'],
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_shippingmaster',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['custrecord_exp_shipmasteraddress'],
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_shipping_port',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['custrecord_exps_shipport'],
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_destination_country',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['custrecord_exps_destinationcountry'],
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_port',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['custrecord_exps_port'],
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_intransit_to',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['custrecord_exps_intransitto'],
                            ignoreFieldChange: true
                        });
                    }
                    else {
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_shipaddress',
                            value: '',
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_shippingmaster',
                            value: '',
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_shipping_port',
                            value: '',
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_destination_country',
                            value: '',
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_port',
                            value: '',
                            ignoreFieldChange: true
                        });
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_custbody_exp_intransit_to',
                            value: '',
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        } catch(e) {
            console.log('ERROR | fieldChanged | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine+' | currentField = '+currentField);
            console.log('ERROR | fieldChanged | '+STEP+' | '+e);
            alert(e)
        }

        // ################################################################################################
        // ===== Check Bill To Select set value to Bill To Address
        // ################################################################################################
        try {
            if (STEP == 'GenerateCommercialInvoice') {
                var check_field = ['custpage_billaddresslist'];
                if (check_field.indexOf(currentField) != -1) {
                    var ship_select = CURRENT_RECORD.getValue('custpage_billaddresslist');
                    if (!!ship_select) {
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_billaddress',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['addressbookaddress_text'],
                            ignoreFieldChange: true
                        });
                    }
                    else {
                        CURRENT_RECORD.setValue({
                            fieldId: 'custpage_billaddress',
                            value: '',
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        } catch(e) {
            console.log('ERROR | fieldChanged | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine+' | currentField = '+currentField);
            console.log('ERROR | fieldChanged | '+STEP+' | '+e);
            alert(e)
        }

    } catch(e) {
        console.log('ERROR | '+e);
        log.error('fieldChanged | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID+' | currentField = '+currentField+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine, e);
    }
}

// ################################################################################################
// ===== Client Library Function
// ################################################################################################
function markListAll(subListId) {
    var line_count = CURRENT_RECORD.getLineCount(subListId);
    for (var i = 0; i < line_count; i++) {
        CURRENT_RECORD.selectLine(subListId, i);
        CURRENT_RECORD.setCurrentSublistValue(subListId, 'custpage_is_select', true);
        CURRENT_RECORD.commitLine(subListId);
    }
}

function unmarkListAll(subListId) {
    var line_count = CURRENT_RECORD.getLineCount(subListId);
    for (var i = 0; i < line_count; i++) {
        CURRENT_RECORD.selectLine(subListId, i);
        CURRENT_RECORD.setCurrentSublistValue(subListId, 'custpage_is_select', false);
        CURRENT_RECORD.commitLine(subListId);
    }
}

function resetFilter(subListId) {
    var slUrl = getUrlPage(['custpage_from_date', 'custpage_to_date', 'custpage_tranid']);
    window.location = slUrl;
}

function createProcessRecord(lineCount, i, isLast, subListId) {
    try {
        if(i < lineCount) {
            var rec_id = CURRENT_RECORD.getSublistValue(subListId, 'custpage_internalid', i);
            REC_DATA = {};
            REC_DATA['rec_id'] = rec_id;
            REC_DATA['ref_rec_doc'] = CURRENT_RECORD.getValue('custpage_internalid');

            var http = new XMLHttpRequest();
            var scriptParams = {};
                scriptParams['step'] = 'CreateProcess';
                scriptParams['line'] = i;
                scriptParams['data_value'] = JSON.stringify(REC_DATA);
            console.log('scriptParams');
            console.log(JSON.stringify(scriptParams));
            var scriptURL = url.resolveScript({
                                            scriptId: SL_SCRIPT_ID,
                                            deploymentId: 'customdeploy1',
                                            params: scriptParams,
                                            returnExternalUrl: false
                                        });

            http.open('POST', scriptURL, true);

            //Send the proper header information along with the request
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

            http.onreadystatechange = function() {//Call a function when the state changes.
                if(http.readyState == 4 && http.status == 200) {
                    var res_msg = http.responseText;
                    if (!!res_msg) {
                        var result_obj = JSON.parse(res_msg);
                        console.log('res_msg');
                        console.log(res_msg);
                        if (result_obj['status'] == 'OK') {
                            var replace = '<p style="color:forestgreen"><b>Completed</b></p>';
                            var listId = 'line'+result_obj['line']+'_status';
                            var html = document.getElementById(listId);
                                html.innerHTML = replace;
                        }
                        else {
                            var listId = 'line'+result_obj['line']+'_status';
                            var replace = '<p style="color:red"><b>'+result_obj['msg']+'</b></p>';
                            var html = document.getElementById(listId);
                                html.innerHTML = replace;
                        }
                        REC_COUNT++;
                        if (REC_COUNT >= lineCount) {
                            updateJobProcess();
                        }
                    }

                }
            }

            var params = new Object();

            // Turn the data object into an array of URL-encoded key/value pairs.
            var urlEncodedData = "", urlEncodedDataPairs = [], name;
            for( name in params ) {
                urlEncodedDataPairs.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
            }
            http.send(urlEncodedDataPairs);
        }
    } catch (e) {
        clearInterval(TIMER_INTERVAL);
        console.log('ERROR | '+e);
        var listId = 'line'+LINE_INDEX+'_status';
        var replace = '<p style="color:red"><b>'+e.message+'</b></p>';
        var html = document.getElementById(listId);
            html.innerHTML = replace;
    }
}

function updateJobProcess() {
    try {
        var http = new XMLHttpRequest();
        var scriptParams = {};
            scriptParams['step'] = 'UpdateJobProcess';
            scriptParams['job_record_id'] = CURRENT_RECORD.getValue('job_record_id');
            scriptParams['ci_doc'] = CURRENT_RECORD.getValue('custpage_tranid');
            console.log('scriptParams');
            console.log(JSON.stringify(scriptParams));
        var scriptURL = url.resolveScript({
                                            scriptId: SL_SCRIPT_ID,
                                            deploymentId: 'customdeploy1',
                                            params: scriptParams,
                                            returnExternalUrl: false
                                        });

        http.open('POST', scriptURL, true);

        //Send the proper header information along with the request
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                var res_msg = http.responseText;
                if (!!res_msg) {
                    var result_obj = JSON.parse(res_msg);
                    console.log('res_msg');
                    console.log(res_msg);
                }
            }
        }
        http.send();
    } catch (e) {
        clearInterval(TIMER_INTERVAL);
        console.log('ERROR | '+e);
    }
}

function getCurrencyByCustomer(cus_id) {
    var filterSearch = [];
        filterSearch.push(search.createFilter({ name: 'internalid', operator: 'is', values: cus_id }));
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'currency', join: null }));

    var scriptParams = {
                        step: 'loadSavedSearch',
                        ssType: 'customer',
                        ssId: null,
                        filterSearch: JSON.stringify(filterSearch),
                        columnSearch: JSON.stringify(columnSearch)
                    };
    var scriptURL = url.resolveScript({
                                        scriptId: SL_SCRIPT_ID,
                                        deploymentId: 'customdeploy1',
                                        params: scriptParams,
                                        returnExternalUrl: false
                                    });

    var response = https.get({
        url: scriptURL
    });

    var response_body = response.body;
        response_body = removeComments(response_body);

    var ssResult = [];
    if (response_body != 'OK') {
        ssResult = JSON.parse(response_body);
    }

    return ssResult[0]['values']['currency'][0].value;
}

// ################################################################################################
// ===== Library Function
// ################################################################################################
function refreshPage() {
    window.location = getUrlPage();
}

function getUrlPage(ignoreParame) {
    var slUrl = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
    var ignoreParameList = ['nlrole', 'previous_step', 'script', 'deploy', 'nldept', 'nluser', 'whence', '_eml_nkey_', '_csrf', 'params', 'submitter', 'nlloc', 'type', 'nlsub', 'formdisplayview', 'nsbrowserenv'];
    if (!!ignoreParame) {
        for (var n in ignoreParame) {
            ignoreParameList.push(ignoreParame[n]);
        }
    }
    for (var key in PARAMS) {
        if (ignoreParameList.indexOf(key) != -1) continue;
        if (!CURRENT_RECORD.getValue(key)) continue;

        if (key == 'step') {
            slUrl += '&'+key+'='+CURRENT_RECORD.getValue('previous_step');
        }
        else if (key.indexOf('date') != -1) {
            slUrl += '&'+key+'='+format.format(CURRENT_RECORD.getValue(key), 'date');
        }
        else if (!!CURRENT_RECORD.getValue(key)){
            slUrl += '&'+key+'='+nvlNull(CURRENT_RECORD.getValue(key));
        }
    }
    return slUrl;
}

function nvlNull(input, output) {
    if (!!input || input === 0) return input.toString();
    if (!!output || output === 0) return output;
    return null;
}

function getIconLoad() {
    return '<img src="data:image/gif;base64,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" alt="" />';
}

function removeComments(html) {
    return (''+html)
            .replace/*HTMLComments*/(/<!-[\S\s]*?-->/gm, '')
            .replace/*JSBlockComments*/(/\/\*[\S\s]*?\*\//gm,'')
            .replace/*JSLineComments*/(/^.*?\/\/.*/gm, '$1') // FIXME
            .replace(/[\n]/gm, '');
}
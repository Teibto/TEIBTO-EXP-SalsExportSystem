/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 *
 * @summary     Client Script of "customscript_exp_sl_split_pro_inv".
 * @author      Rakop M. [2024/07/23] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CURRENT_RECORD, TABLE_DATA, STEP, DATA_DETAIL;
var TIMER_INTERVAL, LINE_INDEX, IS_WAITING
var USE_SUB, USER_ROLE_ID, USER_ID;
var SL_SCRIPT_ID = 'customscript_exp_sl_split_pro_inv';
var PARAMS, FIELD_FORMAT;
var ADDRESS_MAP = {};
var CUSTOMER_ADDRESS_MAP = {};
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
        DATA_DETAIL = [];
        REC_LIST = [];
        LOG_ID = '';
        LOG_REC = '';
        PARAMS = {};

        return {
            pageInit: SL_pageInit,
            saveRecord: SL_saveRecord,
            fieldChanged: SL_fieldChanged,
            // lineInit: SL_lineInit,
            // validateDelete: SL_validateDelete,
            // sublistChanged: SL_sublistChanged,
            markListAll: markListAll,
            unmarkListAll: unmarkListAll
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

    try {
        if (STEP == 'Preview') {
            console.log(new Date()+' | showLoading');
            // document.getElementById('loadingScreen').style.display = '';
            setTimeout(function() {
                try {
                    updateSublistItem();
                    disableAndHiddenLineField();
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
}

function SL_saveRecord(context) {
    // ################################################################################################
    // ===== Default Variable
    // ################################################################################################
    STEP = CURRENT_RECORD.getValue('step');

    // ################################################################################################
    // ===== Preview Split Proforma Invoice
    // ################################################################################################
    try {
        if (STEP == 'Preview') {
            var have_select = false;
            var sublistId = 'item_list';
            var line_count = CURRENT_RECORD.getLineCount(sublistId);
            for (var line = 0; line < line_count; line++) {
                var is_select = CURRENT_RECORD.getSublistValue(sublistId, 'is_select', line);
                if (is_select == true) {
                    have_select = true;
                }
            }

            if (have_select == false) {
                alert('Please select the item you want to do.');
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        return false;
    }

    // ################################################################################################
    // ===== Submit Split Proforma Invoice
    // ################################################################################################
    try {
        if (STEP == 'GenerateProformaInvoice') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var isConfirm = confirm('Would you like to Submit?');
                if (isConfirm == true) {
                    document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            NLDoMainFormButtonAction('submitter', true);
                        } catch (e) {
                            alert(e.message)
                            console.log('ERROR | ' + e);
                            document.getElementById('loadingScreen').style.display = 'none';
                            CURRENT_RECORD.setValue('is_confirm', false);
                        }
                    }, 100);
                }
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        return false;
    }

    // ################################################################################################
    // ===== Submit Cancel Proforma Invoice
    // ################################################################################################
    try {
        if (STEP == 'InProgressCancelProformaInvoice') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var isConfirm = confirm('Would you like to Submit?');
                if (isConfirm == true) {
                    document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            NLDoMainFormButtonAction('submitter', true);
                        } catch (e) {
                            alert(e.message)
                            console.log('ERROR | ' + e);
                            document.getElementById('loadingScreen').style.display = 'none';
                            CURRENT_RECORD.setValue('is_confirm', false);
                        }
                    }, 100);
                }
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        return false;
    }

    return true;
}

function SL_fieldChanged(context) {
    try {

        var currentSublist = context.sublistId;
        var currentField = context.fieldId;
        var currentLine = context.line;

        // ################################################################################################
        // ===== Check Select Checkbox
        // ################################################################################################
        try {
            if (STEP == 'Preview') {
                if (currentSublist == 'item_list') {
                    var check_field = ['is_select'];
                    if (check_field.indexOf(currentField) != -1) {
                        var is_select = CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'is_select');
                        var item_selected = Number(CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'item_selected'));
                        var item_avalable = Number(CURRENT_RECORD.getSublistValue(currentSublist, 'item_avalable', currentLine));
                        if (is_select == true && item_selected == 0) {
                            CURRENT_RECORD.selectLine(currentSublist, currentLine);
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'item_selected',
                                value: item_avalable,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else if (is_select == false) {
                            CURRENT_RECORD.selectLine(currentSublist, currentLine);
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'item_selected',
                                value: '',
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                    }
                }
            }
        } catch(e) {
            console.log('ERROR | fieldChanged | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine+' | currentField = '+currentField);
            console.log('ERROR | fieldChanged | '+STEP+' | '+e);
            alert(e)
        }

        // ################################################################################################
        // ===== Check Selected Textbox
        // ################################################################################################
        try {
            if (STEP == 'Preview') {
                if (currentSublist == 'item_list') {
                    var check_field = ['item_selected'];
                    if (check_field.indexOf(currentField) != -1) {
                        var item_selected = Number(CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'item_selected'));
                        var item_avalable = Number(CURRENT_RECORD.getSublistValue(currentSublist, 'item_avalable', currentLine));
                        if (item_selected > item_avalable) {
                            alert('Selected must be less than or equal to Avalable.');
                            CURRENT_RECORD.selectLine(currentSublist, currentLine);
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'item_selected',
                                value: '',
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'is_select',
                                value: false,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else if (item_selected <= 0) {
                            alert('Selected must be more than 0.');
                            CURRENT_RECORD.selectLine(currentSublist, currentLine);
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'item_selected',
                                value: '',
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'is_select',
                                value: false,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else {
                            CURRENT_RECORD.selectLine(currentSublist, currentLine);
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'is_select',
                                value: true,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                    }
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
            if (STEP == 'Preview') {
                var check_field = ['ship_select'];
                if (check_field.indexOf(currentField) != -1) {
                    var ship_select = CURRENT_RECORD.getValue('ship_select');
                    if (!!ship_select) {
                        CURRENT_RECORD.setValue({
                            fieldId: 'ship_to_address_select',
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
                            fieldId: 'ship_to_address_select',
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
            if (STEP == 'Preview') {
                var check_field = ['bill_select'];
                if (check_field.indexOf(currentField) != -1) {
                    var ship_select = CURRENT_RECORD.getValue('bill_select');
                    if (!!ship_select) {
                        CURRENT_RECORD.setValue({
                            fieldId: 'bill_to_address_select',
                            value: CUSTOMER_ADDRESS_MAP[ship_select]['addressbookaddress_text'],
                            ignoreFieldChange: true
                        });
                    }
                    else {
                        CURRENT_RECORD.setValue({
                            fieldId: 'bill_to_address_select',
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

function SL_lineInit(context) {

    try {
        var currentSublist = context.sublistId;
        var currentField = context.fieldId;
        var currentLine = context.line;

        try {


        } catch (e) {
            console.log('ERROR | lineInit 1 | ' + e);
        }
    } catch (e) {
        console.log('ERROR | lineInit | ' + e);
    }
}

function SL_validateDelete(context) {
    try {

        var currentSublist = context.sublistId;
        var currentField = context.fieldId;
        var currentLine = CURRENT_RECORD.getCurrentSublistIndex(currentSublist);

        try {


        } catch(e) {
            console.log('ERROR | validateDelete | '+STEP+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine);
            console.log('ERROR | validateDelete | '+STEP+' | '+e);
        }

        return true;

    } catch(e) {
        console.log('ERROR | '+e);
        log.error('fieldChanged | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID+' | currentField = '+currentField+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine, e);
    }
}

function SL_sublistChanged(scriptContext, currentRecord, sublistId) {
    try {

        var currentSublist = scriptContext.sublistId;
        var currentLine = scriptContext.line;
        var currentField = scriptContext.fieldId;

        try {

        } catch (e) {
            console.log('ERROR | sublistChanged | currentSublist = ' + currentSublist);
            console.log('ERROR | sublistChanged | ' + e);
        }
    } catch (e) {
        console.log('ERROR | sublistChanged | ' + e);
    }

}


// ################################################################################################
// ===== Client Library Function
// ################################################################################################
function markListAll(subListId) {
    var line_count = CURRENT_RECORD.getLineCount(subListId);
    for (var i = 0; i < line_count; i++) {
        CURRENT_RECORD.selectLine(subListId, i);
        CURRENT_RECORD.setCurrentSublistValue(subListId, 'is_select', true);
        CURRENT_RECORD.commitLine(subListId);
    }
}

function unmarkListAll(subListId) {
    var line_count = CURRENT_RECORD.getLineCount(subListId);
    for (var i = 0; i < line_count; i++) {
        CURRENT_RECORD.selectLine(subListId, i);
        CURRENT_RECORD.setCurrentSublistValue(subListId, 'is_select', false);
        CURRENT_RECORD.commitLine(subListId);
    }
}

function disableAndHiddenLineField() {
    var subListId = 'item_list';
    var line_count = Number(CURRENT_RECORD.getLineCount(subListId));
    for (var i = 0; i < line_count; i++) {
        var item_avalable = Number(CURRENT_RECORD.getSublistValue(subListId, 'item_avalable', i));
        if (item_avalable == 0) {
            CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'is_select',
                line: i
            }).isDisabled = true;

            CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'item_selected',
                line: i
            }).isDisabled = true;
        }
    }
}

function updateSublistItem() {
    var line_count = Number(CURRENT_RECORD.getLineCount('item_list'));
    for (var i = 0; i < line_count; i++) {
        CURRENT_RECORD.selectLine('item_list', i);
        var is_select = CURRENT_RECORD.getCurrentSublistValue('item_list', 'is_select');
        if (is_select == true) {
            var item_selected = CURRENT_RECORD.getCurrentSublistValue('item_list', 'item_selected');
            CURRENT_RECORD.setCurrentSublistValue('item_list', 'item_selected', item_selected);
            CURRENT_RECORD.commitLine('item_list');
        }
    }
}

// ################################################################################################
// ===== Library Function
// ################################################################################################
function getSearch(recordType, searchId, columns, filters) {
    var searchResults = [],
    searchOptions = {},
    searchObj = {};

    if(!!searchId){
        searchObj = search.load( {id: searchId} );

        //Copy the filters from objSearch into default Filters, Columns
        searchOptions.columns = searchObj.columns;
        searchOptions.filters = searchObj.filters

        //Push the new filter, column into default Filters, Columns
        for(var i in columns){
            searchOptions.columns.push(columns[i]);
        }

        for(var i in filters){
            searchOptions.filters.push(filters[i]);
        }

        //Copy the modified default Filters, Columns back into searchObj
        searchObj.columns = searchOptions.columns;
        searchObj.filters = searchOptions.filters;
    }else{
        if(!!recordType){ searchOptions.type = recordType; }
        if(!!columns){ searchOptions.columns = columns; }
        if(!!filters){ searchOptions.filters = filters; }

        searchObj = search.create( searchOptions );
    }

    var myPagedData = {};
    var myPage = {};
    var i = 0;

    myPagedData = searchObj.runPaged({pageSize: 1000});
    myPagedData.pageRanges.forEach(function(pageRange){
        myPage = myPagedData.fetch({index: pageRange.index});
        myPage.data.forEach(function(result){
            searchResults.push(result);
        });
    });

    return searchResults;
}
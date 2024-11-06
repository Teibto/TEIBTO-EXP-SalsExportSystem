/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 *
 * @summary     Client Script of "customscript_exp_sl_loading_plan".
 * @author      Rakop M. [2024/10/02] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CURRENT_RECORD, TABLE_DATA, STEP;
var TIMER_INTERVAL, LINE_INDEX, IS_WAITING;
var USE_SUB, USER_ROLE_ID, USER_ID;
var SL_SCRIPT_ID = 'customscript_exp_sl_loading_plan';
var PARAMS, FIELD_FORMAT;
var PACK_DETAIL = {};
var ITEM_DETAIL = {};
var CONTAINER_DETAIL = {};
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
            saveRecord: SL_saveRecord,
            fieldChanged: SL_fieldChanged,
            // lineInit: SL_lineInit,
            // validateDelete: SL_validateDelete,
            // sublistChanged: SL_sublistChanged,
            markListAll: markListAll,
            unmarkListAll: unmarkListAll,
            backFromPackContainerItemPage: backFromPackContainerItemPage,
            backFromLoadingPlanPreview: backFromLoadingPlanPreview
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
    // ===== Default Variable
    // ################################################################################################
    try {
        if (STEP == 'LoadingPlan' || STEP == 'PackContainerItem' || STEP == 'LoadingPlanPreview' || STEP == 'GenerateLoadingPlan' || STEP == 'SubmitConfirmLoadingPlan') {
            console.log(new Date()+' | showLoading');
            // document.getElementById('loadingScreen').style.display = '';
            setTimeout(function() {
                try {
                    CURRENT_RECORD.setValue('is_confirm', false);
                    if (!!CURRENT_RECORD.getValue('params')) PARAMS = JSON.parse(CURRENT_RECORD.getValue('params'));
                    if (!!CURRENT_RECORD.getValue('field_format')) FIELD_FORMAT = JSON.parse(CURRENT_RECORD.getValue('field_format'));
                    if (!!CURRENT_RECORD.getValue('pack_detail')) PACK_DETAIL = JSON.parse(CURRENT_RECORD.getValue('pack_detail'));
                    if (!!CURRENT_RECORD.getValue('item_detail')) ITEM_DETAIL = JSON.parse(CURRENT_RECORD.getValue('item_detail'));
                    if (!!CURRENT_RECORD.getValue('container_detail')) CONTAINER_DETAIL = JSON.parse(CURRENT_RECORD.getValue('container_detail'));

                    disableAndHiddenLineFieldContainersDetails();
                    disableAndHiddenLineFieldContainersPacking();
                    disableAndHiddenLineFieldPackItems();

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
    // ===== Validate Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'PackContainerItem') {
            var have_select = false;
            var sublistId = 'custpage_containers_details_list';
            var line_count = CURRENT_RECORD.getLineCount(sublistId);
            for (var line = 0; line < line_count; line++) {
                var is_select = CURRENT_RECORD.getSublistValue(sublistId, 'custpage_is_select', line);
                if (is_select == true) {
                    have_select = true;
                }
            }

            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (have_select == false && is_confirm == false) {
                alert('Please select the containers details you want to do.');
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        return false;
    }

    // ################################################################################################
    // ===== Submit Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'PackContainerItem') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var submitter_obj = document.getElementById('submitter');
                var isConfirm = confirm('Would you like to '+submitter_obj.value+'?');
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
    // ===== Validate Pack Container Item
    // ################################################################################################
    try {
        if (STEP == 'LoadingPlan') {
            var have_select = false;
            var sublistId = 'custpage_pack_items_list';
            var line_count = CURRENT_RECORD.getLineCount(sublistId);
            for (var line = 0; line < line_count; line++) {
                var is_select = CURRENT_RECORD.getSublistValue(sublistId, 'custpage_is_select', line);
                if (is_select == true) {
                    have_select = true;
                }
            }

            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (have_select == false && is_confirm == false) {
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
    // ===== Submit Pack Container Item
    // ################################################################################################
    try {
        if (STEP == 'LoadingPlan') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var submitter_obj = document.getElementById('submitter');
                var isConfirm = confirm('Would you like to '+submitter_obj.value+'?');
                if (isConfirm == true) {
                    document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            setPackContainerItem();
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
    // ===== Submit Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'LoadingPlanPreview') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var submitter_obj = document.getElementById('submitter');
                var isConfirm = confirm('Would you like to '+submitter_obj.value+'?');
                if (isConfirm == true) {
                    document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            setPackContainerItem();
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
    // ===== Generate Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'GenerateLoadingPlan') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var submitter_obj = document.getElementById('submitter');
                var isConfirm = confirm('Would you like to '+submitter_obj.value+'?');
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
    // ===== Validate Confirm Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'SubmitConfirmLoadingPlan') {
            var have_empty = false;
            var sublistId = 'custpage_containers_details_list';
            var line_count = CURRENT_RECORD.getLineCount(sublistId);
            for (var line = 0; line < line_count; line++) {
                var containersno = CURRENT_RECORD.getSublistValue(sublistId, 'custpage_custrecord_eci_containersno_custrecord_eci_loadplan', line);
                var containersealno = CURRENT_RECORD.getSublistValue(sublistId, 'custpage_custrecord_eci_containersealno_custrecord_eci_loadplan', line);
                if (!containersno || !containersealno) {
                    have_empty = true;
                }
            }

            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (have_empty == true && is_confirm == false) {
                alert('Please enter Containers No and Container Seal No.');
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        return false;
    }

    // ################################################################################################
    // ===== Submit Confirm Loading Plan
    // ################################################################################################
    try {
        if (STEP == 'SubmitConfirmLoadingPlan') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var submitter_obj = document.getElementById('submitter');
                var isConfirm = confirm('Would you like to '+submitter_obj.value+'?');
                if (isConfirm == true) {
                    document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            NLDoMainFormButtonAction('submitter', true);
                            CURRENT_RECORD.setValue('is_confirm', false);
                            document.getElementById('loadingScreen').style.display = 'none';
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
        // ===== Containers Details - Check Select Checkbox
        // ################################################################################################
        try {
            if (STEP == 'PackContainerItem') {
                if (currentSublist == 'custpage_containers_details_list') {
                    var check_field = ['custpage_is_select'];
                    if (check_field.indexOf(currentField) != -1) {
                        var line_count = CURRENT_RECORD.getLineCount(currentSublist);
                        var is_select = CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'custpage_is_select');
                        if (is_select == true) {
                            for (var i = 0; i < line_count; i++) {
                                if (i != currentLine) {
                                    CURRENT_RECORD.selectLine(currentSublist, i);
                                    CURRENT_RECORD.setCurrentSublistValue(currentSublist, 'custpage_is_select', false);
                                    CURRENT_RECORD.commitLine(currentSublist);
                                }
                            }
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
        // ===== Containers Packing - Check Select Checkbox
        // ################################################################################################
        try {
            if (STEP == 'PackContainerItem' || STEP == 'LoadingPlanPreview') {
                if (currentSublist == 'custpage_containers_packing_list') {
                    var check_field = ['custpage_is_select'];
                    if (check_field.indexOf(currentField) != -1) {
                        var is_select = CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'custpage_is_select');
                        if (is_select == true) {
                            var isConfirm = confirm('Would you like to Edit?');
                            if (isConfirm == true) {
                                var number = CURRENT_RECORD.getSublistValue(currentSublist, 'custpage_number', currentLine);
                                CURRENT_RECORD.setValue('container_number', number);
                                CURRENT_RECORD.setValue('step', 'PackContainerItem');
                                CURRENT_RECORD.setValue('is_confirm', true);
                                NLDoMainFormButtonAction('submitter', true);
                            }
                            else {
                                CURRENT_RECORD.setCurrentSublistValue(currentSublist, 'custpage_is_select', false);
                                CURRENT_RECORD.commitLine(currentSublist);
                            }
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
        // ===== Pack Items - Check Select Checkbox
        // ################################################################################################
        try {
            if (STEP == 'LoadingPlan') {
                if (currentSublist == 'custpage_pack_items_list') {
                    var check_field = ['custpage_is_select'];
                    if (check_field.indexOf(currentField) != -1) {
                        var is_select = CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'custpage_is_select');
                        var item_avalable = Number(CURRENT_RECORD.getSublistValue(currentSublist, 'custpage_avalable', currentLine));
                        if (is_select == true) {
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_selected',
                                value: item_avalable,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else {
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_selected',
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
        // ===== Pack Items - Enter Selected
        // ################################################################################################
        try {
            if (STEP == 'LoadingPlan') {
                if (currentSublist == 'custpage_pack_items_list') {
                    var check_field = ['custpage_selected'];
                    if (check_field.indexOf(currentField) != -1) {
                        var item_selected = Number(CURRENT_RECORD.getCurrentSublistValue(currentSublist, 'custpage_selected'));
                        var item_avalable = Number(CURRENT_RECORD.getSublistValue(currentSublist, 'custpage_avalable', currentLine));
                        if (item_selected > item_avalable) {
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_selected',
                                value: item_avalable,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_is_select',
                                value: true,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else if (item_selected <= 0){
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_selected',
                                value: '',
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_is_select',
                                value: false,
                                ignoreFieldChange: true
                            });
                            CURRENT_RECORD.commitLine(currentSublist);
                        }
                        else if (item_selected <= item_avalable){
                            CURRENT_RECORD.setCurrentSublistValue({
                                sublistId: currentSublist,
                                fieldId: 'custpage_is_select',
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

    } catch(e) {
        console.log('ERROR | '+e);
        log.error('fieldChanged | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID+' | currentField = '+currentField+' | currentSublist = '+currentSublist+' | currentLine = '+currentLine, e);
    }
}

// ################################################################################################
// ===== Client Library Function
// ################################################################################################
function backFromPackContainerItemPage() {
    var isConfirm = confirm('Would you like to Back?');
    if (isConfirm == true) {
        CURRENT_RECORD.setValue('is_confirm', true);
        NLDoMainFormButtonAction('submitter', true);
    }
}

function backFromLoadingPlanPreview() {
    var isConfirm = confirm('Would you like to Back?');
    if (isConfirm == true) {
        CURRENT_RECORD.setValue('step', 'LoadingPlan');
        CURRENT_RECORD.setValue('is_confirm', true);
        NLDoMainFormButtonAction('submitter', true);
    }
}

function markListAll(subListId) {
    var line_count = CURRENT_RECORD.getLineCount(subListId);
    for (var i = 0; i < line_count; i++) {
        var avalable = Number(CURRENT_RECORD.getSublistValue(subListId, 'custpage_avalable', i));
        if (avalable > 0) {
            CURRENT_RECORD.selectLine(subListId, i);
            CURRENT_RECORD.setCurrentSublistValue(subListId, 'custpage_is_select', true);
            CURRENT_RECORD.commitLine(subListId);
        }
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

function setPackContainerItem() {
    var line_select = CURRENT_RECORD.getValue('custpage_line_select');
    var internalid = CURRENT_RECORD.getValue('custpage_internalid');
    var containersnumber = CURRENT_RECORD.getValue('custpage_custrecord_cit_containersnumber');
    var containerstype_id = CURRENT_RECORD.getValue('custpage_custrecord_exp_containerstype');
    var containerstype_name = CURRENT_RECORD.getText('custpage_custrecord_exp_containerstype');
    var containerssize_id = CURRENT_RECORD.getValue('custpage_custrecord_exp_containerssize');
    var containerssize_name = CURRENT_RECORD.getText('custpage_custrecord_exp_containerssize');
    var containersdescription = CURRENT_RECORD.getValue('custpage_custrecord_exp_containersdescription');
    var key = containersnumber;
    if (!!key) {

        PACK_DETAIL[key] = {};
        PACK_DETAIL[key]['line'] = line_select;
        PACK_DETAIL[key]['internalid'] = internalid;
        PACK_DETAIL[key]['number'] = containersnumber;
        PACK_DETAIL[key]['type_id'] = containerstype_id;
        PACK_DETAIL[key]['type_name'] = containerstype_name;
        PACK_DETAIL[key]['size_id'] = containerssize_id;
        PACK_DETAIL[key]['size_name'] = containerssize_name;
        PACK_DETAIL[key]['description'] = containersdescription;
        PACK_DETAIL[key]['selected'] = 0;
        PACK_DETAIL[key]['net_weight'] = 0;
        PACK_DETAIL[key]['gross_weight'] = 0;
        PACK_DETAIL[key]['list'] = [];
        
        var line_count = CURRENT_RECORD.getLineCount('custpage_pack_items_list');
        for (var i = 0; i < line_count; i++) {
            var is_select = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_is_select', i);
            if (is_select == true) {
                var item_data = {};
                    item_data['line_id'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_line', i);
                    item_data['id'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_internalid_item', i);
                    item_data['code'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_itemid_item', i);
                    item_data['name'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_displayname_item', i);
                    item_data['memo'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_memo', i);
                    item_data['qty'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_quantityuom', i);
                    item_data['selected'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_selected', i);
                    item_data['unitid'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_unitid', i);
                    item_data['unit'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_unit', i);
                    item_data['net_weight'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_net_weight', i);
                    item_data['gross_weight'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_gross_weight', i);
                    item_data['custcol_exp_cirefpinum'] = CURRENT_RECORD.getSublistValue('custpage_pack_items_list', 'custpage_custcol_exp_cirefpinum', i);
                PACK_DETAIL[key]['list'].push(item_data);
                PACK_DETAIL[key]['selected'] += item_data['selected'];
            }
        }
    }

    CURRENT_RECORD.setValue('pack_detail', JSON.stringify(PACK_DETAIL));
    updateItemDetail();
    updateContainerDetail();
}

function updateItemDetail() {
    ITEM_DETAIL = {};
    for (var n in PACK_DETAIL) {
        for (var k in PACK_DETAIL[n]['list']) {
            var line_id = PACK_DETAIL[n]['list'][k]['line_id'];
            var key = line_id;
            if (!ITEM_DETAIL[key]) {
                ITEM_DETAIL[key] = JSON.parse(JSON.stringify(PACK_DETAIL[n]['list'][k]));
                ITEM_DETAIL[key]['selected'] = 0;
            }
            ITEM_DETAIL[key]['selected'] += PACK_DETAIL[n]['list'][k]['selected'];
        }
    }
    CURRENT_RECORD.setValue('item_detail', JSON.stringify(ITEM_DETAIL));
}

function updateContainerDetail() {
    CONTAINER_DETAIL = {};
    for (var n in PACK_DETAIL) {
        var internalid = PACK_DETAIL[n]['internalid'];
        var key = internalid;
        if (!CONTAINER_DETAIL[key]) {
            CONTAINER_DETAIL[key] = JSON.parse(JSON.stringify(PACK_DETAIL[n]));
            delete CONTAINER_DETAIL[key]['list'];
            CONTAINER_DETAIL[key]['selected'] = 0;
        }
        CONTAINER_DETAIL[key]['selected'] += 1;
    }
    CURRENT_RECORD.setValue('container_detail', JSON.stringify(CONTAINER_DETAIL));
}

function disableAndHiddenLineFieldContainersDetails() {
    var subListId = 'custpage_containers_details_list';
    var line_count = Number(CURRENT_RECORD.getLineCount(subListId));
    for (var i = 0; i < line_count; i++) {
        var avalable = Number(CURRENT_RECORD.getSublistValue(subListId, 'custpage_avalable', i));
        if (avalable <= 0) {
            CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'custpage_is_select',
                line: i
            }).isDisabled = true;
        }
    }
}

function disableAndHiddenLineFieldContainersPacking() {
    var subListId = 'custpage_containers_packing_list';
    var line_count = Number(CURRENT_RECORD.getLineCount(subListId));
    for (var i = 0; i < line_count; i++) {
        var number = Number(CURRENT_RECORD.getSublistValue(subListId, 'custpage_number', i));
        if (!number) {
            var field = CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'custpage_is_select',
                line: i
            });
            if (!!field) field.isDisabled = true;
        }
    }
}

function disableAndHiddenLineFieldPackItems() {
    var subListId = 'custpage_pack_items_list';
    var line_count = Number(CURRENT_RECORD.getLineCount(subListId));
    for (var i = 0; i < line_count; i++) {
        var avalable = Number(CURRENT_RECORD.getSublistValue(subListId, 'custpage_avalable', i));
        if (avalable <= 0) {
            CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'custpage_is_select',
                line: i
            }).isDisabled = true;
            CURRENT_RECORD.getSublistField({
                sublistId: subListId,
                fieldId: 'custpage_selected',
                line: i
            }).isDisabled = true;
        }
    }
}
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 *
 * @summary     Client Script of "customscript_exp_sl_booking".
 * @author      Rakop M. [2024/08/12] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CURRENT_RECORD, TABLE_DATA, STEP, DATA_DETAIL;
var TIMER_INTERVAL, LINE_INDEX, IS_WAITING;
var USE_SUB, USER_ROLE_ID, USER_ID;
var SL_SCRIPT_ID = 'customscript_exp_sl_booking';
var PARAMS, FIELD_FORMAT;
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
        PARAMS = {};

        return {
            pageInit: SL_pageInit,
            saveRecord: SL_saveRecord,
            // fieldChanged: SL_fieldChanged,
            // lineInit: SL_lineInit,
            // validateDelete: SL_validateDelete,
            // sublistChanged: SL_sublistChanged,
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
        if (STEP == '') {

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
    // ===== Submit Booking
    // ################################################################################################
    try {
        if (STEP == 'GenerateBooking') {
            var is_confirm = CURRENT_RECORD.getValue('is_confirm');
            if (is_confirm == false) {
                var isConfirm = confirm('Would you like to Submit?');
                if (isConfirm == true) {
                    // document.getElementById('loadingScreen').style.display = '';
                    setTimeout(function () {
                        try {
                            CURRENT_RECORD.setValue('is_confirm', true);
                            NLDoMainFormButtonAction('submitter', true);
                        } catch (e) {
                            alert(e.message)
                            console.log('ERROR | ' + e);
                        }
                        // document.getElementById('loadingScreen').style.display = 'none';
                        CURRENT_RECORD.setValue('is_confirm', false);
                    }, 100);
                }
                return false;
            }
        }
    } catch(e) {
        alert(e.message)
        console.log('ERROR | '+e);
        document.getElementById('loadingScreen').style.display = 'none';
        return false;
    }

    return true;
}
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
var currentRecord, https, log, record, runtime, search, xml , url ,message , query, ACMlib , libCode;
var cRecord = null;
define(['N/currentRecord', 'N/https', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/xml' , 'N/url' , 'N/ui/message' , 'N/query' , '../lib/Libraries Code 2.0.220622.js'],
    /**
     * @param {currentRecord} _currentRecord
     * @param {https} _https
     * @param {log} _log
     * @param {record} _record
     * @param {runtime} _runtime
     * @param {search} _search
     * @param {xml} _xml
     */
    function(_currentRecord, _https, _log, _record, _runtime, _search , _xml , _url , _message , _query , _ACMlib , _libCode) {
        currentRecord = _currentRecord;
        https = _https;
        log = _log;
        record = _record;
        runtime = _runtime;
        search = _search;
        xml = _xml;
        url = _url;
        message = _message;
        query = _query;
        libCode = _libCode;
        return {
            pageInit: pageInit,
            backtoTrans : backtoTrans,
            // saveRecord : saveRecord,
        };
    });

/**
 * Function to be executed after page is initialized.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
 *
 * @since 2015.2
 */
function pageInit(scriptContext) {
    window.onbeforeunload = null;
    cRecord = scriptContext.currentRecord;


}

function backtoTrans(recid){
    var url = '/app/accounting/transactions/salesord.nl?id=' + recid;
    window.location.href = url;
}

/**
 * Function to be executed when field is changed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
 *
 * @since 2015.2
 */
function fieldChanged(scriptContext) {

}

/**
 * Function to be executed when field is slaved.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 *
 * @since 2015.2
 */
function postSourcing(scriptContext) {

}

/**
 * Function to be executed after sublist is inserted, removed, or edited.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @since 2015.2
 */
function sublistChanged(scriptContext) {

}

/**
 * Function to be executed after line is selected.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @since 2015.2
 */
function lineInit(scriptContext) {

}

/**
 * Validation function to be executed when field is changed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
 *
 * @returns {boolean} Return true if field is valid
 *
 * @since 2015.2
 */
function validateField(scriptContext) {

}

/**
 * Validation function to be executed when sublist line is committed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function validateLine(scriptContext) {

    //#######################################################################################
    //#######################################################################################
}

/**
 * Validation function to be executed when sublist line is inserted.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function validateInsert(scriptContext) {

}

/**
 * Validation function to be executed when record is deleted.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function validateDelete(scriptContext) {

}

/**
 * Validation function to be executed when record is saved.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @returns {boolean} Return true if record is valid
 *
 * @since 2015.2
 */

function saveRecord(scriptContext) {



}


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
var currentRecord, https, log, record, runtime, search, xml, url, message, query, ACMlib, libCode;
var cRecord = null;
define(['N/currentRecord', 'N/https', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/xml', 'N/url', 'N/ui/message', 'N/query', '../lib/Libraries Code 2.0.220622.js'],
	/**
	 * @param {currentRecord} _currentRecord
	 * @param {https} _https
	 * @param {log} _log
	 * @param {record} _record
	 * @param {runtime} _runtime
	 * @param {search} _search
	 * @param {xml} _xml
	 */
	function (_currentRecord, _https, _log, _record, _runtime, _search, _xml, _url, _message, _query, _ACMlib, _libCode) {
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
			backtoTrans: backtoTrans,
			sublistChanged: sublistChanged,
            saveRecord: saveRecord,
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


function backtoTrans(recid) {
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
	var sublistid = scriptContext.sublistId;
	var currentRecord = scriptContext.currentRecord
	// console.log(currentRecord);
	if (sublistid == 'item_sublist') {

		var cqty = currentRecord.getCurrentSublistValue({
			sublistId: sublistid,
			fieldId: 'quantity'
		});

		var index = currentRecord.getCurrentSublistIndex({
			sublistId: sublistid
		});

        var maxqty = currentRecord.getSublistValue({
			sublistId: sublistid,
			fieldId: 'maxquantity' ,
            line: index
		});

		if (!cqty || !maxqty) {
            return;
        }

		if (Number(cqty) > Number(maxqty)) {
			alert('จำนวนที่กรอกเกินกว่า Quantity Commercial ที่กำหนดไว้ กรุณากรอกใหม่');
			currentRecord.setCurrentSublistValue({
				sublistId: sublistid,
				fieldId: 'quantity', value: maxqty
			});
            return ;
		}

	}
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
    var currentRecord = scriptContext.currentRecord;
    console.log(cRecord)
    var stepfield = currentRecord.getValue('stepfield');
    var sublistId = 'item_sublist';
    if(stepfield == 'T') {
        var data = [];
        var linecount = currentRecord.getLineCount(sublistId);
        for(var i = 0; i < linecount; i++) {
            var record = currentRecord.selectLine({
                sublistId: sublistId,
                line: i
            });

            var qty = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'quantity' });
            if( !qty || Number(qty) == 0 ){ continue; }
            var fromlocation = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'fromlocation' });
            var itemid = cRecord.getSublistValue({ sublistId: sublistId, fieldId: 'itemid' , line : i });
            console.log(itemname)
            var itemname = cRecord.getSublistValue({ sublistId: sublistId, fieldId: 'itemname' , line : i });
            var unit = cRecord.getSublistValue({ sublistId: sublistId, fieldId: 'unit' , line : i });
            var containers = cRecord.getSublistValue({ sublistId: sublistId, fieldId: 'containers' , line : i });
            var tolocation = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'tolocation' });
            var item ={
                fromlocation : fromlocation,
	            itemid : itemid,
                itemname : itemname,
                unit : unit,
                containers : containers,
                tolocation : tolocation,
                qty : qty,
            }
            console.log(item)
            data.push(item);
        }
        currentRecord.setValue({ fieldId : 'sublistdata' , value : JSON.stringify(data)})
        return false;
    }

}


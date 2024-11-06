/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType Suitelet
 *
 * @summary     Split Proforma Invoice
 * @author      Rakop M. [2024/07/15] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CS_SCRIPT_PATH = './EXP SL Split Proforma Invoice CS.js';
var SL_SCRIPT_ID = 'customscript_exp_sl_split_pro_inv';
var MR_SCRIPT_ID = null;
var TABLE_DATA = {};
var REC_DATA = {};
var SUBLIST_FIELD_FORMAT = {};
var REQUEST, PARAMS, USE_SUB, USER_ROLE_ID, USER_ID;

var ui, record, runtime, search, task, error, redirect, url, format;
define(['N/ui/serverWidget', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/error', 'N/redirect', 'N/url', 'N/format'],
    function(_ui,  _record, _runtime, _search, _task, _error, _redirect, _url, _format) {

        ui = _ui;
        record = _record;
        runtime = _runtime;
        search = _search;
        task = _task;
        error = _error;
        redirect = _redirect;
        url = _url;
        format = _format;

        USE_SUB = runtime.isFeatureInEffect('SUBSIDIARIES');
        USER_ROLE_ID = runtime.getCurrentUser().role;
        USER_ID = runtime.getCurrentUser().id;

        return{
            onRequest: onRequest
        };
    }
);

// ################################################################################################
// ===== Suitelet Function
// ################################################################################################
function onRequest(context) {
    REQUEST = context.request;
    PARAMS = REQUEST.parameters;
    formName = 'Split Proforma Invoice';
    var form = ui.createForm(formName);

    if (PARAMS['step'] == 'SplitProformaInvoice') {

        log.debug('PARAMS', PARAMS);
        log.debug('In Progress | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'teble_data', type: 'inlinehtml', label: 'TABLE_DATA' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'sublist_field_format', type: 'longtext', label: 'SUBLIST_FIELD_FORMAT' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_next', type: 'checkbox', label: 'Is Next' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'longtext', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'address_map', type: 'longtext', label: 'ADDRESS_MAP' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'customer_address_map', type: 'longtext', label: 'CUSTOMER_ADDRESS_MAP' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Get Sales Order Information
        // ################################################################################################
        var ssResult = getSalesOrderInformation(PARAMS['rec_id']);

        // ################################################################################################
        // ===== Get Customer Address Information
        // ################################################################################################
        var customerAddress = getCustomerAddressObject(ssResult[0].getValue('entity'));
        var CUSTOMER_ADDRESS = customerAddress['CUSTOMER_ADDRESS'];
        var CUSTOMER_ADDRESS_MAP = customerAddress['CUSTOMER_ADDRESS_MAP'];
        var ADDRESS_MAP = customerAddress['ADDRESS_MAP'];

        // ################################################################################################
        // ===== Check Order Split
        // ################################################################################################
        var SPLIT_PREFIX = '-';
        var SPLIT_TYPE = 1; // Number
        var SPLIT_MAX = 0;
        var SPLIT_RUN = 0;
        var RUNNING_ORDER = ssResult[0].getValue('tranid');
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'numbertext', join: null, operator: 'startswith', values: ssResult[0].getValue('tranid') }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var columnSearch = [];
            columnSearch.push(search.createColumn({ name: 'internalid', summary: 'COUNT' }));
            columnSearch.push(search.createColumn({ name: 'custbody_exp_splitnumber', summary: 'MAX' }));
        var ssResultCheck = getSearch('salesorder', null, columnSearch, filterSearch);
        if (ssResultCheck.length > 0) {
            SPLIT_MAX = Number(ssResultCheck[0].getValue({ name: 'custbody_exp_splitnumber', summary: 'MAX' }));
        }

        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'isinactive', join: null, operator: 'is', values: 'F' }) );
        var columnSearch = [];
            columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
            columnSearch.push(search.createColumn({ name: 'custrecord_exps_splitrunning', summary: null }));
            columnSearch.push(search.createColumn({ name: 'custrecord_exps_prefixsplit', summary: null }));
        var ssResultCheck = getSearch('customrecord_exp_enablefeatures', null, columnSearch, filterSearch);
        if (ssResultCheck.length > 0) {
            SPLIT_TYPE = ssResultCheck[0].getValue({ name: 'custrecord_exps_splitrunning', summary: null });
            SPLIT_PREFIX = ssResultCheck[0].getText({ name: 'custrecord_exps_prefixsplit', summary: null });
        }

        SPLIT_RUN = SPLIT_MAX + 1;
        if (SPLIT_TYPE == 1) { // Number
            RUNNING_ORDER = RUNNING_ORDER + SPLIT_PREFIX + SPLIT_RUN;
        }
        else { // Number
            RUNNING_ORDER = RUNNING_ORDER + SPLIT_PREFIX + SPLIT_RUN;
        }

        // ################################################################################################
        // ===== Validate Data
        // ################################################################################################
        if (checkInProgressData(RUNNING_ORDER)) {
            form = ui.createForm('Warning');
            var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = '<b style="color:Tomato;">The information has changed. Please try again.</b>';
            var script_function = getStartPageFunction(PARAMS['ref_pi_id_select']);
            form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
            context.response.writePage(form);
            return;
        }

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var uiField = form.addField({ id: 'order_select', type: 'text', label: 'PI No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = RUNNING_ORDER;

        if (USE_SUB == true) {
            var uiField = form.addField({ id: 'subsidiary_select', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = ssResult[0].getValue('subsidiary');
        }

        var uiField = form.addField({ id: 'date_select', type: 'date', label: 'Date', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('trandate');

        var uiField = form.addField({ id: 'ref_pi_select', type: 'text', label: 'Ref Original PI No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'hidden' });
            uiField.defaultValue = ssResult[0].getValue('tranid');

        var uiField = form.addField({ id: 'ref_pi_id_select', type: 'select', label: 'Ref Original PI No', source: 'salesorder', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var uiField = form.addField({ id: 'split_no_select', type: 'integer', label: 'Split No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = SPLIT_RUN;

        var uiField = form.addField({ id: 'customer_select', type: 'select', label: 'Customer', source: 'customer', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('entity');

        var uiField = form.addField({ id: 'currency_select', type: 'select', label: 'Currency', source: 'currency', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('currency');

        // ################################################################################################
        // ===== Items Tab
        // ################################################################################################
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;

        form.addTab({ id: 'custpage_items_tab', label: 'Items' });
        var subListId = 'item_list';
        var field_format = [];
        var sublist = form.addSublist({ id: subListId, type: 'list', label: 'Items', tab: 'custpage_items_tab'  });
            sublist.addButton({ id: 'bt_mark_all', label: 'Mark All', functionName: 'markListAll("'+subListId+'")' });
            sublist.addButton({ id: 'bt_unmark_all', label: 'Unmark All', functionName: 'unmarkListAll("'+subListId+'")' });
        var field = { id: 'is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });
        var field = { id: 'ref_pi', label: 'Ref. PI', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'line_id', label: 'Item Line Id', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_id', label: 'Item Id', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_text', label: 'Item', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_code', label: 'Item Code', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_description', label: 'Item Description', type: 'textarea', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_qty', label: 'Quantity', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_unit', label: 'Unit', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_selected', label: 'Selected', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });
        var field = { id: 'item_rate', label: 'Unit Price', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_split_qty', label: 'Split Qty', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_avalable', label: 'Remaining', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });

        SUBLIST_FIELD_FORMAT[subListId] = JSON.parse(JSON.stringify(field_format));
        log.debug('field_format', field_format);

        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var line_id = ssResult[i].getValue({ name: 'line', join: null, summary: null });
            var key = rec_id + '_' +line_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                REC_DATA[key]['ref_pi'] = ssResult[i].getValue({ name: 'tranid', join: null, summary: null });
                REC_DATA[key]['line_id'] = ssResult[i].getValue({ name: 'line', join: null, summary: null });
                REC_DATA[key]['item_id'] = ssResult[i].getValue({ name: 'item', join: null, summary: null });
                REC_DATA[key]['item_code'] = ssResult[i].getValue({ name: 'itemid', join: 'item', summary: null });
                REC_DATA[key]['item_name'] = ssResult[i].getValue({ name: 'displayname', join: 'item', summary: null });
                REC_DATA[key]['item_text'] = REC_DATA[key]['item_code'] + ' ' + REC_DATA[key]['item_name'];
                REC_DATA[key]['item_description'] = ssResult[i].getValue({ name: 'memo', join: null, summary: null });
                REC_DATA[key]['item_qty'] = Number(ssResult[i].getValue({ name: 'quantityuom', join: null, summary: null }));
                REC_DATA[key]['item_unit'] = ssResult[i].getValue({ name: 'unit', join: null, summary: null });
                REC_DATA[key]['item_rate'] = Number((ssResult[i].getValue({ name: 'fxamount', join: null, summary: null }) / REC_DATA[key]['item_qty']).toFixed(2));
                REC_DATA[key]['item_split_qty'] = Number(ssResult[i].getValue({ name: 'custcol_exp_splitquantity', join: null, summary: null }));
                REC_DATA[key]['item_avalable'] = REC_DATA[key]['item_qty'] - REC_DATA[key]['item_split_qty'];
                recDataArr.push(REC_DATA[key]);
            }
        }

        log.debug('REC_DATA 1', REC_DATA);

        var tab = {};
            tab['name'] = formName;
            tab['data'] = [];

        for (var key in recDataArr) {
            var data = {};
                data = JSON.parse(JSON.stringify(recDataArr[key]));

            tab['data'].push(data);
        }

        TABLE_DATA['tab'].push(tab);
        log.debug(tab['name'], TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]);
        TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['columns_format'] = field_format;

        var ignoreValue = ['entry'];
        var line = 0;
        for (var index in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data']) {
            for (var column in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index]) {
                var type = 'text';
                var value = TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index][column];
                for (var n in field_format) {
                    if (field_format[n]['id'] == column) {
                        type = field_format[n]['type'];
                        continue;
                    }
                }
                if (ignoreValue.indexOf(value) == -1) {
                    if (type == 'text' || type == 'select') {
                        value = nvlNull(value);
                    }
                    else if (type == 'float') {
                        value = Number(value).toFixed(2);
                    }
                    else {
                        value = nvlNull(value);
                    }

                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        if (RUNNING_ORDER == PARAMS['order_select']) {
            var line = 0;
            var line_count = REQUEST.getLineCount(subListId);
            for (var i = 0; i < line_count; i++) {
                var is_select = REQUEST.getSublistValue(subListId, 'is_select', i);
                var item_selected = REQUEST.getSublistValue(subListId, 'item_selected', i);
                if (is_select == 'T') {
                    sublist.setSublistValue({ id: 'is_select', line: line, value: is_select });
                    sublist.setSublistValue({ id: 'item_selected', line: line, value: item_selected });
                    line++;
                }
            }
        }

        // ################################################################################################
        // ===== Address Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_address_tab', label: 'Address' });
        var uiField = form.addField({ id: 'ship_select', type: 'select', label: 'Ship To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
            uiField.defaultValue = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'shippingaddress' })];
        if (PARAMS['ship_select'] != undefined) uiField.defaultValue = PARAMS['ship_select'];
        var uiField = form.addField({ id: 'ship_to_address_select', type: 'textarea', label: 'Ship To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'shipaddress', join: null });
            if (PARAMS['ship_to_address_select'] != undefined) uiField.defaultValue = PARAMS['ship_to_address_select'];

        var uiField = form.addField({ id: 'bill_select', type: 'select', label: 'Bill To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
            uiField.defaultValue = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'billingaddress' })];
        if (PARAMS['bill_select'] != undefined) uiField.defaultValue = PARAMS['bill_select'];
        var uiField = form.addField({ id: 'bill_to_address_select', type: 'textarea', label: 'Bill To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'billaddress', join: null });
            if (PARAMS['bill_to_address_select'] != undefined) uiField.defaultValue = PARAMS['bill_to_address_select'];

        // ################################################################################################
        // ===== EXP Sales Export Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_exp_sales_export_tab', label: 'EXP Sales Export' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - Sales Export Information
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'sales_export_information', label: 'Sales Export Information', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'terms_payment_select', type: 'select', label: 'Terms of Payment', source: 'customlist_exp_termsofpay', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_termsofpay');
            if (PARAMS['terms_payment_select'] != undefined) uiField.defaultValue = PARAMS['terms_payment_select'];
        var uiField = form.addField({ id: 'incoterms_select', type: 'select', label: 'Incoterms', source: 'incoterm', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_incoterms');
            if (PARAMS['incoterms_select'] != undefined) uiField.defaultValue = PARAMS['incoterms_select'];

        // ################################################################################################
        // ===== EXP Sales Export Tab - Shipping
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'shipping_information', label: 'Shipping', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'country_of_origin_select', type: 'select', label: 'Country of Origin', source: 'customlist_exp_countryorigin', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_countryorigin');
            if (PARAMS['country_of_origin_select'] != undefined) uiField.defaultValue = PARAMS['country_of_origin_select'];
        var uiField = form.addField({ id: 'loading_type_select', type: 'select', label: 'Loading Type', source: 'customlist_exp_loadingtype', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_countryorigin');
            if (PARAMS['loading_type_select'] != undefined) uiField.defaultValue = PARAMS['loading_type_select'];
        var uiField = form.addField({ id: 'packing_select', type: 'text', label: 'Packing', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_packing');
            if (PARAMS['packing_select'] != undefined) uiField.defaultValue = PARAMS['packing_select'];
        var uiField = form.addField({ id: 'tolerance_select', type: 'percent', label: 'Tolerance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_tolerance');
            if (PARAMS['tolerance_select'] != undefined) uiField.defaultValue = PARAMS['tolerance_select'];
        var uiField = form.addField({ id: 'shipping_mark_select', type: 'textarea', label: 'Shipping Mark', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_shippingmarks');
            if (PARAMS['shipping_mark_select'] != undefined) uiField.defaultValue = PARAMS['shipping_mark_select'];
        var uiField = form.addField({ id: 'etd_date_select', type: 'date', label: 'ETD Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etddate');
            if (PARAMS['etd_date_select'] != undefined) uiField.defaultValue = PARAMS['etd_date_select'];
        var uiField = form.addField({ id: 'etd_date_text_select', type: 'text', label: 'ETD Date (Text)', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etdtext');
            if (PARAMS['etd_date_text_select'] != undefined) uiField.defaultValue = PARAMS['etd_date_text_select'];
        var uiField = form.addField({ id: 'eta_date_select', type: 'date', label: 'ETA Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etadate');
            if (PARAMS['eta_date_select'] != undefined) uiField.defaultValue = PARAMS['eta_date_select'];
        // var uiField = form.addField({ id: 'containers_type_select', type: 'select', label: 'Containers Type', source: 'customlist_exp_containerstype', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'entry' });
        //     uiField.defaultValue = ssResult[0].getValue('custbody_exp_containerstype');
        //     if (PARAMS['containers_type_select'] != undefined) uiField.defaultValue = PARAMS['containers_type_select'];
        // var uiField = form.addField({ id: 'containers_size_select', type: 'select', label: 'Containers Size', source: 'customlist_exp_containerssize', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'entry' });
        //     uiField.defaultValue = ssResult[0].getValue('custbody_exp_containersize');
        //     if (PARAMS['containers_size_select'] != undefined) uiField.defaultValue = PARAMS['containers_size_select'];
        // var uiField = form.addField({ id: 'no_of_containers_select', type: 'text', label: 'No. of Containers', source: null, container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'entry' });
        //     uiField.defaultValue = ssResult[0].getValue('custbody_exp_containerqty');
        //     if (PARAMS['no_of_containers_select'] != undefined) uiField.defaultValue = PARAMS['no_of_containers_select'];
        var uiField = form.addField({ id: 'insurance_select', type: 'text', label: 'Insurance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_insurance');
            if (PARAMS['insurance_select'] != undefined) uiField.defaultValue = PARAMS['insurance_select'];
        var uiField = form.addField({ id: 'net_weight_select', type: 'text', label: 'Net Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_netweigh');
            if (PARAMS['net_weight_select'] != undefined) uiField.defaultValue = PARAMS['net_weight_select'];
        var uiField = form.addField({ id: 'gross_weight_select', type: 'text', label: 'Gross Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_grossweight');
            if (PARAMS['gross_weight_select'] != undefined) uiField.defaultValue = PARAMS['gross_weight_select'];
        var uiField = form.addField({ id: 'cbm_select', type: 'text', label: 'CBM.', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_cbm');
            if (PARAMS['cbm_select'] != undefined) uiField.defaultValue = PARAMS['cbm_select'];
        var fieldFormat = { id: 'custpage_custbody_exp_shippingmaster', type: 'select', label: 'EXP Shipping Master', source: 'customrecord_exp_shippingmaster', container: 'shipping_information' };
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue(fieldFormat.id.replace('custpage_', ''));
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id];
        var fieldFormat = { id: 'custpage_custbody_exp_shipping_port', type: 'text', label: 'EXP Shipping Port', source: null, container: 'shipping_information' };
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue(fieldFormat.id.replace('custpage_', ''));
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id];
        var fieldFormat = { id: 'custpage_custbody_exp_destination_country', type: 'text', label: 'EXP Destination Country', source: null, container: 'shipping_information' };
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue(fieldFormat.id.replace('custpage_', ''));
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id];
        var fieldFormat = { id: 'custpage_custbody_exp_port', type: 'text', label: 'EXP Port', source: null, container: 'shipping_information' };
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue(fieldFormat.id.replace('custpage_', ''));
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id];
        var fieldFormat = { id: 'custpage_custbody_exp_intransit_to', type: 'text', label: 'EXP Intransit To', source: null, container: 'shipping_information' };
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue(fieldFormat.id.replace('custpage_', ''));
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id];

        // ################################################################################################
        // ===== EXP Sales Export Tab - EXP Containers Details
        // ################################################################################################
        var field_format = [];
        var subListId = 'containers_details_list';
        var sublist = form.addSublist({ id: subListId, type: 'inlineeditor', label: 'EXP Containers Details', tab: 'custpage_exp_sales_export_tab'  });
        var field = { id: 'containers_id_select', label: 'EXP Containers ID', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'transrefcon_id_select', label: 'Transaction', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'containers_type_select', label: 'EXP Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });
        var field = { id: 'containers_size_select', label: 'EXP Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });
        var field = { id: 'no_of_containers_select', label: 'EXP NO. of Containers', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });
        var field = { id: 'containers_description_select', label: 'EXP Containers Details', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });

        var ssResult = getContainersInformation(PARAMS['rec_id']);
        var line_data = {};
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var key = rec_id;
            if (!line_data[key]) {
                line_data[key] = {};
                line_data[key]['containers_id_select'] = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
                line_data[key]['transrefcon_id_select'] = ssResult[i].getValue({ name: 'custrecord_exp_transrefcon', join: null, summary: null });
                line_data[key]['containers_type_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containerstype', join: null, summary: null });
                line_data[key]['containers_size_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containerssize', join: null, summary: null });
                line_data[key]['no_of_containers_select'] = ssResult[i].getValue({ name: 'custrecord_exp_qtycontainers', join: null, summary: null });
                line_data[key]['containers_description_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containersdescription', join: null, summary: null });
                recDataArr.push(line_data[key]);
            }
        }

        log.debug('line_data', line_data);

        var tab = {};
            tab['name'] = formName;
            tab['data'] = [];

        for (var key in recDataArr) {
            var data = {};
                data = JSON.parse(JSON.stringify(recDataArr[key]));

            tab['data'].push(data);
        }

        TABLE_DATA['tab'].push(tab);
        log.debug(tab['name'], TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]);
        TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['columns_format'] = field_format;

        var ignoreValue = ['entry'];
        var line = 0;
        var line_count = REQUEST.getLineCount(subListId);
        if (line_count > 0) {
            for (var i = 0; i < line_count; i++) {
                for (var n in field_format) {
                    var column = field_format[n]['id'];
                    var value = REQUEST.getSublistValue(subListId, column, i);
                    sublist.setSublistValue({id: column, line: line, value: value});
                }
                line++;
            }
        }
        else {
            for (var index in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data']) {
                for (var column in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index]) {
                    var type = 'text';
                    var value = TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index][column];
                    for (var n in field_format) {
                        if (field_format[n]['id'] == column) {
                            type = field_format[n]['type'];
                            continue;
                        }
                    }
                    if (ignoreValue.indexOf(value) == -1) {
                        if (type == 'text' || type == 'select') {
                            value = nvlNull(value);
                        }
                        else if (type == 'float') {
                            value = Number(value).toFixed(2);
                        }
                        else {
                            value = nvlNull(value);
                        }

                        sublist.setSublistValue({ id: column, line: line, value: value });
                    }
                }
                line++;
            }
        }

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        form.updateDefaultValues({
            step: 'Preview',
            rec_id: PARAMS['rec_id'],
            teble_data: JSON.stringify(TABLE_DATA),
            params: JSON.stringify(PARAMS),
            sublist_field_format: JSON.stringify(SUBLIST_FIELD_FORMAT),
            address_map: JSON.stringify(ADDRESS_MAP),
            customer_address_map: JSON.stringify(CUSTOMER_ADDRESS_MAP)
        });

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Next' });

        var scriptURL = url.resolveRecord({
                        recordType: 'salesorder',
                        recordId: PARAMS['rec_id']
                    });
        var script_function = "page_init;";
            script_function += "function bt_cancel(){ window.location = '" + scriptURL + "'; }";
            script_function += "bt_cancel;";
        form.addButton({ id: 'bt_cancel', label: 'Cancel', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'Preview') {

        log.debug('PARAMS', PARAMS);
        log.debug('Preview | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        formName = 'Preview';
        form = ui.createForm(formName);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'teble_data', type: 'inlinehtml', label: 'TABLE_DATA' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'sublist_field_format', type: 'longtext', label: 'SUBLIST_FIELD_FORMAT' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_next', type: 'checkbox', label: 'Is Next' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'longtext', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Validate Data
        // ################################################################################################
        if (checkInProgressData(PARAMS['order_select'])) {
            form = ui.createForm('Warning');
            var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = '<b style="color:Tomato;">The information has changed. Please try again.</b>';
            var script_function = getStartPageFunction(PARAMS['ref_pi_id_select']);
            form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
            context.response.writePage(form);
            return;
        }

        // ################################################################################################
        // ===== Get Customer Address Information
        // ################################################################################################
        var customerAddress = getCustomerAddressObject(PARAMS['customer_select']);
        var CUSTOMER_ADDRESS = customerAddress['CUSTOMER_ADDRESS'];
        var CUSTOMER_ADDRESS_MAP = customerAddress['CUSTOMER_ADDRESS_MAP'];
        var ADDRESS_MAP = customerAddress['ADDRESS_MAP'];

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var uiField = form.addField({ id: 'order_select', type: 'text', label: 'PI No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        if (USE_SUB == true) {
            var uiField = form.addField({ id: 'subsidiary_select', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        }
        var uiField = form.addField({ id: 'date_select', type: 'date', label: 'Date', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'ref_pi_id_select', type: 'select', label: 'Ref Original PI No.', source: 'salesorder', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'ref_pi_select', type: 'text', label: 'Ref Original PI No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'hidden' });
        var uiField = form.addField({ id: 'split_no_select', type: 'integer', label: 'Split No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'customer_select', type: 'select', label: 'Customer', source: 'customer', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'currency_select', type: 'select', label: 'Currency', source: 'currency', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== Items Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_items_tab', label: 'Items' });

        var field_format = [];
        var subListId = 'item_list';
        var sublist = form.addSublist({ id: subListId, type: 'list', label: 'Items', tab: 'custpage_items_tab'  });
            sublist.addButton({ id: 'bt_mark_all', label: 'Mark All', functionName: 'markAll' });
            sublist.addButton({ id: 'bt_unmark_all', label: 'Unmark All', functionName: 'unmarkAll' });
        var field = { id: 'is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'ref_pi', label: 'Ref. PI', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'line_id', label: 'Item Line Id', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_id', label: 'Item Id', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_code', label: 'Item Code', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_description', label: 'Item Description', type: 'textarea', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_qty', label: 'Quantity', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_unit', label: 'Unit', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_selected', label: 'Selected', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_rate', label: 'Unit Price', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_split_qty', label: 'Split Qty', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_avalable', label: 'Avalable', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });

        var line = 0;
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            var is_select = REQUEST.getSublistValue(subListId, 'is_select', i);
            if (is_select == 'T') {
                for (var n in field_format) {
                    var column = field_format[n]['id'];
                    var value = REQUEST.getSublistValue(subListId, column, i);
                    sublist.setSublistValue({id: column, line: line, value: value});
                }
                line++;
            }
        }

        SUBLIST_FIELD_FORMAT[subListId] = JSON.parse(JSON.stringify(field_format));
        log.debug('field_format', field_format);

        // ################################################################################################
        // ===== Address Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_address_tab', label: 'Address' });
        var uiField = form.addField({ id: 'ship_select', type: 'select', label: 'Ship To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
        var uiField = form.addField({ id: 'ship_to_address_select', type: 'textarea', label: 'Ship To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });

        var uiField = form.addField({ id: 'bill_select', type: 'select', label: 'Bill To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
        var uiField = form.addField({ id: 'bill_to_address_select', type: 'textarea', label: 'Bill To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== EXP Sales Export Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_exp_sales_export_tab', label: 'EXP Sales Export' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - Sales Export Information
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'sales_export_information', label: 'Sales Export Information', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'terms_payment_select', type: 'select', label: 'Terms of Payment', source: 'customlist_exp_termsofpay', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'incoterms_select', type: 'select', label: 'Incoterms', source: 'incoterm', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - Shipping
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'shipping_information', label: 'Shipping', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'country_of_origin_select', type: 'select', label: 'Country of Origin', source: 'customlist_exp_countryorigin', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'loading_type_select', type: 'select', label: 'Loading Type', source: 'customlist_exp_loadingtype', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'packing_select', type: 'text', label: 'Packing', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'tolerance_select', type: 'percent', label: 'Tolerance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'shipping_mark_select', type: 'textarea', label: 'Shipping Mark', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'etd_date_select', type: 'date', label: 'ETD Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'etd_date_text_select', type: 'text', label: 'ETD Date (Text)', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'eta_date_select', type: 'date', label: 'ETA Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        // var uiField = form.addField({ id: 'containers_type_select', type: 'select', label: 'Containers Type', source: 'customlist_exp_containerstype', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
        // var uiField = form.addField({ id: 'containers_size_select', type: 'select', label: 'Containers Size', source: 'customlist_exp_containerssize', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
        // var uiField = form.addField({ id: 'no_of_containers_select', type: 'text', label: 'No. of Containers', source: null, container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'insurance_select', type: 'text', label: 'Insurance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'net_weight_select', type: 'text', label: 'Net Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'gross_weight_select', type: 'text', label: 'Gross Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'cbm_select', type: 'text', label: 'CBM.', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'custpage_custbody_exp_shippingmaster', type: 'select', label: 'EXP Shipping Master', source: 'customrecord_exp_shippingmaster', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'custpage_custbody_exp_shipping_port', type: 'text', label: 'EXP Shipping Port', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'custpage_custbody_exp_destination_country', type: 'text', label: 'EXP Destination Country', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'custpage_custbody_exp_port', type: 'text', label: 'EXP Port', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
        var uiField = form.addField({ id: 'custpage_custbody_exp_intransit_to', type: 'text', label: 'EXP Intransit To', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - EXP Containers Details
        // ################################################################################################
        var field_format = [];
        var subListId = 'containers_details_list';
        var sublist = form.addSublist({ id: subListId, type: 'list', label: 'EXP Containers Details', tab: 'custpage_exp_sales_export_tab'  });
        var field = { id: 'containers_id_select', label: 'EXP Containers ID', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'transrefcon_id_select', label: 'Transaction', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'containers_type_select', label: 'EXP Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'containers_size_select', label: 'EXP Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'no_of_containers_select', label: 'EXP NO. of Containers', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'containers_description_select', label: 'EXP Containers Details', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });

        var line = 0;
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            for (var n in field_format) {
                var column = field_format[n]['id'];
                var value = REQUEST.getSublistValue(subListId, column, i);
                sublist.setSublistValue({id: column, line: line, value: value});
            }
            line++;
        }

        SUBLIST_FIELD_FORMAT[subListId] = JSON.parse(JSON.stringify(field_format));
        log.debug('field_format', field_format);

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'GenerateProformaInvoice';
        defaultValues['rec_id'] =  PARAMS['rec_id'],
        defaultValues['teble_data'] = JSON.stringify(TABLE_DATA);
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['sublist_field_format'] = JSON.stringify(SUBLIST_FIELD_FORMAT);
        form.updateDefaultValues(defaultValues);

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Submit' });
        var script_function = getBackPageFunction(PARAMS['ref_pi_id_select']);
        form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
        var script_function = getReturnRecordFunction(PARAMS['ref_pi_id_select']);
        form.addButton({ id: 'bt_cancel', label: 'Cancel', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'GenerateProformaInvoice') {
        // ################################################################################################
        // ===== Validate Data
        // ################################################################################################
        if (checkInProgressData(PARAMS['order_select'])) {
            form = ui.createForm('Warning');
            var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = '<b style="color:Tomato;">The information has changed. Please try again.</b>';
            var script_function = getStartPageFunction(PARAMS['ref_pi_id_select']);
            form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
            context.response.writePage(form);
            return;
        }

        // ################################################################################################
        // ===== Create Job Record
        // ################################################################################################
        var job_record_rec = record.create({ type: 'customrecord_exp_splitpi_jobprocess', isDynamic: true });
            job_record_rec.setValue('custrecord_spj_script_id', SL_SCRIPT_ID);
            job_record_rec.setValue('custrecord_spj_splitdoc', PARAMS['order_select']);
            job_record_rec.setValue('custrecord_spj_pisplitnum', PARAMS['split_no_select']);
            job_record_rec.setValue('custrecord_spj_refpinum', PARAMS['ref_pi_select']);
        var job_record_id = job_record_rec.save();

        // ################################################################################################
        // ===== Mapping Proforma Invoice
        // ################################################################################################
        var mappingBodyField = {};
            // ################################################################################################
            // ===== Mapping Primary Information Group
            // ################################################################################################
            mappingBodyField['order_select'] = 'tranid';
            mappingBodyField['ref_pi_id_select'] = 'custbody_exp_originalprofoma';
            mappingBodyField['split_no_select'] = 'custbody_exp_splitnumber';

            // ################################################################################################
            // ===== Mapping Address Tap
            // ################################################################################################
            mappingBodyField['ship_select'] = 'shipaddresslist';
            mappingBodyField['bill_select'] = 'billaddresslist';

            // ################################################################################################
            // ===== Mapping EXP Sales Export Tap
            // ################################################################################################
            mappingBodyField['terms_payment_select'] = 'custbody_exp_termsofpay';
            mappingBodyField['incoterms_select'] = 'custbody_exp_incoterms';
            mappingBodyField['country_of_origin_select'] = 'custbody_exp_countryorigin';
            mappingBodyField['loading_type_select'] = 'custbody_exp_loadingtype';
            mappingBodyField['packing_select'] = 'custbody_exp_packing';
            mappingBodyField['tolerance_select'] = 'custbody_exp_tolerance';
            mappingBodyField['shipping_mark_select'] = 'custbody_exp_shippingmarks';
            mappingBodyField['etd_date_select'] = 'custbody_exp_etddate';
            mappingBodyField['etd_date_text_select'] = 'custbody_exp_etdtext';
            mappingBodyField['eta_date_select'] = 'custbody_exp_etadate';
            mappingBodyField['containers_type_select'] = 'custbody_exp_containerstype';
            mappingBodyField['containers_size_select'] = 'custbody_exp_containersize';
            mappingBodyField['no_of_containers_select'] = 'custbody_exp_containerqty';
            mappingBodyField['insurance_select'] = 'custbody_exp_insurance';
            mappingBodyField['net_weight_select'] = 'custbody_exp_netweigh';
            mappingBodyField['gross_weight_select'] = 'custbody_exp_grossweight';
            mappingBodyField['cbm_select'] = 'custbody_exp_cbm';

        var mappingSubListField = {};
        // ################################################################################################
        // ===== Mapping Item List
        // ################################################################################################
        var subListId = 'item_list';
            mappingSubListField[subListId] = {};
            mappingSubListField[subListId]['id'] = 'item';
            mappingSubListField[subListId]['columns'] = {};
            mappingSubListField[subListId]['columns']['ref_pi'] = 'custcol_exp_originalprofoma';
            mappingSubListField[subListId]['columns']['item_id'] = 'item';
            mappingSubListField[subListId]['columns']['item_description'] = 'description';
            mappingSubListField[subListId]['columns']['item_rate'] = 'rate';
            mappingSubListField[subListId]['columns']['item_selected'] = 'quantity';

        // ################################################################################################
        // ===== Mapping EXP Containers Details List
        // ################################################################################################
        var subListId = 'containers_details_list';
            mappingSubListField[subListId] = {};
            mappingSubListField[subListId]['id'] = 'recmachcustrecord_exp_transrefcon';
            mappingSubListField[subListId]['columns'] = {};
            mappingSubListField[subListId]['columns']['containers_type_select'] = 'custrecord_exp_containerstype';
            mappingSubListField[subListId]['columns']['containers_size_select'] = 'custrecord_exp_containerssize';
            mappingSubListField[subListId]['columns']['no_of_containers_select'] = 'custrecord_exp_qtycontainers';
            mappingSubListField[subListId]['columns']['containers_description_select'] = 'custrecord_exp_containersdescription';

        // ################################################################################################
        // ===== Generate Proforma Invoice
        // ################################################################################################
        var pi_rec = record.copy({
					    type: 'salesorder',
					    id: PARAMS['ref_pi_id_select'],
					    isDynamic: true
					});

        // ################################################################################################
        // ===== Update Body Field
        // ################################################################################################
        for (var key in PARAMS) {
            if (!!mappingBodyField[key]) {
                var value = PARAMS[key];
                if (!!value && key.indexOf('date') != -1) {
                    value = format.parse(value, 'date');
                }
                else if (key.indexOf('tolerance') != -1) {
                    value = value.replace('%', '');
                }

                pi_rec.setValue(mappingBodyField[key], value);

                if (key.indexOf('ship_select') != -1 && !value) {
                    pi_rec.setValue('shipaddress', PARAMS['ship_to_address_select']);
                }

                if (key.indexOf('bill_select') != -1 && !value) {
                    pi_rec.setValue('billaddress', PARAMS['bill_to_address_select']);
                }
            }
        }

        // ################################################################################################
        // ===== Update SubList Field
        // ################################################################################################
        SUBLIST_FIELD_FORMAT = JSON.parse(PARAMS['sublist_field_format']);
        log.debug('SUBLIST_FIELD_FORMAT', SUBLIST_FIELD_FORMAT);
        for (var subListId in SUBLIST_FIELD_FORMAT) {
            if (!!mappingSubListField[subListId]) {
                var line_id_use = [];
                var nsSubListId = mappingSubListField[subListId]['id'];
                if (nsSubListId == 'item') {
                    var line_count = REQUEST.getLineCount(subListId);
                    for (var line = 0; line < line_count; line++) {
                        var line_id = REQUEST.getSublistValue(subListId, 'line_id', line);
                        var line_no = pi_rec.findSublistLineWithValue({ sublistId: nsSubListId, fieldId: 'line', value: line_id.toString() });
                        line_id_use.push(Number(line_id));
                        pi_rec.selectLine(nsSubListId, line_no);
                        for (var n in SUBLIST_FIELD_FORMAT[subListId]) {
                            var column = SUBLIST_FIELD_FORMAT[subListId][n];
                            var id = column['id'];
                            if (!!mappingSubListField[subListId]['columns'][id]) {
                                var value = REQUEST.getSublistValue(subListId, id, line);
                                pi_rec.setCurrentSublistValue(nsSubListId, mappingSubListField[subListId]['columns'][id], value);
                            }
                        }
                        pi_rec.setCurrentSublistValue(nsSubListId, 'custcol_exp_splitquantity', '');
                        pi_rec.commitLine(nsSubListId);
                    }

                    var line_count = pi_rec.getLineCount(nsSubListId);
                    for (var line = line_count-1; line >= 0; line--) {
                        var line_id = Number(pi_rec.getSublistValue(nsSubListId, 'line', line));
                        if (line_id_use.indexOf(line_id) == -1) {
                            pi_rec.removeLine(nsSubListId, line);
                        }
                    }
                }
                else {
                    var line_count = REQUEST.getLineCount(subListId);
                    for (var line = 0; line < line_count; line++) {
                        pi_rec.selectNewLine(nsSubListId);
                        for (var n in SUBLIST_FIELD_FORMAT[subListId]) {
                            var column = SUBLIST_FIELD_FORMAT[subListId][n];
                            var id = column['id'];
                            if (!!mappingSubListField[subListId]['columns'][id]) {
                                var value = REQUEST.getSublistValue(subListId, id, line);
                                pi_rec.setCurrentSublistValue(nsSubListId, mappingSubListField[subListId]['columns'][id], value);
                            }
                        }
                        pi_rec.commitLine(nsSubListId);
                    }
                }
            }
        }

        // ################################################################################################
        // ===== Fix Value
        // ################################################################################################
        pi_rec.setValue('custbody_thl_donotautogenrunningno', true);
        pi_rec.setValue('custbody_exp_splitorder', false);
        pi_rec.setValue('custbody_exp_proformainvoicsplit', true);

        // ################################################################################################
        // ===== Save Record
        // ################################################################################################
        var pi_id = pi_rec.save();


        // ################################################################################################
        // ===== Update Ref Record
        // ################################################################################################
        var line_update = {};
        var line_count = Number(pi_rec.getLineCount('item'));
        for (var i = 0; i < line_count; i++) {
            var line_id = pi_rec.getSublistValue('item', 'line', i);
            if (!line_update[line_id]) {
                line_update[line_id] = {};
                line_update[line_id]['item'] = pi_rec.getSublistValue('item', 'item', i);
                line_update[line_id]['qty'] = Number(pi_rec.getSublistValue('item', 'quantity', i));
            }
        }

        if (Object.keys(line_update).length > 0) {
            var pi_ref_rec = record.load({ type: 'salesorder', id: PARAMS['ref_pi_id_select'] });
            for (var line_id in line_update) {
                var line_no = pi_ref_rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'line', value: line_id.toString() });
                var exp_split_qty = Number(pi_ref_rec.getSublistValue('item', 'custcol_exp_splitquantity', line_no));
                var update_split_qty = Number(exp_split_qty) + Number(line_update[line_id]['qty']);
                    update_split_qty = Number(update_split_qty.toFixed(2));
                pi_ref_rec.setSublistValue('item', 'custcol_exp_splitquantity', line_no, update_split_qty);
            }

            var is_closed = true;
            var line_count = Number(pi_ref_rec.getLineCount('item'));
            for (var i = 0; i < line_count; i++) {
                var item_qty = Number(pi_ref_rec.getSublistValue('item', 'quantity', i));
                var split_qty = Number(pi_ref_rec.getSublistValue('item', 'custcol_exp_splitquantity', i));
                if (item_qty != split_qty) {
                    is_closed = false;
                }
            }

            if (is_closed == true) {
                for (var i = 0; i < line_count; i++) {
                    pi_ref_rec.setSublistValue('item', 'isclosed', i, true);
                }
            }

            pi_ref_rec.setValue('custbody_exp_splitorder' , true);
            pi_ref_rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
        }

        // ################################################################################################
        // ===== Update Job Record
        // ################################################################################################
        var data = {};
            data['custrecord_spj_processcompleted'] = true;
        record.submitFields({ type: 'customrecord_exp_splitpi_jobprocess', id: job_record_id, values: data });

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'salesorder', id: pi_id });

    }
    else if (PARAMS['step'] == 'CancelProformaInvoice') {

        formName = 'Cancel Proforma Invoice';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('In Progress | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'teble_data', type: 'inlinehtml', label: 'TABLE_DATA' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'sublist_field_format', type: 'longtext', label: 'SUBLIST_FIELD_FORMAT' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_next', type: 'checkbox', label: 'Is Next' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'longtext', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' });


        // ################################################################################################
        // ===== Get Sales Order Information
        // ################################################################################################
        var ssResult = getSalesOrderInformation(PARAMS['rec_id']);

        // ################################################################################################
        // ===== Get Customer Address Information
        // ################################################################################################
        var customerAddress = getCustomerAddressObject(ssResult[0].getValue('entity'));
        var CUSTOMER_ADDRESS = customerAddress['CUSTOMER_ADDRESS'];
        var CUSTOMER_ADDRESS_MAP = customerAddress['CUSTOMER_ADDRESS_MAP'];
        var ADDRESS_MAP = customerAddress['ADDRESS_MAP'];

        // ################################################################################################
        // ===== Get Ref PI ID
        // ################################################################################################
        var ref_pi_id_select = null;
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'is', values: ssResult[0].getValue('custbody_exp_originalprofoma') }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var columnSearch = [];
            columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        var ssResultRef = getSearch('salesorder', null, columnSearch, filterSearch);
        if (ssResultRef.length > 0) {
            ref_pi_id_select = ssResultRef[0].getValue({ name: 'internalid', summary: null });
        }

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var uiField = form.addField({ id: 'order_id_select', type: 'text', label: 'ORDER ID #', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'hidden' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var uiField = form.addField({ id: 'order_select', type: 'text', label: 'PI No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('tranid');

        if (USE_SUB == true) {
            var uiField = form.addField({ id: 'subsidiary_select', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = ssResult[0].getValue('subsidiary');
        }

        var uiField = form.addField({ id: 'date_select', type: 'date', label: 'Date', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('trandate');

        var uiField = form.addField({ id: 'ref_pi_select', type: 'select', label: 'Ref Original PI No.', source: 'salesorder', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_originalprofoma');

        var uiField = form.addField({ id: 'split_no_select', type: 'integer', label: 'Split No.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_splitnumber');

        var uiField = form.addField({ id: 'ref_pi_id_select', type: 'text', label: 'Ref Original PI Id.', source: null, container: 'primary_information' }).updateDisplayType({ displayType : 'hidden' });
            uiField.defaultValue = ref_pi_id_select;

        var uiField = form.addField({ id: 'customer_select', type: 'select', label: 'Customer', source: 'customer', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('entity');

        var uiField = form.addField({ id: 'currency_select', type: 'select', label: 'Currency', source: 'currency', container: 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('currency');

        // ################################################################################################
        // ===== Items Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_items_tab', label: 'Items' });
        var subListId = 'item_list';
        var field_format = [];
        var sublist = form.addSublist({ id: subListId, type: 'list', label: 'Items', tab: 'custpage_items_tab'  });
        var field = { id: 'ref_pi', label: 'Ref. PI', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'line_id', label: 'Item Line Id', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_id', label: 'Item Id', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_text', label: 'Item', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_code', label: 'Item Code', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'item_description', label: 'Item Description', type: 'textarea', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_qty', label: 'Quantity', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_unit', label: 'Unit', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'item_rate', label: 'Unit Price', type: 'float', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });

        SUBLIST_FIELD_FORMAT[subListId] = JSON.parse(JSON.stringify(field_format));
        log.debug('field_format', field_format);

        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var line_id = ssResult[i].getValue({ name: 'line', join: null, summary: null });
            var key = rec_id + '_' +line_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                REC_DATA[key]['ref_pi'] = ssResult[i].getValue({ name: 'tranid', join: null, summary: null });
                REC_DATA[key]['line_id'] = ssResult[i].getValue({ name: 'line', join: null, summary: null });
                REC_DATA[key]['item_id'] = ssResult[i].getValue({ name: 'item', join: null, summary: null });
                REC_DATA[key]['item_code'] = ssResult[i].getValue({ name: 'itemid', join: 'item', summary: null });
                REC_DATA[key]['item_name'] = ssResult[i].getValue({ name: 'displayname', join: 'item', summary: null });
                REC_DATA[key]['item_text'] = REC_DATA[key]['item_code'] + ' ' + REC_DATA[key]['item_name'];
                REC_DATA[key]['item_description'] = ssResult[i].getValue({ name: 'memo', join: null, summary: null });
                REC_DATA[key]['item_qty'] = Number(ssResult[i].getValue({ name: 'quantityuom', join: null, summary: null }));
                REC_DATA[key]['item_unit'] = ssResult[i].getValue({ name: 'unit', join: null, summary: null });
                REC_DATA[key]['item_rate'] = Number((ssResult[i].getValue({ name: 'fxamount', join: null, summary: null }) / REC_DATA[key]['item_qty']).toFixed(2));
                REC_DATA[key]['item_split_qty'] = Number(ssResult[i].getValue({ name: 'custcol_exp_splitquantity', join: null, summary: null }));
                REC_DATA[key]['item_avalable'] = REC_DATA[key]['item_qty'] - REC_DATA[key]['item_split_qty'];
                recDataArr.push(REC_DATA[key]);
            }
        }

        log.debug('REC_DATA 1', REC_DATA);

        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;

        var tab = {};
            tab['name'] = formName;
            tab['data'] = [];

        for (var key in recDataArr) {
            var data = {};
                data = JSON.parse(JSON.stringify(recDataArr[key]));

            tab['data'].push(data);
        }

        TABLE_DATA['tab'].push(tab);
        log.debug(tab['name'], TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]);
        TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['columns_format'] = field_format;

        var ignoreValue = ['entry'];
        var line = 0;
        for (var index in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data']) {
            for (var column in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index]) {
                var type = 'text';
                var value = TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index][column];
                for (var n in field_format) {
                    if (field_format[n]['id'] == column) {
                        type = field_format[n]['type'];
                        continue;
                    }
                }
                if (ignoreValue.indexOf(value) == -1) {
                    if (type == 'text' || type == 'select') {
                        value = nvlNull(value);
                    }
                    else if (type == 'float') {
                        value = Number(value).toFixed(2);
                    }
                    else {
                        value = nvlNull(value);
                    }

                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        // ################################################################################################
        // ===== Address Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_address_tab', label: 'Address' });
        var uiField = form.addField({ id: 'ship_select', type: 'select', label: 'Ship To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
            uiField.defaultValue = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'shippingaddress' })];
        var uiField = form.addField({ id: 'ship_to_address_select', type: 'textarea', label: 'Ship To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'shipaddress', join: null });

        var uiField = form.addField({ id: 'bill_select', type: 'select', label: 'Bill To Select', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }
            uiField.defaultValue = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'billingaddress' })];
        var uiField = form.addField({ id: 'bill_to_address_select', type: 'textarea', label: 'Bill To Address', source: null, container: 'custpage_address_tab' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'billaddress', join: null });

        // ################################################################################################
        // ===== EXP Sales Export Tab
        // ################################################################################################
        form.addTab({ id: 'custpage_exp_sales_export_tab', label: 'EXP Sales Export' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - Sales Export Information
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'sales_export_information', label: 'Sales Export Information', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'terms_payment_select', type: 'select', label: 'Terms of Payment', source: 'customlist_exp_termsofpay', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_termsofpay');
        var uiField = form.addField({ id: 'incoterms_select', type: 'select', label: 'Incoterms', source: 'incoterm', container: 'sales_export_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_incoterms');

        // ################################################################################################
        // ===== EXP Sales Export Tab - Shipping
        // ################################################################################################
        var fieldGroup = form.addFieldGroup({ id: 'shipping_information', label: 'Shipping', tab: 'custpage_exp_sales_export_tab' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;
        var uiField = form.addField({ id: 'country_of_origin_select', type: 'select', label: 'Country of Origin', source: 'customlist_exp_countryorigin', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_countryorigin');
        var uiField = form.addField({ id: 'loading_type_select', type: 'select', label: 'Loading Type', source: 'customlist_exp_loadingtype', container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_countryorigin');
        var uiField = form.addField({ id: 'packing_select', type: 'text', label: 'Packing', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_packing');
        var uiField = form.addField({ id: 'tolerance_select', type: 'percent', label: 'Tolerance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_tolerance');
        var uiField = form.addField({ id: 'shipping_mark_select', type: 'textarea', label: 'Shipping Mark', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_shippingmarks');
        var uiField = form.addField({ id: 'etd_date_select', type: 'date', label: 'ETD Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etddate');
        var uiField = form.addField({ id: 'etd_date_text_select', type: 'text', label: 'ETD Date (Text)', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etdtext');
        var uiField = form.addField({ id: 'eta_date_select', type: 'date', label: 'ETA Date', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etadate');
        // var uiField = form.addField({ id: 'containers_type_select', type: 'select', label: 'Containers Type', source: 'customlist_exp_containerstype', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
        //     uiField.defaultValue = ssResult[0].getValue('custbody_exp_containerstype');
        // var uiField = form.addField({ id: 'containers_size_select', type: 'select', label: 'Containers Size', source: 'customlist_exp_containerssize', container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
        //     uiField.defaultValue = ssResult[0].getValue('custbody_exp_containersize');
        // var uiField = form.addField({ id: 'no_of_containers_select', type: 'text', label: 'No. of Containers', source: null, container: 'shipping_information' });
        //     uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_containerqty');
        var uiField = form.addField({ id: 'insurance_select', type: 'text', label: 'Insurance', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_insurance');
        var uiField = form.addField({ id: 'net_weight_select', type: 'text', label: 'Net Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_netweigh');
        var uiField = form.addField({ id: 'gross_weight_select', type: 'text', label: 'Gross Weight', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_grossweight');
        var uiField = form.addField({ id: 'cbm_select', type: 'text', label: 'CBM.', source: null, container: 'shipping_information' });
            uiField.updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_cbm');

        // ################################################################################################
        // ===== EXP Sales Export Tab - EXP Containers Details
        // ################################################################################################
        var field_format = [];
        var subListId = 'containers_details_list';
        var sublist = form.addSublist({ id: subListId, type: 'list', label: 'EXP Containers Details', tab: 'custpage_exp_sales_export_tab'  });
        var field = { id: 'containers_id_select', label: 'EXP Containers ID', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'transrefcon_id_select', label: 'Transaction', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' });
        var field = { id: 'containers_type_select', label: 'EXP Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'containers_size_select', label: 'EXP Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'no_of_containers_select', label: 'EXP NO. of Containers', type: 'integer', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });
        var field = { id: 'containers_descriptions_select', label: 'EXP Containers Description', type: 'text', source: null }; field_format.push(field);
            sublist.addField(field).updateDisplayType({ displayType: 'inline' });

        var ssResult = getContainersInformation(PARAMS['rec_id']);
        var line_data = {};
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var key = rec_id;
            if (!line_data[key]) {
                line_data[key] = {};
                line_data[key]['containers_id_select'] = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
                line_data[key]['transrefcon_id_select'] = ssResult[i].getValue({ name: 'custrecord_exp_transrefcon', join: null, summary: null });
                line_data[key]['containers_type_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containerstype', join: null, summary: null });
                line_data[key]['containers_size_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containerssize', join: null, summary: null });
                line_data[key]['no_of_containers_select'] = ssResult[i].getValue({ name: 'custrecord_exp_qtycontainers', join: null, summary: null });
                line_data[key]['containers_description_select'] = ssResult[i].getValue({ name: 'custrecord_exp_containersdescription', join: null, summary: null });
                recDataArr.push(line_data[key]);
            }
        }

        log.debug('line_data', line_data);

        var tab = {};
            tab['name'] = formName;
            tab['data'] = [];

        for (var key in recDataArr) {
            var data = {};
                data = JSON.parse(JSON.stringify(recDataArr[key]));

            tab['data'].push(data);
        }

        TABLE_DATA['tab'].push(tab);
        log.debug(tab['name'], TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]);
        TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['columns_format'] = field_format;

        var ignoreValue = ['entry'];
        var line = 0;
        var line_count = REQUEST.getLineCount(subListId);
        if (line_count > 0) {
            for (var i = 0; i < line_count; i++) {
                for (var n in field_format) {
                    var column = field_format[n]['id'];
                    var value = REQUEST.getSublistValue(subListId, column, i);
                    sublist.setSublistValue({id: column, line: line, value: value});
                }
                line++;
            }
        }
        else {
            for (var index in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data']) {
                for (var column in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index]) {
                    var type = 'text';
                    var value = TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index][column];
                    for (var n in field_format) {
                        if (field_format[n]['id'] == column) {
                            type = field_format[n]['type'];
                            continue;
                        }
                    }
                    if (ignoreValue.indexOf(value) == -1) {
                        if (type == 'text' || type == 'select') {
                            value = nvlNull(value);
                        }
                        else if (type == 'float') {
                            value = Number(value).toFixed(2);
                        }
                        else {
                            value = nvlNull(value);
                        }

                        sublist.setSublistValue({ id: column, line: line, value: value });
                    }
                }
                line++;
            }
        }

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        form.updateDefaultValues({
            step: 'InProgressCancelProformaInvoice',
            teble_data: JSON.stringify(TABLE_DATA),
            params: JSON.stringify(PARAMS),
            sublist_field_format: JSON.stringify(SUBLIST_FIELD_FORMAT)
        });

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Submit' });

        var scriptURL = url.resolveRecord({
                        recordType: 'salesorder',
                        recordId: PARAMS['rec_id']
                    });
        var script_function = "page_init;";
            script_function += "function bt_cancel(){ window.location = '" + scriptURL + "'; }";
            script_function += "bt_cancel;";
        form.addButton({ id: 'bt_cancel', label: 'Back', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'InProgressCancelProformaInvoice') {
        // ################################################################################################
        // ===== Load Proforma Invoice
        // ################################################################################################
        var pi_rec = record.load({
					    type: 'salesorder',
					    id: PARAMS['order_id_select'],
					    isDynamic: false
					});

        // ################################################################################################
        // ===== Update Body Field
        // ################################################################################################
        pi_rec.setValue('custbody_exp_proformainvoicsplit', false);

        // ################################################################################################
        // ===== Update Close Line
        // ################################################################################################
        var line_count = Number(pi_rec.getLineCount('item'));
        for (var i = 0; i < line_count; i++) {
            pi_rec.setSublistValue('item', 'isclosed', i, true);
        }

        // ################################################################################################
        // ===== Save Record
        // ################################################################################################
        var pi_id = pi_rec.save({ enableSourcing: false, ignoreMandatoryFields: true });


        // ################################################################################################
        // ===== Update Ref Record
        // ################################################################################################
        var have_spilt = false;
        var line_update = {};
        var line_count = Number(pi_rec.getLineCount('item'));
        for (var i = 0; i < line_count; i++) {
            var line_id = pi_rec.getSublistValue('item', 'line', i);
            if (!line_update[line_id]) {
                line_update[line_id] = {};
                line_update[line_id]['item'] = pi_rec.getSublistValue('item', 'item', i);
                line_update[line_id]['qty'] = Number(pi_rec.getSublistValue('item', 'quantity', i));
            }
        }

        if (Object.keys(line_update).length > 0) {
            var pi_ref_rec = record.load({ type: 'salesorder', id: PARAMS['ref_pi_id_select'] });
            for (var line_id in line_update) {
                var line_no = pi_ref_rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'line', value: line_id.toString() });
                var exp_split_qty = Number(pi_ref_rec.getSublistValue('item', 'custcol_exp_splitquantity', line_no));
                var update_split_qty = Number(exp_split_qty) - Number(line_update[line_id]['qty']);
                    update_split_qty = Number(update_split_qty.toFixed(2));
                pi_ref_rec.setSublistValue('item', 'custcol_exp_splitquantity', line_no, update_split_qty);
            }

            for (var i = 0; i < line_count; i++) {
                pi_ref_rec.setSublistValue('item', 'isclosed', i, false);
            }

            for (var i = 0; i < line_count; i++) {
                var exp_split_qty = Number(pi_ref_rec.getSublistValue('item', 'custcol_exp_splitquantity', line_no));
                if (exp_split_qty > 0) {
                    have_spilt = true;
                }
            }

            if (have_spilt == false) {
                pi_ref_rec.setValue('custbody_exp_splitorder' , false);
            }

            pi_ref_rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
        }

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'salesorder', id: pi_id });

    }
}
// ################################################################################################
// ===== Library Function
// ################################################################################################
Date.shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function getBackPageFunction(recId) {
    var scriptURL = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
        scriptURL += '&step=SplitProformaInvoice';
        scriptURL += '&rec_id=' + recId;
    var script_function = "page_init;";
        // script_function += "function bt_back(){ history.back(); }";
        script_function += "function bt_back(){ CURRENT_RECORD.setValue('step', 'SplitProformaInvoice'); NLDoMainFormButtonAction('submitter', true); }";
        script_function += "bt_back;";
    return script_function;
}

function getStartPageFunction(recId) {
    var scriptURL = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
        scriptURL += '&step=SplitProformaInvoice';
        scriptURL += '&rec_id=' + recId;
    var script_function = "page_init;";
        script_function += "function bt_back(){ window.location = '" + scriptURL + "'; }";
        script_function += "bt_back;";
    return script_function;
}

function getReturnRecordFunction(recId) {
    var scriptURL = url.resolveRecord({
                    recordType: 'salesorder',
                    recordId: recId
                });
    var script_function = "page_init;";
        script_function += "function bt_cancel(){ window.location = '" + scriptURL + "'; }";
        script_function += "bt_cancel;";
    return script_function;
}

function checkInProgressData(pi_doc) {
    var inProgress = false;
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'custrecord_spj_splitdoc', join: null, operator: 'is', values: pi_doc }) );
        filterSearch.push( search.createFilter({ name: 'isinactive', join: null, operator: 'is', values: 'F' }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
    var ssResultCheck = getSearch('customrecord_exp_splitpi_jobprocess', null, columnSearch, filterSearch);
    if (ssResultCheck.length > 0) {
        inProgress = true;
    }
    return inProgress;
}

function getSalesOrderInformation(recId) {
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: recId }) );
        filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'F' }) );
        filterSearch.push( search.createFilter({ name: 'taxline', join: null, operator: 'is', values: 'F' }) );
        filterSearch.push( search.createFilter({ name: 'cogs', join: null, operator: 'is', values: 'F' }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'tranid', summary: null }));
    if (USE_SUB == true) {
        columnSearch.push(search.createColumn({ name: 'subsidiary', summary: null }));
    }
        columnSearch.push(search.createColumn({ name: 'trandate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'entity', summary: null }));
        columnSearch.push(search.createColumn({ name: 'currency', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_originalprofoma', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_splitnumber', summary: null }));

        // ################################################################################################
        // ===== Get Items Tab
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'line', summary: null }));
        columnSearch.push(search.createColumn({ name: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'itemid', join: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'displayname', join: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'memo', summary: null }));
        columnSearch.push(search.createColumn({ name: 'quantity', summary: null }));
        columnSearch.push(search.createColumn({ name: 'unit', summary: null }));
        columnSearch.push(search.createColumn({ name: 'rate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custcol_exp_splitquantity', summary: null }));
        columnSearch.push(search.createColumn({ name: 'quantityuom', summary: null }));
        columnSearch.push(search.createColumn({ name: 'fxamount', summary: null }));

        // ################################################################################################
        // ===== Get Address Tab
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'billingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'shipaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'billaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_shipmasteraddress', join: 'shippingaddress', summary: null }));

        // ################################################################################################
        // ===== Get EXP Sales Export Tab - Sales Export Information
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'custbody_exp_termsofpay', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_incoterms', summary: null }));

        // ################################################################################################
        // ===== Get EXP Sales Export Tab - Shipping
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'custbody_exp_countryorigin', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_loadingtype', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_packing', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_insurance', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_etddate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_etdtext', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_etadate', summary: null }));
        // columnSearch.push(search.createColumn({ name: 'custbody_exp_containerstype', summary: null }));
        // columnSearch.push(search.createColumn({ name: 'custbody_exp_containersize', summary: null }));
        // columnSearch.push(search.createColumn({ name: 'custbody_exp_containerqty', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_insurance', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_netweigh', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_grossweight', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_cbm', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_shippingmarks', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_tolerance', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_shippingmaster', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_shipping_port', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_destination_country', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_port', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custbody_exp_intransit_to', summary: null }));


    return getSearch('salesorder', null, columnSearch, filterSearch);
}

function getContainersInformation(recId) {
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'custrecord_exp_transrefcon', join: null, operator: 'anyof', values: recId }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_transrefcon', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_containerstype', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_containerssize', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_qtycontainers', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_containersdescription', summary: null }));
    return getSearch('customrecord_exp_containersdetails', null, columnSearch, filterSearch);
}

function getShippingMasterObject(recId) {
    var shipping_master_data = {};
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: recId }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exps_shipport', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exps_destinationcountry', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exps_port', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exps_intransitto', summary: null }));
    var ssResultShippingMaster = getSearch('customrecord_exp_shippingmaster', null, columnSearch, filterSearch);
    for (var i = 0; !!ssResultShippingMaster && i < ssResultShippingMaster.length; i++) {
        var internalid = ssResultShippingMaster[i].getValue('internalid');
        var key = internalid;
        shipping_master_data[key] = {};
        shipping_master_data[key]['custrecord_exps_shipport'] = ssResultShippingMaster[i].getText('custrecord_exps_shipport');
        shipping_master_data[key]['custrecord_exps_destinationcountry'] = ssResultShippingMaster[i].getValue('custrecord_exps_destinationcountry');
        shipping_master_data[key]['custrecord_exps_port'] = ssResultShippingMaster[i].getValue('custrecord_exps_port');
        shipping_master_data[key]['custrecord_exps_intransitto'] = ssResultShippingMaster[i].getValue('custrecord_exps_intransitto');
    }
    return shipping_master_data;
}

function getCustomerAddressObject(cus_id) {

    var cus_rec = record.load({ type: 'customer' , id: cus_id });
    var customerAddress = {};
        customerAddress['CUSTOMER_ADDRESS'] = [];
        customerAddress['CUSTOMER_ADDRESS_MAP'] = {};
        customerAddress['ADDRESS_MAP'] = {};

    var line_count = Number(cus_rec.getLineCount('addressbook'));
    var shipping_master_data = {};
    var shipping_master_list = [];
    for (var i = 0; i < line_count; i++) {
        var addressSubrecord = cus_rec.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: i
        });
        var custrecord_exp_shipmasteraddress = addressSubrecord.getValue({
            fieldId: 'custrecord_exp_shipmasteraddress'
        })
        if (shipping_master_list.indexOf(custrecord_exp_shipmasteraddress) == -1) {
            shipping_master_list.push(custrecord_exp_shipmasteraddress);
        }
    }

    var shipping_master_data = getShippingMasterObject(shipping_master_list);

    var line_count = Number(cus_rec.getLineCount('addressbook'));
    for (var i = 0; i < line_count; i++) {
        var data = {};
            data['defaultshipping'] = cus_rec.getSublistValue('addressbook', 'defaultshipping', i);
            data['defaultbilling'] = cus_rec.getSublistValue('addressbook', 'defaultbilling', i);
            data['addressbookaddress'] = cus_rec.getSublistValue('addressbook', 'addressbookaddress', i);
            data['addressbookaddress_text'] = cus_rec.getSublistValue('addressbook', 'addressbookaddress_text', i);
            data['id'] = cus_rec.getSublistValue('addressbook', 'id', i);
            data['label'] = cus_rec.getSublistValue('addressbook', 'label', i);

        var addressSubrecord = cus_rec.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: i
        });
        var custrecord_exp_shipmasteraddress = addressSubrecord.getValue({
            fieldId: 'custrecord_exp_shipmasteraddress'
        })

            data['custrecord_exp_shipmasteraddress'] = custrecord_exp_shipmasteraddress;

        for (var key in shipping_master_data[custrecord_exp_shipmasteraddress]) {
            data[key] = shipping_master_data[custrecord_exp_shipmasteraddress][key];
        }

        customerAddress['CUSTOMER_ADDRESS'].push(data);
        customerAddress['CUSTOMER_ADDRESS_MAP'][data['id']] = data;
        customerAddress['ADDRESS_MAP'][data['addressbookaddress']] = data['id'].toString();
    }
    return customerAddress;
}

function addMinutes(dt, minutes, seconds) {
    if (!seconds) seconds = 0
    dt = new Date(dt.getTime() + (minutes*60000));
    dt = new Date(dt.getTime() + (seconds*1000));
    return dt;
}

function showLoading(percent) {
    if (!percent) percent = '';
    var loadingHTML = '';
        loadingHTML += '<div id="loadingScreen" style="position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(127, 140, 141, 0.75); z-index: 1001; cursor:wait; display:none;">';// display:none
        loadingHTML += ' <table border="0" width="100%" height="100%"><tr><td align="center" valign="middle">';
        loadingHTML += ' <table border="0" width="200px" height="100px" style="border-radius: 5px; background-color: rgba(10,10,10, 0.8); color: rgba(149, 165, 166, 1.0);">';
        loadingHTML += ' <tr><td align=center valign="middle" style="padding:0px 20px;font-weight: bold; font-size:13pt;">';
        loadingHTML += '  <br>In Progress ... '+percent+'<br><img width="220" height="25" src="' + getImageLoading() + '"/>';
        loadingHTML += ' </td>';
        loadingHTML += ' </tr>';
        loadingHTML += ' </table>';
        loadingHTML += ' </td></tr></table>';
        loadingHTML += '</div>';
    return loadingHTML;
}

function showLoadingRefresh(percent, LOG_ID) {

    var slUrl = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
        slUrl += '&step=inProcess';
        slUrl += '&LOG_ID='+LOG_ID;

    if (!percent) percent = '';
    var loadingHTML = '';
        loadingHTML += '<head><META HTTP-EQUIV="Refresh" CONTENT="7;URL='+slUrl+'"></head><div id="loadingScreen" style="position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(127, 140, 141, 0.75); z-index: 1001; cursor:wait;">';// display:none
        loadingHTML += ' <table border="0" width="100%" height="100%"><tr><td align="center" valign="middle">';
        loadingHTML += ' <table border="0" width="200px" height="100px" style="border-radius: 5px; background-color: rgba(10,10,10, 0.8); color: rgba(149, 165, 166, 1.0);">';
        loadingHTML += ' <tr><td align=center valign="middle" style="padding:0px 20px;font-weight: bold; font-size:13pt;">';
        loadingHTML += '  <br>In Progress ... '+percent+'<br><img width="220" height="25" src="' + getImageLoading() + '"/>';
        loadingHTML += ' </td>';
        loadingHTML += ' </tr>';
        loadingHTML += ' </table>';
        loadingHTML += ' </td></tr></table>';
        loadingHTML += '</div>';
    return loadingHTML;
}

function getImageLoading() {
    return 'data:image/gif;base64,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';
}

function nvl(input, output) {
    if (input === 0) return Number(input).toFixed(2);
    if (!!input && !isNaN(input)) return Number(input).toFixed(2);
    if (!!input || input === 0) return input;
    if (!!output || output === 0) return output;
    return null;
}

function nvl8(input, output) {
    if (!!input && !isNaN(input)) return Number(input).toFixed(8);
    if (!!input || input === 0) return input;
    if (!!output || output === 0) return output;
    return null;
}

function nvlNull(input, output) {
    if (!!input || input === 0) return input.toString();
    if (!!output || output === 0) return output;
    return null;
}

function getDateTimeNow() {
    var offset = 7; //Thailand = '+7'
    var d = new Date();
    // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60 * 1000);
    // create new Date object for different city
    var nd = new Date(utc + (offset * 60 * 60 * 1000));
    return nd;
}
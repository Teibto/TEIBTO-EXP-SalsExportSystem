/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType Suitelet
 *
 * @summary     Combine Proforma Invoice to Commercial Invoice
 * @author      Rakop M. [2024/08/21] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CS_SCRIPT_PATH = './EXP SL Combine Proforma Invoice CS.js';
var SL_SCRIPT_ID = 'customscript_exp_sl_combine_pro_inv';
var MR_SCRIPT_ID = null;
var TABLE_DATA = {};
var REC_DATA = {};
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
    formName = 'Combine Commercial Invoice from Proforma Invoice';
    var form = ui.createForm(formName);

    if (!PARAMS['step']) {

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'previous_step', type: 'text', label: 'Previous Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'inlinehtml', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Primary Information Filter Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information Filter' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary',  container: fieldGroupFormat.id };
                uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
                uiField.isMandatory = true;
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';
        }

        var fieldFormat = { id: 'custpage_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', type: 'select', label: 'Destination Port', source: 'customlist_exp_destinationcountry', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_from_trandate', type: 'date', label: 'Date from', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_to_trandate', type: 'date', label: 'Date to', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_location', type: 'select', label: 'Location', source: 'location', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_portload', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        form.updateDefaultValues({
            step: 'InProgress',
            previous_step : PARAMS['step'],
            params: JSON.stringify(PARAMS),
        });

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Search' });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'InProgress') {

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'previous_step', type: 'text', label: 'Previous Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'inlinehtml', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Mapping Filter
        // ################################################################################################
        var mappingFilter = {};
        if (USE_SUB == true) {
            mappingFilter['custpage_subsidiary'] = 'subsidiary';
        }
            mappingFilter['custpage_customer'] = 'customer';
            mappingFilter['custpage_custbody_exp_etddate'] = 'custbody_exp_etddate';
            mappingFilter['custpage_custrecord_exp_destinationcountry_shippingaddress'] = 'custrecord_exp_destinationcountry.shippingaddress';
            mappingFilter['custpage_custbody_exp_etadate'] = 'custbody_exp_etadate';
            mappingFilter['custpage_location'] = 'location';
            mappingFilter['custpage_custbody_exp_portload'] = 'custbody_exp_portload';
            mappingFilter['custpage_currency'] = 'currency';

        // ################################################################################################
        // ===== Primary Information Filter Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information Filter' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary',  container: fieldGroupFormat.id };
                uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.isMandatory = true;
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';
        }

        var fieldFormat = { id: 'custpage_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.isMandatory = true;
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', type: 'select', label: 'Destination Port', source: 'customlist_exp_destinationcountry', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_location', type: 'select', label: 'Location', source: 'location', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_portload', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Proforma Invoice Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'proforma_invoice', label: 'Proforma Invoice' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_from_date', type: 'date', label: 'Date from', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_to_date', type: 'date', label: 'Date to', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_tranid', type: 'text', label: 'Proforma Invoice No.', source: null, container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Proforma Invoice Details Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_proforma_invoice_details_tab', label: 'Proforma Invoice Details' };
        form.addTab(tabFormat);
        var subListId = 'custpage_proforma_invoice_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: 'Proforma Invoice', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
            sublist.addButton({ id: 'custpage_bt_mark_all', label: 'Mark All', functionName: 'markListAll("'+subListId+'")' });
            sublist.addButton({ id: 'custpage_bt_unmark_all', label: 'Unmark All', functionName: 'unmarkListAll("'+subListId+'")' });
            sublist.addButton({ id: 'custpage_bt_reset_filter', label: 'Reset Filter', functionName: 'resetFilter("'+subListId+'")' });
        var fieldFormat = { id: 'custpage_is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
        var fieldFormat = { id: 'custpage_internalid', label: 'Proforma Invoice ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_tranid', label: 'Proforma Invoice No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_trandate', label: 'Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_etddate', label: 'ETD Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_etadate', label: 'ETA Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_incoterms', label: 'Incoterms', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_portload', label: 'Port of Loading', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', label: 'Destination Port', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_currency', label: 'Currency', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_total', label: 'Amount', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        // ################################################################################################
        // ===== Load Proforma Invoice List
        // ################################################################################################
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
            filterSearch.push( search.createFilter({ name: 'status', join: null, operator: 'anyof', values: ['SalesOrd:D', 'SalesOrd:B'] }) ); // [Partially Fulfilled, Pending Fulfillment]
            filterSearch.push( search.createFilter({ name: 'custbody_exp_ordertype', join: null, operator: 'is', values: 2 }) ); // Proforma Invoice
            filterSearch.push( search.createFilter({ name: 'custbody_exp_splitorder', join: null, operator: 'is', values: 'F' }) );
        if (!!PARAMS['custpage_from_date']) {
            filterSearch.push( search.createFilter({ name: 'trandate', join: null, operator: 'onorafter', values: PARAMS['custpage_from_date'] }) );
        }
        if (!!PARAMS['custpage_to_date']) {
            filterSearch.push( search.createFilter({ name: 'trandate', join: null, operator: 'onorbefore', values: PARAMS['custpage_to_date'] }) );
        }
        if (!!PARAMS['custpage_tranid']) {
            filterSearch.push( search.createFilter({ name: 'tranid', join: null, operator: 'startswith', values: PARAMS['custpage_tranid'] }) );
        }
        for (var key in mappingFilter) {
            if (!!PARAMS[key]) {
               var value =  PARAMS[key];
               var operator = 'is';
               var mappingFilter_sp = mappingFilter[key].split('.');
               if (mappingFilter[key] == 'customer') {
                   mappingFilter_sp[0] = 'internalid';
                   mappingFilter_sp[1] = 'customer';
               }
               else if (!!value && mappingFilter[key] == 'custbody_exp_etddate') {
                   value = format.format(value, 'date');
                   operator = 'on'
               }
               else if (!!value && mappingFilter[key] == 'custbody_exp_etadate') {
                   value = format.format(value, 'date');
                   operator = 'on'
               }

               filterSearch.push( search.createFilter({ name: mappingFilter_sp[0], join: mappingFilter_sp[1], operator: operator, values: value }) );
            }
        }
        log.debug('filterSearch', filterSearch);

        var ssResult = getSalesOrderInformation(filterSearch);
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var key = rec_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                for (var n in columns) {
                    var key_name = columns[n].name;
                    if (!!columns[n].join) {
                        key_name += '_' + columns[n].join;
                    }
                    REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                }
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

        // ################################################################################################
        // ===== Set Proforma Invoice List
        // ################################################################################################
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
                    column = 'custpage_' + column;
                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        form.updateDefaultValues({
            step: 'Preview',
            previous_step : PARAMS['step'],
            params: JSON.stringify(PARAMS),
        });

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Next' });
        var params_filter = {};
        for (var key in mappingFilter) {
            params_filter[key] = PARAMS[key];
        }
        var script_function = getStartPageFunction(params_filter);
        form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'Preview') {

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        var mapping_body_field = {};
        var mapping_sublist_item_field = {};
        var mapping_sublist_containers_details_field = {};
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'previous_step', type: 'text', label: 'Previous Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'inlinehtml', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id_list', type: 'longtext', label: 'Rec ID List' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_containers_details_field', type: 'longtext', label: 'Mapping Sublist Containers Details Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'address_map', type: 'longtext', label: 'ADDRESS_MAP' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'customer_address_map', type: 'longtext', label: 'CUSTOMER_ADDRESS_MAP' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Primary Information Filter Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information Filter' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary',  container: fieldGroupFormat.id };
                uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.isMandatory = true;
            if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';
        }

        var fieldFormat = { id: 'custpage_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.isMandatory = true;
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_trandate', type: 'date', label: 'Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', type: 'select', label: 'Destination Port', source: 'customlist_exp_destinationcountry', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'hidden' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_location', type: 'select', label: 'Location', source: 'location', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custbody_exp_portload', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'hidden' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Get Customer Address Information
        // ################################################################################################
        var customerAddress = getCustomerAddressObject(PARAMS['custpage_customer']);
        var CUSTOMER_ADDRESS = customerAddress['CUSTOMER_ADDRESS'];
        var CUSTOMER_ADDRESS_MAP = customerAddress['CUSTOMER_ADDRESS_MAP'];
        var ADDRESS_MAP = customerAddress['ADDRESS_MAP'];

        // ################################################################################################
        // ===== Get Proforma Invoice Select
        // ################################################################################################
        var rec_id_list = [];
        var line = 0;
        var subListId = 'custpage_proforma_invoice_list';
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            var is_select = REQUEST.getSublistValue(subListId, 'custpage_is_select', i);
            var internalid = REQUEST.getSublistValue(subListId, 'custpage_internalid', i);
            if (is_select == 'T') {
                rec_id_list.push(internalid);
                line++;
            }
        }

        // ################################################################################################
        // ===== Proforma Invoice Details Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_proforma_invoice_details_tab', label: 'Proforma Invoice Details' };
        form.addTab(tabFormat);
        var subListId = 'custpage_proforma_invoice_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: ' ', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_internalid', label: 'Proforma Invoice ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_tranid', label: 'Proforma Invoice No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_trandate', label: 'Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_etddate', label: 'ETD Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_etadate', label: 'ETA Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_incoterms', label: 'Incoterms', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_portload', label: 'Port of Loading', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', label: 'Destination Port', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_currency', label: 'Currency', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_total', label: 'Amount', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        var rec_id_list = [];
        var line = 0;
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            var is_select = REQUEST.getSublistValue(subListId, 'custpage_is_select', i);
            var internalid = REQUEST.getSublistValue(subListId, 'custpage_internalid', i);
            if (is_select == 'T') {
                for (var n in field_format) {
                    var column = field_format[n]['id'];
                    var value = REQUEST.getSublistValue(subListId, column, i);
                    sublist.setSublistValue({id: column, line: line, value: value});
                }
                rec_id_list.push(internalid);
                line++;
            }
        }

        // ################################################################################################
        // ===== Summary Items Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_summary_items_tab', label: 'Summary Items' };
        form.addTab(tabFormat);
        var subListId = 'custpage_summary_items_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: ' ', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_internalid', label: 'Proforma Invoice ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_tranid', label: 'Proforma Invoice No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_trandate', label: 'Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custbody_exp_etddate', label: 'ETD Date', type: 'date', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_currency', label: 'Currency', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_internalid_item', label: 'Item Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_itemid_item', label: 'Item Code', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_displayname_item', label: 'Item Name', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_internalid_location', label: 'Location Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_quantityuom', label: 'Qty', type: 'integer', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_unitid', label: 'Unit Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_unit', label: 'Unit', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_rate', label: 'Unit Price', type: 'currency', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_internalid_taxitem', label: 'Tax Code Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_promotion', label: 'Promotion', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_discount_1', label: 'Discount 1', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_discount_2', label: 'Discount 2', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_fxamount', label: 'Amount', type: 'currency', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: rec_id_list }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'F' }) );
            filterSearch.push( search.createFilter({ name: 'taxline', join: null, operator: 'is', values: 'F' }) );
            filterSearch.push( search.createFilter({ name: 'cogs', join: null, operator: 'is', values: 'F' }) );
        var ssResult = getSalesOrderInformation(filterSearch);
        REC_DATA = {};
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var line_id = ssResult[i].getValue({ name: 'line', join: null, summary: null });
            var key = rec_id + '_' + line_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                for (var n in columns) {
                    var key_name = columns[n].name;
                    if (!!columns[n].join) {
                        key_name += '_' + columns[n].join;
                    }
                    if (key_name == 'rate') {
                        REC_DATA[key][key_name] = Number( ( Number(ssResult[i].getValue('fxamount')) / Number(ssResult[i].getValue('quantityuom')) ).toFixed(2));
                    }
                    else {
                        REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                    }
                }
                recDataArr.push(REC_DATA[key]);
            }
        }

        log.debug('REC_DATA 2', REC_DATA);

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

        // ################################################################################################
        // ===== Set Summary Items List
        // ################################################################################################
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
                    column = 'custpage_' + column;
                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        // ################################################################################################
        // ===== Address Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_address_tab', label: 'Address' };
        form.addTab(tabFormat);

        var fieldFormat = { id: 'custpage_shipaddresslist', type: 'select', label: 'Ship To Select', source: null, container: tabFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }

        var fieldFormat = { id: 'custpage_shipaddress', type: 'textarea', label: 'Ship To Address', source: null, container: tabFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        var fieldFormat = { id: 'custpage_billaddresslist', type: 'select', label: 'Bill To Select', source: null, container: tabFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });
            uiField.addSelectOption({ value: '', text: '' });
        for (var n in CUSTOMER_ADDRESS) {
            var value = CUSTOMER_ADDRESS[n]['id'];
            var text = CUSTOMER_ADDRESS[n]['label'];
            uiField.addSelectOption({ value: value, text: text });
        }

        var fieldFormat = { id: 'custpage_billaddress', type: 'textarea', label: 'Bill To Address', source: null, container: tabFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== EXP Sales Export Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_exp_sales_export_tab', label: 'EXP Sales Export' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== EXP Sales Export Tab - Sales Export Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'sales_export_information', label: 'Sales Export Information', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custbody_exp_countryorigin', type: 'select', label: 'Country of Origin', source: 'customlist_exp_countryorigin', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_loadingtype', type: 'select', label: 'Loading Type', source: 'customlist_exp_loadingtype', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_packing', type: 'text', label: 'Packing', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_tolerance', type: 'percent', label: 'Tolerance', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_insurance', type: 'text', label: 'Insurance', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_shippingmarks', type: 'textarea', label: 'Shipping Mark', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_etdtext', type: 'text', label: 'ETD Date (Text)', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_netweigh', type: 'text', label: 'Net Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_grossweight', type: 'text', label: 'Gross Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_cbm', type: 'text', label: 'CBM.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custbody_exp_shippingmaster', type: 'select', label: 'EXP Shipping Master', source: 'customrecord_exp_shippingmaster', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'disabled' });

        var fieldFormat = { id: 'custpage_custbody_exp_shipping_port', type: 'text', label: 'EXP Shipping Port', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        var fieldFormat = { id: 'custpage_custbody_exp_destination_country', type: 'text', label: 'EXP Destination Country', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        var fieldFormat = { id: 'custpage_custbody_exp_port', type: 'text', label: 'EXP Port', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        var fieldFormat = { id: 'custpage_custbody_exp_intransit_to', type: 'text', label: 'EXP Intransit To', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat);
            uiField.updateDisplayType({ displayType : 'inline' });

        // ################################################################################################
        // ===== EXP Sales Export Tab - EXP Containers Details
        // ################################################################################################
        var subListId = 'custpage_containers_details_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'inlineeditor', label: 'EXP Containers Details', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_custrecord_exp_containerstype', label: 'EXP Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_containerssize', label: 'EXP Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_qtycontainers', label: 'EXP NO. of Containers', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_containersdescription', label: 'EXP Containers Description', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;

        var ssResult = getContainersInformation(rec_id_list);
        REC_DATA = {};
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: null, summary: null });
            var containerstype_id = ssResult[i].getValue({ name: 'custrecord_exp_containerstype', join: null, summary: null });
            var containerssize_id = ssResult[i].getValue({ name: 'custrecord_exp_containerssize', join: null, summary: null });
            var key = containerstype_id + '_' + containerssize_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                for (var n in columns) {
                    var key_name = columns[n].name;
                    if (!!columns[n].join) {
                        key_name += '_' + columns[n].join;
                    }
                    if (key_name == 'custrecord_exp_containerstype') {
                        REC_DATA[key][key_name] = ssResult[i].getValue(columns[n]);
                    }
                    else if (key_name == 'custrecord_exp_containerssize') {
                        REC_DATA[key][key_name] = ssResult[i].getValue(columns[n]);
                    }
                    else {
                        REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                    }
                }
                recDataArr.push(REC_DATA[key]);
            }
            else {
                for (var n in columns) {
                    if (key_name == 'custrecord_exp_qtycontainers') {
                        REC_DATA[key][key_name] = Number(REC_DATA[key][key_name]) + Number(ssResult[i].getValue({ name: 'custrecord_exp_qtycontainers', join: null, summary: null }));
                        REC_DATA[key][key_name] = Number(REC_DATA[key][key_name].toFixed(0));
                    }
                }
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

        // ################################################################################################
        // ===== EXP Sales Export Tab - Set EXP Containers Details
        // ################################################################################################
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
                    column = 'custpage_' + column;
                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: rec_id_list[0] }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var ssResult = getSalesOrderInformation(filterSearch);
        for (var key in mapping_body_field) {
            var id = key.replace('custpage_', '');
            var column = { name: id, join: null };
            var value = ssResult[0].getValue(column);
            if (id == 'billaddresslist') {
                value = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'billingaddress' })];
            }
            else if (id == 'shipaddresslist') {
                value = ADDRESS_MAP[ssResult[0].getValue({ name: 'internalid', join: 'shippingaddress' })];
            }

            defaultValues[key] = value;
        }

        defaultValues['custpage_trandate'] = new Date();
        defaultValues['step'] = 'GenerateCommercialInvoice';
        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id_list'] =  JSON.stringify(rec_id_list),
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['mapping_body_field'] = JSON.stringify(mapping_body_field);
        defaultValues['mapping_sublist_item_field'] = JSON.stringify(mapping_sublist_item_field);
        defaultValues['mapping_sublist_containers_details_field'] = JSON.stringify(mapping_sublist_containers_details_field);
        defaultValues['address_map'] = JSON.stringify(ADDRESS_MAP);
        defaultValues['customer_address_map'] = JSON.stringify(CUSTOMER_ADDRESS_MAP);
        form.updateDefaultValues(defaultValues);

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Submit' });
        var params_filter = {};
        for (var key in mapping_body_field) {
            params_filter[key] = PARAMS[key];
        }
        params_filter['step'] = 'InProgress';
        if (USE_SUB == true) {
            var key = 'custpage_subsidiary'; params_filter[key] = PARAMS[key];
        }
        var key = 'custpage_customer'; params_filter[key] = PARAMS[key];

        var script_function = getStartPageFunction(params_filter);
        form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'GenerateCommercialInvoice') {
        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'previous_step', type: 'text', label: 'Previous Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'url_page', type: 'inlinehtml', label: 'URL Page' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'job_record_id', type: 'text', label: 'Job Record ID' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Convert Params Variable
        // ################################################################################################
        var rec_id_list = JSON.parse(PARAMS['rec_id_list']);
        var mapping_body_field = JSON.parse(PARAMS['mapping_body_field']);
        var mapping_sublist_item_field = JSON.parse(PARAMS['mapping_sublist_item_field']);
        var mapping_sublist_containers_details_field = JSON.parse(PARAMS['mapping_sublist_containers_details_field']);
        var job_record_id = null;
        var error_message = '';
        log.debug('rec_id_list', rec_id_list);

        // ################################################################################################
        // ===== Validate Data
        // ################################################################################################
        if (checkInProgressData(rec_id_list)) {
            form = ui.createForm('Warning');
            var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = '<b style="color:Tomato;">The information has changed. Please try again.</b>';

            var params_filter = {};
            for (var key in mapping_body_field) {
                params_filter[key] = PARAMS[key];
            }
            params_filter['step'] = 'InProgress';
            if (USE_SUB == true) {
                var key = 'custpage_subsidiary'; params_filter[key] = PARAMS[key];
            }
            var key = 'custpage_customer'; params_filter[key] = PARAMS[key];

            var script_function = getStartPageFunction(params_filter);
            form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
            context.response.writePage(form);
            return;
        }

        // ################################################################################################
        // ===== Create Job Record
        // ################################################################################################
        var job_record_rec = record.create({ type: 'customrecord_exp_splitpi_jobprocess', isDynamic: true });
            job_record_rec.setValue('custrecord_spj_script_id', SL_SCRIPT_ID);
            job_record_rec.setValue('custrecord_spj_combine_pi_internal_id', rec_id_list.join(','));
            job_record_rec.setValue('custrecord_spj_combine_pi', rec_id_list);
            job_record_id = job_record_rec.save();

        try {

            // ################################################################################################
            // ===== Generate Commercial Invoice
            // ################################################################################################
            var subListId = 'custpage_proforma_invoice_list';
            var so_id_main = REQUEST.getSublistValue(subListId, 'custpage_internalid', 0);
            var ci_rec = record.copy({
                            type: 'salesorder',
                            id: so_id_main,
                            isDynamic: true
                        });

            // ################################################################################################
            // ===== Remove Item Line
            // ################################################################################################
            var line_count = ci_rec.getLineCount('item');
            for (var i = line_count-1; i >= 0; i--) {
                ci_rec.removeLine('item', i);
            }

            // ################################################################################################
            // ===== Set Body Field
            // ################################################################################################
            log.debug('mapping_body_field', mapping_body_field);
            ci_rec.setValue('custbody_exp_ordertype', 3); // Commercial Invoice
            ci_rec.setValue('orderstatus', 'A'); // Pending Approval
            ci_rec.setValue('custbody_exp_originalprofoma', '');
            ci_rec.setValue('custbody_exp_splitnumber', '');
            ci_rec.setValue('custbody_exp_proformainvoicsplit', false);
            for (var key in mapping_body_field) {
                var id = key.replace('custpage_', '');
                var value = PARAMS[key];
                var type = mapping_body_field[key].type;
                if (type == 'date') {
                    value = format.parse(value, 'date');
                }
                else if (type == 'percent') {
                    value = value.replace('%', '');
                }
                ci_rec.setValue(id, value);
            }

            // ################################################################################################
            // ===== Set Sublist Item Line
            // ################################################################################################
            log.debug('mapping_sublist_item_field', mapping_sublist_item_field);
            var subListId = 'custpage_summary_items_list';
            var subListNSId = 'item';
            var line_count = REQUEST.getLineCount(subListId);
            for (var i = 0; i < line_count; i++) {
                ci_rec.selectNewLine(subListNSId);
                for (var key in mapping_sublist_item_field) {
                    var id = key.replace('custpage_', '');
                    var value = REQUEST.getSublistValue(subListId, key, i);
                    var type = mapping_sublist_item_field[key].type;

                    if (id.indexOf('internalid_') != -1) {
                        id = id.replace('internalid_', '');
                    }

                    if (id == 'tranid') {
                        id = 'custcol_exp_cirefpinum';
                    }
                    else if (id == 'unitid') {
                        id = 'units';
                    }
                    else if (id == 'quantityuom') {
                        id = 'quantity';
                    }
                    else if (id == 'taxitem') {
                        id = 'taxcode';
                    }
                    else if (type == 'percent') {
                        value = value.replace('%', '');
                    }
                    // log.debug('id | value', id + ' | ' + value);
                    ci_rec.setCurrentSublistValue(subListNSId, id, value);
                }
                ci_rec.setCurrentSublistValue(subListNSId, 'commitinventory', 3); // Do Not Commit
                ci_rec.commitLine(subListNSId);
            }

            // ################################################################################################
            // ===== Set Sublist EXP Containers Details Line
            // ################################################################################################
            log.debug('mapping_sublist_containers_details_field', mapping_sublist_containers_details_field);
            var subListId = 'custpage_containers_details_list';
            var subListNSId = 'recmachcustrecord_exp_transrefcon';
            var line_count = REQUEST.getLineCount(subListId);
            for (var i = 0; i < line_count; i++) {
                ci_rec.selectNewLine(subListNSId);
                for (var key in mapping_sublist_containers_details_field) {
                    var id = key.replace('custpage_', '');
                    var value = REQUEST.getSublistValue(subListId, key, i);
                    var type = mapping_sublist_containers_details_field[key].type;

                    if (id.indexOf('internalid_') != -1) {
                        id = id.replace('internalid_', '');
                    }

                    if (type == 'percent') {
                        value = value.replace('%', '');
                    }
                    // log.debug('id | value', id + ' | ' + value);
                    ci_rec.setCurrentSublistValue(subListNSId, id, value);
                }
                ci_rec.commitLine(subListNSId);
            }

            // ################################################################################################
            // ===== Save Record
            // ################################################################################################
            var ci_id = ci_rec.save({ enableSourcing: true, ignoreMandatoryFields: false });
            var recObj = search.lookupFields({
                                type: 'salesorder',
                                id: ci_id,
                                columns: [
                                    'tranid'
                                ]
                            });
            var ci_doc = recObj['tranid'];

            // ################################################################################################
            // ===== Update Job Record
            // ################################################################################################
            var data = {};
                data['custrecord_spj_ci_internal_id'] = ci_id;
                data['custrecord_spj_ci_no'] = ci_doc;
            record.submitFields({ type: 'customrecord_exp_splitpi_jobprocess', id: job_record_id, values: data });

            // ################################################################################################
            // ===== Primary Information Group
            // ################################################################################################
            var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information' };
            var fieldGroup = form.addFieldGroup(fieldGroupFormat);
                fieldGroup.isBorderHidden = false;
                fieldGroup.isSingleColumn = false;

            var fieldFormat = { id: 'custpage_internalid', type: 'select', label: 'Commercial Invoice', source: 'salesorder',  container: fieldGroupFormat.id };
                uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.isMandatory = true;
                uiField.defaultValue = ci_id;

            var fieldFormat = { id: 'custpage_tranid', type: 'text', label: 'Commercial Invoice', source: null,  container: fieldGroupFormat.id };
                uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'hidden' });
                uiField.isMandatory = true;

            // ################################################################################################
            // ===== Proforma Invoice Details Tab
            // ################################################################################################
            var tabFormat = { id: 'custpage_proforma_invoice_details_tab', label: 'Proforma Invoice Details' };
            form.addTab(tabFormat);
            var subListId = 'custpage_proforma_invoice_list';
            var field_format = [];
            var sublistFormat = { id: subListId, type: 'list', label: ' ', tab: tabFormat.id  };
            var sublist = form.addSublist(sublistFormat);
            var fieldFormat = { id: 'custpage_internalid', label: 'Proforma Invoice ID', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
            var fieldFormat = { id: 'custpage_tranid', label: 'Proforma Invoice No.', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_trandate', label: 'Date', type: 'date', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_custbody_exp_etddate', label: 'ETD Date', type: 'date', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_custbody_exp_etadate', label: 'ETA Date', type: 'date', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_custbody_exp_incoterms', label: 'Incoterms', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_custbody_exp_portload', label: 'Port of Loading', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_custrecord_exp_destinationcountry_shippingaddress', label: 'Destination Port', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_currency', label: 'Currency', type: 'text', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'custpage_total', label: 'Amount', type: 'currency', source: null }; field_format.push(fieldFormat);
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            var fieldFormat = { id: 'status_msg', label: 'Status', type: 'text', source: null };
                sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

            var line = 0;
            var line_count = REQUEST.getLineCount(subListId);
            for (var i = 0; i < line_count; i++) {
                for (var n in field_format) {
                    var column = field_format[n]['id'];
                    var value = REQUEST.getSublistValue(subListId, column, i);
                    sublist.setSublistValue({id: column, line: line, value: value});
                }

                var value = '<div id="line'+line+'_status"><p style="color:black"><b>Waiting</b></p></div>';
                    sublist.setSublistValue({ id: 'status_msg', line: line, value: value });

                line++;
            }

            // ################################################################################################
            // ===== Default Values
            // ################################################################################################
            var defaultValues = {};
            for (var id in PARAMS) {
                defaultValues[id] = PARAMS[id];
            }
            defaultValues['step'] = 'UpdateProformaInvoice';
            defaultValues['previous_step'] = PARAMS['step'];
            defaultValues['params'] = JSON.stringify(PARAMS);
            defaultValues['custpage_tranid'] = ci_doc;
            defaultValues['job_record_id'] = job_record_id;
            form.updateDefaultValues(defaultValues);

            context.response.writePage(form);
        } catch (e) {
            // ################################################################################################
            // ===== Update Job Record
            // ################################################################################################
            if (!!e.message) error_message = e.message; else error_message = e;
            var data = {};
                data['custrecord_spj_error_message'] = error_message;
                data['custrecord_spj_processcompleted'] = true;
            record.submitFields({ type: 'customrecord_exp_splitpi_jobprocess', id: job_record_id, values: data });

            form = ui.createForm('Warning');
            var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = '<b style="color:Tomato;">'+error_message+'</b>';

            var params_filter = {};
            for (var key in mapping_body_field) {
                params_filter[key] = PARAMS[key];
            }
            params_filter['step'] = 'InProgress';
            var script_function = getStartPageFunction(params_filter);
            form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
            context.response.writePage(form);
            return;
        }
    }
    else if (PARAMS['step'] == 'CreateProcess') {

        log.debug('Start | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);
        log.debug('step = '+PARAMS['step'], 'data_value = '+PARAMS['data_value']);
        var pi_id = '';
        var pi_doc = '';
        var res_obj = {};

        try {
            if (!!PARAMS['data_value']) {
                res_obj['line'] = PARAMS['line'];
                var data_obj = JSON.parse(PARAMS['data_value']);
                var pi_rec = record.load({ type: 'salesorder', id: data_obj['rec_id'] });
                    pi_rec.setValue('custbody_exp_refcommercial', data_obj['ref_rec_doc']);
                var line_count = Number(pi_rec.getLineCount('item'));
                for (var i = 0; i < line_count; i++) {
                    pi_rec.setSublistValue('item', 'isclosed', i, true);
                }
                res_obj['pi_doc'] = pi_rec.getValue('tranid');
                pi_id = pi_rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
                var linkUrl = url.resolveRecord({ recordType: 'salesorder', recordId: pi_doc, isEditMode: false });
                res_obj['pi_url'] = linkUrl;
                res_obj['status'] = 'OK';
                res_obj['pi_id'] = pi_id;
            }
        } catch (e) {
            res_obj['status'] = 'FAIL';
            res_obj['msg'] = e.message;
            log.error('step = '+PARAMS['step'] + ' | ERROR', e);
        }
        log.debug('step = '+PARAMS['step'] + ' | res_obj', res_obj);
        context.response.write(JSON.stringify(res_obj));
    }
    else if (PARAMS['step'] == 'UpdateJobProcess') {
        log.debug('Start | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);
        log.debug('step = '+PARAMS['step'], 'job_record_id = '+PARAMS['job_record_id']+' | ci_doc = '+PARAMS['ci_doc']);

        // ################################################################################################
        // ===== Update Job Record
        // ################################################################################################
        var data = {};
            data['custrecord_spj_processcompleted'] = true;
        record.submitFields({ type: 'customrecord_exp_splitpi_jobprocess', id: PARAMS['job_record_id'], values: data });
    }
    else if  (PARAMS['step'] == 'loadSavedSearch') {
        var FORM_NAME = PARAMS['step'];

        log.debug(FORM_NAME+' | USER_ROLE_ID = '+USER_ROLE_ID+' | USER_ID = '+USER_ID, 'step = ' + PARAMS['step']);

        var filterSearch = [];
        if (!!PARAMS['filterSearch']) {
            filterSearch = JSON.parse(PARAMS['filterSearch']);
        }
        var columnSearch = [];
        if (!!PARAMS['columnSearch']) {
            columnSearch = JSON.parse(PARAMS['columnSearch']);
        }

        var ssType = null;
        var ssId = null;

        if (!!PARAMS['ssType']) {
            ssType = PARAMS['ssType'];
        }

        if (!!PARAMS['ssId']) {
            ssId = PARAMS['ssId'];
        }

        var ssResult = getSearch(ssType, ssId, columnSearch, filterSearch);

        var RESPONSE_MSG = JSON.stringify(ssResult);

        context.response.write(RESPONSE_MSG.toString());
    }
}

// ################################################################################################
// ===== Suitelet Library Function
// ################################################################################################
function getSalesOrderInformation(filters) {
    var filterSearch = filters;
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
        columnSearch.push(search.createColumn({ name: 'custbody_exp_portload', summary: null }));
        columnSearch.push(search.createColumn({ name: 'total', summary: null }));
        columnSearch.push(search.createColumn({ name: 'location', summary: null }));

        // ################################################################################################
        // ===== Get Items Tab
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'line', summary: null }));
        columnSearch.push(search.createColumn({ name: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'itemid', join: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'displayname', join: 'item', summary: null }));
        columnSearch.push(search.createColumn({ name: 'memo', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'location', summary: null }));
        columnSearch.push(search.createColumn({ name: 'quantity', summary: null }));
        columnSearch.push(search.createColumn({ name: 'unitid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'unit', summary: null }));
        columnSearch.push(search.createColumn({ name: 'rate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custcol_exp_splitquantity', summary: null }));
        columnSearch.push(search.createColumn({ name: 'quantityuom', summary: null }));
        columnSearch.push(search.createColumn({ name: 'fxamount', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'taxitem', summary: null }));

        // ################################################################################################
        // ===== Get Address Tab
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'billingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'shipaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'billaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_destinationcountry', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_destinationcountry', join: 'billingaddress', summary: null }));

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

function checkInProgressData(rec_id_list) {
    var inProgress = false;
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'custrecord_spj_combine_pi', join: null, operator: 'anyof', values: rec_id_list }) );
        filterSearch.push( search.createFilter({ name: 'isinactive', join: null, operator: 'is', values: 'F' }) );
        filterSearch.push( search.createFilter({ name: 'custrecord_spj_ci_no', join: null, operator: 'isnotempty', values: null }) );
        // filterSearch.push( search.createFilter({ name: 'custrecord_spj_processcompleted', join: null, operator: 'is', values: 'F' }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
    var ssResultCheck = getSearch('customrecord_exp_splitpi_jobprocess', null, columnSearch, filterSearch);
    if (ssResultCheck.length > 0) {
        inProgress = true;
    }
    return inProgress;
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

function getImageLoading() {
    return 'data:image/gif;base64,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';
}

function nvlNull(input, output) {
    if (!!input || input === 0) return input.toString();
    if (!!output || output === 0) return output;
    return null;
}

function getStartPageFunction(params) {
    var scriptURL = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
    for (var key in params) {
        scriptURL += '&'+key+'='+params[key];
    }
    var script_function = "page_init;";
        script_function += "function bt_back(){ window.location = '" + scriptURL + "'; }";
        script_function += "bt_back;";
    return script_function;
}
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType Suitelet
 *
 * @summary     Loading Plan
 * @author      Rakop M. [2024/09/17] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CS_SCRIPT_PATH = './EXP SL Loading Plan CS.js';
var SL_SCRIPT_ID = 'customscript_exp_sl_loading_plan';
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
    formName = 'LoadingPlan';
    var form = ui.createForm(formName);

    if (PARAMS['step'] == 'LoadingPlan') {
        formName = 'Loading Plan';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        // ################################################################################################
        // ===== Default Variable
        // ################################################################################################
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;
        var mapping_body_field = {};
        var mapping_sublist_item_field = {};
        var mapping_sublist_containers_details_field = {};
        var pack_detail = {};
        var item_detail = {};
        var container_detail = {};
        var is_containers_avalable = false;

        if (!!PARAMS['pack_detail']) pack_detail = JSON.parse(PARAMS['pack_detail']);
        if (!!PARAMS['item_detail']) item_detail = JSON.parse(PARAMS['item_detail']);
        if (!!PARAMS['container_detail']) container_detail = JSON.parse(PARAMS['container_detail']);

        log.debug('pack_detail', pack_detail);
        log.debug('item_detail', item_detail);
        log.debug('container_detail', container_detail);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = 'T';
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_containers_details_field', type: 'longtext', label: 'Mapping Sublist Containers Details Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'pack_detail', type: 'longtext', label: 'Pack Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(pack_detail);
        form.addField({ id: 'item_detail', type: 'longtext', label: 'Item Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(item_detail);
        form.addField({ id: 'container_detail', type: 'longtext', label: 'Container Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(container_detail);
        form.addField({ id: 'container_number', type: 'integer', label: 'Container Number' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Get Sales Order Information
        // ################################################################################################
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: PARAMS['rec_id'] }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var ssResult = getSalesOrderInformation(filterSearch);

        // ################################################################################################
        // ===== Get Booking Information
        // ################################################################################################
        var filterSearch = [];
        var ssResult_Booking = getBookingInformation(PARAMS['rec_id']);

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_custrecord_lp_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: fieldGroupFormat.id };
                mapping_body_field[fieldFormat.id] = fieldFormat;
            var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = ssResult[0].getValue('subsidiary');
        }

        var fieldFormat = { id: 'custpage_custrecord_lp_location', type: 'select', label: 'Location (Branch)', source: 'location', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('location');

        var fieldFormat = { id: 'custpage_custrecord_lp_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('entity');

        var fieldFormat = { id: 'custpage_custrecord_lp_transaction', type: 'select', label: 'Commercial Invoice No.', source: 'salesorder', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var fieldFormat = { id: 'custpage_booking_no', type: 'text', label: 'Booking No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult_Booking[0].getValue('name');

        var fieldFormat = { id: 'custpage_custrecord_lp_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('currency');

        // ################################################################################################
        // ===== Containers Details Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_containers_details_tab', label: 'Containers Details' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Containers Details Tab - EXP Containers Details
        // ################################################################################################
        var subListId = 'custpage_containers_details_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: 'EXP Containers Details', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
        var fieldFormat = { id: 'custpage_internalid', label: 'EXP Containers Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_containerstype', label: 'EXP Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_containerssize', label: 'EXP Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_qtycontainers', label: 'EXP NO. of Containers', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_avalable', label: 'Avalable', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_exp_containersdescription', label: 'EXP Containers Description', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;

        var ssResult = getContainersInformation(PARAMS['rec_id']);
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
                    else if (key_name == 'custrecord_exp_qtycontainers') {
                        REC_DATA[key][key_name] = ssResult[i].getValue(columns[n]);
                        REC_DATA[key]['avalable'] = REC_DATA[key][key_name];
                        if (!!container_detail[rec_id]) {
                            REC_DATA[key]['avalable'] -= container_detail[rec_id]['selected'];
                        }
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
                        REC_DATA[key]['avalable'] = REC_DATA[key][key_name];
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
        // ===== Set EXP Containers Details
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
        // ===== Summary Items Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_summary_items_tab', label: 'Summary Items' };
        form.addTab(tabFormat);
        var subListId = 'custpage_summary_items_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: ' ', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_line', label: 'Line ID', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_itemid_item', label: 'Item Code', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_displayname_item', label: 'Item Name', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_memo', label: 'Item Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_internalid_location', label: 'Location Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_quantityuom', label: 'Quantity', type: 'integer', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_unitid', label: 'Unit Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_unit', label: 'Unit', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_rate', label: 'Unit Price', type: 'currency', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_internalid_taxitem', label: 'Tax Code Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
        var fieldFormat = { id: 'custpage_avalable', label: 'Avalable', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_selected', label: 'Selected', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_net_weight', label: 'Net Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_gross_weight', label: 'Gross Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custcol_exp_cirefpinum', label: 'EXP Ref PI No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;


        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: PARAMS['rec_id'] }) );
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
                        REC_DATA[key][key_name] = Number(Number(ssResult[i].getValue('fxamount')) / Number(ssResult[i].getValue('quantityuom')).toFixed(2));
                    }
                    else if (key_name == 'quantityuom') {
                        REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                        REC_DATA[key]['avalable'] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                        REC_DATA[key]['selected'] = 0;
                        if (!!item_detail[line_id]) {
                            REC_DATA[key]['avalable'] -= item_detail[line_id]['selected'];
                            REC_DATA[key]['selected'] = item_detail[line_id]['selected'];
                        }
                        if (REC_DATA[key]['avalable'] > 0) {
                            is_containers_avalable = true;
                        }
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
        // ===== Containers Packing Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_containers_packing_tab', label: 'Containers Packing' };
        form.addTab(tabFormat);
        var subListId = 'custpage_containers_packing_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: ' ', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
        var fieldFormat = { id: 'custpage_number', label: 'Containers Number', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_type_id', label: 'Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_size_id', label: 'Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_description', label: 'Containers Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_id', label: 'Item Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_code', label: 'Item Code', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_name', label: 'Item Name', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_memo', label: 'Item Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_selected', label: 'Quantity', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_unit', label: 'Unit', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_net_weight', label: 'Net Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_gross_weight', label: 'Gross Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custcol_exp_cirefpinum', label: 'EXP Ref PI No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        // ################################################################################################
        // ===== Set Containers Packing List
        // ################################################################################################
        var ignoreValue = ['entry'];
        var line = 0;
        for (var number in pack_detail) {
            for (var column in pack_detail[number]) {
                if (column == 'list') continue;
                var type = 'text';
                for (var n in field_format) {
                    if (field_format[n]['id'] == column) {
                        type = field_format[n]['type'];
                        continue;
                    }
                }
                var value = pack_detail[number][column];
                if (ignoreValue.indexOf(value) == -1) {
                    if (type == 'text' || type == 'select') {
                        value = nvlNull(value);
                    }
                    else if (type == 'float' || type == 'currency' ) {
                        value = Number(value).toFixed(2);
                    }
                    else if (type == 'integer') {
                        value = Number(value).toFixed(0);
                    }
                    else {
                        value = nvlNull(value);
                    }
                    // log.debug('Set Containers Packing List', 'column = '+column+' | line = '+line+' | value = '+value);
                    column = 'custpage_' + column;
                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;

            for (var index in pack_detail[number]['list']) {
                for (var column in pack_detail[number]['list'][index]) {
                    var type = 'text';
                    for (var n in field_format) {
                        if (field_format[n]['id'] == column) {
                            type = field_format[n]['type'];
                            continue;
                        }
                    }
                    var value = pack_detail[number]['list'][index][column];
                    if (ignoreValue.indexOf(value) == -1) {
                        if (type == 'text' || type == 'select') {
                            value = nvlNull(value);
                        }
                        else if (type == 'float' || type == 'currency' ) {
                            value = Number(value).toFixed(2);
                        }
                        else if (type == 'integer') {
                            value = Number(value).toFixed(0);
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
        }

        // ################################################################################################
        // ===== Shipping Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_shipping_tab', label: 'Shipping' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Shipping Tab - Shipping Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'shipping_information', label: 'Shipping Information', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_placeofreceipt', type: 'select', label: 'Place of Receipt', source: 'customrecord_exp_placeofreceipt', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_placeofreceipt');

        var fieldFormat = { id: 'custpage_custrecord_lp_portofloading', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_placeofloading');

        var fieldFormat = { id: 'custpage_custrecord_lp_countryoforigin', type: 'text', label: 'Country of Origin', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_countryoforigin');

        var fieldFormat = { id: 'custpage_custrecord_lp_shippingport', type: 'select', label: 'Shipping Port', source: 'customrecord_exp_shippport', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_shippingport');

        var fieldFormat = { id: 'custpage_custrecord_lp_destinationcountry', type: 'text', label: 'Destination Country', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_destinationcountry');

        var fieldFormat = { id: 'custpage_custrecord_lp_portofdischarge', type: 'text', label: 'Port of Discharge', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_portofdischarge');

        var fieldFormat = { id: 'custpage_custrecord_lp_placeofdelivery', type: 'text', label: 'Place of Delivery', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_placeofdelivery');

        var fieldFormat = { id: 'custpage_custrecord_lp_transhipmentport', type: 'text', label: 'Transhipment Port', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_transhipmentport');

        var fieldFormat = { id: 'custpage_custrecord_lp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_etddate');

        var fieldFormat = { id: 'custpage_custrecord_lp_etddatetext', type: 'text', label: 'ETD Date (Text)', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_etddatetext');

        var fieldFormat = { id: 'custpage_custrecord_lp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_etadate');

        var fieldFormat = { id: 'custpage_custrecord_lp_shippingmarks', type: 'textarea', label: 'Shipping Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_shippingmarks');

        // ################################################################################################
        // ===== Container Plan Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_container_plan_tab', label: 'Container Plan' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Container Plan Tab - Container Yard (CY) Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'container_yard_cy_information', label: 'Container Yard (CY)', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_cycompanyname', type: 'select', label: 'CY Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cycompanyname');

        var fieldFormat = { id: 'custpage_custrecord_lp_cytel', type: 'phone', label: 'CY Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cytel');

        var fieldFormat = { id: 'custpage_custrecord_lp_cycontract', type: 'text', label: 'CY Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cycontract');

        var fieldFormat = { id: 'custpage_custrecord_lp_cycontracttel', type: 'phone', label: 'CY Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cycontracttel');

        var fieldFormat = { id: 'custpage_custrecord_lp_cydate', type: 'date', label: 'CY Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cydate');

        var fieldFormat = { id: 'custpage_custrecord_lp_cypickupplace', type: 'text', label: 'Pick up Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_cypickupplace');

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingplace', type: 'text', label: 'Loading Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_loadingplace');

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingdatefrom', type: 'date', label: 'Loading Date From', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_loadingdatefrom');

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingdateto', type: 'date', label: 'Loading Date To', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_loadingdateto');

        var fieldFormat = { id: 'custpage_custrecord_lp_loadinginformation', type: 'textarea', label: 'Loading Information', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_loadinginformation');

        // ################################################################################################
        // ===== Container Plan Tab - Return (RE) Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'return_re_information', label: 'Return (RE)', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_returncompanyname', type: 'select', label: 'RTN Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returncompanyname');

        var fieldFormat = { id: 'custpage_custrecord_lp_returntel', type: 'phone', label: 'RTN Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returntel');

        var fieldFormat = { id: 'custpage_custrecord_lp_returncontract', type: 'text', label: 'RTN Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returncontract');

        var fieldFormat = { id: 'custpage_custrecord_lp_returncontracttel', type: 'phone', label: 'RTN Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returncontracttel');

        var fieldFormat = { id: 'custpage_custrecord_lp_paperlesscode', type: 'text', label: 'Paper Less Code', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_paperlesscode');

        var fieldFormat = { id: 'custpage_custrecord_lp_returndate', type: 'date', label: 'Return Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returndate');

        var fieldFormat = { id: 'custpage_custrecord_lp_returnplace', type: 'text', label: 'Return Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_returnplace');

        var fieldFormat = { id: 'custpage_custrecord_lp_firstreturn', type: 'date', label: 'First Return', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_firstreturn');

        var fieldFormat = { id: 'custpage_custrecord_lp_closingdate', type: 'date', label: 'Closing Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_closingdate');

        var fieldFormat = { id: 'custpage_custrecord_lp_closingtime', type: 'timeofday', label: 'Closing Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_closingtime');

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmname', type: 'text', label: 'VGM Name', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_vgmname');

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmtel', type: 'phone', label: 'VGM Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_vgmtel');

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmmarks', type: 'textarea', label: 'VGM Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_vgmmarks');

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmcutdate', type: 'date', label: 'VGM Cut-Off Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_vgmcutdate');

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmcuttime', type: 'timeofday', label: 'VGM Cut-Off Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult_Booking[0].getValue('custrecord_bk_vgmcuttime');

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        if (is_containers_avalable == true) {
            form.addSubmitButton({ label: 'Pack' });
        }
        else {
            form.addSubmitButton({ label: 'Next' });
        }

        var scriptURL = url.resolveRecord({
                        recordType: 'salesorder',
                        recordId: PARAMS['rec_id']
                    });
        var script_function = "page_init;";
            script_function += "function bt_cancel(){ window.location = '" + scriptURL + "'; }";
            script_function += "bt_cancel;";
        form.addButton({ id: 'bt_cancel', label: 'Cancel', functionName: script_function });

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'PackContainerItem';

        if (is_containers_avalable != true) {
            defaultValues['step'] = 'LoadingPlanPreview';
        }

        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id'] =  PARAMS['rec_id'];
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['mapping_body_field'] = JSON.stringify(mapping_body_field);
        defaultValues['mapping_sublist_item_field'] = JSON.stringify(mapping_sublist_item_field);
        defaultValues['mapping_sublist_containers_details_field'] = JSON.stringify(mapping_sublist_containers_details_field);

        if (!!PARAMS['loading_plan_id']) {
            var ssResult = getLoadingPlanInformation(PARAMS['loading_plan_id']);
            for (var key in mapping_body_field) {
                defaultValues[key] = ssResult[0].getValue(key.replace('custpage_', ''));
            }
        }

        form.updateDefaultValues(defaultValues);

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'PackContainerItem') {
        formName = 'Loading Plan (Pack Container Item)';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        // ################################################################################################
        // ===== Default Variable
        // ################################################################################################
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;
        var mapping_body_field = {};
        var mapping_sublist_item_field = {};
        var mapping_sublist_containers_details_field = {};
        var pack_detail = {}
        var item_detail = {}
        var container_detail = {}
        var line_data_seleted = {};

        if (!!PARAMS['pack_detail']) pack_detail = JSON.parse(PARAMS['pack_detail']);
        if (!!PARAMS['item_detail']) item_detail = JSON.parse(PARAMS['item_detail']);
        if (!!PARAMS['container_detail']) container_detail = JSON.parse(PARAMS['container_detail']);

        if (!!PARAMS['container_number']) {
            for (var n in pack_detail[PARAMS['container_number']]['list']) {
                var line_id = pack_detail[PARAMS['container_number']]['list'][n]['line_id'];
                var selected = Number(pack_detail[PARAMS['container_number']]['list'][n]['selected']);
                if (!!item_detail[line_id]) {
                    item_detail[line_id]['selected'] -= selected;
                    line_data_seleted[line_id] = {};
                    line_data_seleted[line_id]['selected'] = selected;
                }
            }
        }

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = 'T';
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_containers_details_field', type: 'longtext', label: 'Mapping Sublist Containers Details Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'pack_detail', type: 'longtext', label: 'Pack Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(pack_detail);
        form.addField({ id: 'item_detail', type: 'longtext', label: 'Item Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(item_detail);
        form.addField({ id: 'container_detail', type: 'longtext', label: 'Container Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(container_detail);

        // ################################################################################################
        // ===== Get Select Line Containers Details
        // ################################################################################################
        var subListId = 'custpage_containers_details_list';
        var line_select = -1;
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            var is_selected = REQUEST.getSublistValue(subListId, 'custpage_is_select', i);
            if (is_selected == 'T') {
                line_select = i;
                break;
            }
        }

        var max_number = Object.keys(pack_detail).length;
        var running_number = max_number + 1;

        if (!!PARAMS['container_number']) {
            line_select = pack_detail[PARAMS['container_number']]['line'];
            running_number = PARAMS['container_number'];
        }

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'containers_details', label: 'Containers Details' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_line_select', type: 'integer', label: 'Line Select', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = line_select;

        var fieldFormat = { id: 'custpage_internalid', type: 'integer', label: 'Containers Internal ID', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = REQUEST.getSublistValue(subListId, 'custpage_internalid', line_select);

        var fieldFormat = { id: 'custpage_custrecord_cit_containersnumber', type: 'integer', label: 'Containers Number', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = running_number;

        var fieldFormat = { id: 'custpage_custrecord_exp_containerstype', type: 'select', label: 'Containers Type', source: 'customlist_exp_containerstype', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = REQUEST.getSublistValue(subListId, 'custpage_custrecord_exp_containerstype', line_select);

        var fieldFormat = { id: 'custpage_custrecord_exp_containerssize', type: 'select', label: 'Containers Size', source: 'customlist_exp_containerssize', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = REQUEST.getSublistValue(subListId, 'custpage_custrecord_exp_containerssize', line_select);

        var fieldFormat = { id: 'custpage_custrecord_exp_containersdescription', type: 'text', label: 'Containers Description', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = REQUEST.getSublistValue(subListId, 'custpage_custrecord_exp_containersdescription', line_select);

        var fieldFormat = { id: 'custrecord_cit_netweight', type: 'currency', label: 'Net Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = 0;

        var fieldFormat = { id: 'custrecord_cit_grossweight', type: 'currency', label: 'Gross Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = 0;

        // ################################################################################################
        // ===== Pack Items List
        // ################################################################################################
        var subListId = 'custpage_pack_items_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: 'Pack Items', tab: null  };
        var sublist = form.addSublist(sublistFormat);
            sublist.addButton({ id: 'custpage_bt_mark_all', label: 'Select All', functionName: 'markListAll("'+subListId+'")' });
            sublist.addButton({ id: 'custpage_bt_unmark_all', label: 'Unselect All', functionName: 'unmarkListAll("'+subListId+'")' });
        var fieldFormat = { id: 'custpage_is_select', label: 'Select', type: 'checkbox', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
        var fieldFormat = { id: 'custpage_line', label: 'Line ID', type: 'integer', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_internalid_item', label: 'Item Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_itemid_item', label: 'Item Code', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_displayname_item', label: 'Item Name', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_memo', label: 'Item Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
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
        var fieldFormat = { id: 'custpage_avalable', label: 'Avalable', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_selected', label: 'Selected', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_net_weight', label: 'Net Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_gross_weight', label: 'Gross Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custcol_exp_cirefpinum', label: 'EXP Ref PI No.', type: 'text', source: null }; field_format.push(fieldFormat);
            mapping_sublist_item_field[fieldFormat.id] = fieldFormat;
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: PARAMS['rec_id'] }) );
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
                        REC_DATA[key][key_name] = Number(Number(ssResult[i].getValue('fxamount')) / Number(ssResult[i].getValue('quantityuom')).toFixed(2));
                    }
                    else if (key_name == 'quantityuom') {
                        REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                        REC_DATA[key]['avalable'] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                        if (!!item_detail[line_id]) {
                            REC_DATA[key]['avalable'] -= item_detail[line_id]['selected'];
                        }
                        if (!!line_data_seleted[line_id]) {
                            REC_DATA[key]['is_select'] = 'T';
                            REC_DATA[key]['selected'] = line_data_seleted[line_id]['selected'];
                        }
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
        // ===== Set Pack Items List
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
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'LoadingPlan';
        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id'] =  PARAMS['rec_id'];
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['mapping_body_field'] = JSON.stringify(mapping_body_field);
        defaultValues['mapping_sublist_item_field'] = JSON.stringify(mapping_sublist_item_field);
        defaultValues['mapping_sublist_containers_details_field'] = JSON.stringify(mapping_sublist_containers_details_field);
        defaultValues['pack_detail'] = JSON.stringify(pack_detail);
        form.updateDefaultValues(defaultValues);

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        if (!!PARAMS['container_number']) {
            form.addSubmitButton({ label: 'Save' });
        }
        else {
            form.addSubmitButton({ label: 'Add' });
        }

        var scriptURL = url.resolveRecord({
                        recordType: 'salesorder',
                        recordId: PARAMS['rec_id']
                    });
        form.addButton({ id: 'bt_back', label: 'Back', functionName: 'backFromPackContainerItemPage' });

        context.response.writePage(form);

    }
    else if (PARAMS['step'] == 'LoadingPlanPreview') {
        formName = 'Loading Plan (Preview)';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        // ################################################################################################
        // ===== Default Variable
        // ################################################################################################
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;
        var mapping_body_field = {};
        var mapping_sublist_item_field = {};
        var mapping_sublist_containers_details_field = {};
        var pack_detail = {};
        var item_detail = {};
        var container_detail = {};
        var is_containers_avalable = false;

        if (!!PARAMS['pack_detail']) pack_detail = JSON.parse(PARAMS['pack_detail']);
        if (!!PARAMS['item_detail']) item_detail = JSON.parse(PARAMS['item_detail']);
        if (!!PARAMS['container_detail']) container_detail = JSON.parse(PARAMS['container_detail']);

        log.debug('pack_detail', pack_detail);
        log.debug('item_detail', item_detail);
        log.debug('container_detail', container_detail);

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = 'T';
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_containers_details_field', type: 'longtext', label: 'Mapping Sublist Containers Details Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'pack_detail', type: 'longtext', label: 'Pack Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(pack_detail);
        form.addField({ id: 'item_detail', type: 'longtext', label: 'Item Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(item_detail);
        form.addField({ id: 'container_detail', type: 'longtext', label: 'Container Detail' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = JSON.stringify(container_detail);
        form.addField({ id: 'container_number', type: 'integer', label: 'Container Number' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Get Sales Order Information
        // ################################################################################################
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: PARAMS['rec_id'] }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var ssResult = getSalesOrderInformation(filterSearch);

        // ################################################################################################
        // ===== Get Booking Information
        // ################################################################################################
        var filterSearch = [];
        var ssResult_Booking = getBookingInformation(PARAMS['rec_id']);

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_custrecord_lp_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: fieldGroupFormat.id };
                mapping_body_field[fieldFormat.id] = fieldFormat;
            var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = ssResult[0].getValue('subsidiary');
        }

        var fieldFormat = { id: 'custpage_custrecord_lp_location', type: 'select', label: 'Location (Branch)', source: 'location', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('location');

        var fieldFormat = { id: 'custpage_custrecord_lp_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('entity');

        var fieldFormat = { id: 'custpage_custrecord_lp_transaction', type: 'select', label: 'Commercial Invoice No.', source: 'salesorder', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var fieldFormat = { id: 'custpage_booking_no', type: 'text', label: 'Booking No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult_Booking[0].getValue('name');

        // var fieldFormat = { id: 'custpage_custrecord_lp_loadingplace', type: 'text', label: 'Loading Place', source: null, container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // var fieldFormat = { id: 'custpage_custrecord_lp_portofloading', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';
        //
        // var fieldFormat = { id: 'custpage_custrecord_lp_portofdischarge', type: 'text', label: 'Port of Discharge', source: null, container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // var fieldFormat = { id: 'custpage_custrecord_lp_shippingport', type: 'select', label: 'Shipping Port', source: 'customrecord_exp_shippport', container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // var fieldFormat = { id: 'custpage_custrecord_lp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';
        //
        // var fieldFormat = { id: 'custpage_custrecord_lp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
        //     mapping_body_field[fieldFormat.id] = fieldFormat;
        // var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        // if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('currency');

        // ################################################################################################
        // ===== List Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_containers_packing_tab', label: 'List' };
        form.addTab(tabFormat);
        var subListId = 'custpage_containers_packing_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: 'List', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_no', label: 'No.', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_number', label: 'Containers Number', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_type_id', label: 'Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_size_id', label: 'Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_description', label: 'Containers Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_id', label: 'Item Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_code', label: 'Item Code', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_name', label: 'Item Name', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_memo', label: 'Item Description', type: 'textarea', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_qty', label: 'Quantity (Item)', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_selected', label: 'Quantity', type: 'integer', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_unitid', label: 'Unit Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_unit', label: 'Unit', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_net_weight', label: 'Net Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_gross_weight', label: 'Gross Weight', type: 'currency', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
        var fieldFormat = { id: 'custpage_custcol_exp_cirefpinum', label: 'EXP Ref PI No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });

        // ################################################################################################
        // ===== Set Containers Packing List
        // ################################################################################################
        var ignoreValue = ['entry'];
        var line = 0;
        for (var number in pack_detail) {
            if (!number || number == 'undefined') continue;
            for (var column in pack_detail[number]) {
                if (column == 'list') continue;
                var type = 'text';
                for (var n in field_format) {
                    if (field_format[n]['id'] == column) {
                        type = field_format[n]['type'];
                        continue;
                    }
                }
                var value = pack_detail[number][column];
                if (ignoreValue.indexOf(value) == -1) {
                    if (type == 'text' || type == 'select') {
                        value = nvlNull(value);
                    }
                    else if (type == 'float' || type == 'currency' ) {
                        value = Number(value).toFixed(2);
                    }
                    else if (type == 'integer') {
                        value = Number(value).toFixed(0);
                    }
                    else {
                        value = nvlNull(value);
                    }
                    // log.debug('Set Containers Packing List', 'column = '+column+' | line = '+line+' | value = '+value);
                    column = 'custpage_' + column;
                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            sublist.setSublistValue({ id: 'custpage_no', line: line, value: number });
            line++;

            for (var index in pack_detail[number]['list']) {
                for (var column in pack_detail[number]['list'][index]) {
                    var type = 'text';
                    for (var n in field_format) {
                        if (field_format[n]['id'] == column) {
                            type = field_format[n]['type'];
                            continue;
                        }
                    }
                    var value = pack_detail[number]['list'][index][column];
                    if (ignoreValue.indexOf(value) == -1) {
                        if (type == 'text' || type == 'select') {
                            value = nvlNull(value);
                        }
                        else if (type == 'float' || type == 'currency' ) {
                            value = Number(value).toFixed(2);
                        }
                        else if (type == 'integer') {
                            value = Number(value).toFixed(0);
                        }
                        else {
                            value = nvlNull(value);
                        }
                        column = 'custpage_' + column;
                        sublist.setSublistValue({ id: column, line: line, value: value });
                    }
                }
                sublist.setSublistValue({ id: 'custpage_no', line: line, value: number });
                line++;
            }
        }

        // ################################################################################################
        // ===== Shipping Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_shipping_tab', label: 'Shipping' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Shipping Tab - Shipping Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'shipping_information', label: 'Shipping Information', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_placeofreceipt', type: 'select', label: 'Place of Receipt', source: 'customrecord_exp_placeofreceipt', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_portofloading', type: 'select', label: 'Port of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_countryoforigin', type: 'text', label: 'Country of Origin', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_shippingport', type: 'select', label: 'Shipping Port', source: 'customrecord_exp_shippport', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_destinationcountry', type: 'text', label: 'Destination Country', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_portofdischarge', type: 'text', label: 'Port of Discharge', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_placeofdelivery', type: 'text', label: 'Place of Delivery', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_transhipmentport', type: 'text', label: 'Transhipment Port', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_etddatetext', type: 'text', label: 'ETD Date (Text)', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_shippingmarks', type: 'textarea', label: 'Shipping Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Container Plan Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_container_plan_tab', label: 'Container Plan' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Container Plan Tab - Container Yard (CY) Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'container_yard_cy_information', label: 'Container Yard (CY)', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_cycompanyname', type: 'select', label: 'CY Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_cytel', type: 'phone', label: 'CY Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_cycontract', type: 'text', label: 'CY Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_cycontracttel', type: 'phone', label: 'CY Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_cydate', type: 'date', label: 'CY Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_cypickupplace', type: 'text', label: 'Pick up Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingplace', type: 'text', label: 'Loading Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingdatefrom', type: 'date', label: 'Loading Date From', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_loadingdateto', type: 'date', label: 'Loading Date To', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_loadinginformation', type: 'textarea', label: 'Loading Information', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Container Plan Tab - Return (RE) Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'return_re_information', label: 'Return (RE)', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_returncompanyname', type: 'select', label: 'RTN Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_returntel', type: 'phone', label: 'RTN Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_returncontract', type: 'text', label: 'RTN Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_returncontracttel', type: 'phone', label: 'RTN Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_paperlesscode', type: 'text', label: 'Paper Less Code', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_returndate', type: 'date', label: 'Return Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_returnplace', type: 'text', label: 'Return Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_firstreturn', type: 'date', label: 'First Return', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_closingdate', type: 'date', label: 'Closing Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_closingtime', type: 'timeofday', label: 'Closing Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmname', type: 'text', label: 'VGM Name', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmtel', type: 'phone', label: 'VGM Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmmarks', type: 'textarea', label: 'VGM Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmcutdate', type: 'date', label: 'VGM Cut-Off Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        var fieldFormat = { id: 'custpage_custrecord_lp_vgmcuttime', type: 'timeofday', label: 'VGM Cut-Off Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
        if (PARAMS[fieldFormat.id] != undefined) uiField.defaultValue = PARAMS[fieldFormat.id]; else PARAMS[fieldFormat.id] = '';

        // ################################################################################################
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Submit' });
        form.addButton({ id: 'bt_back', label: 'Back', functionName: 'backFromLoadingPlanPreview' });

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'GenerateLoadingPlan';
        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id'] =  PARAMS['rec_id'];
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['mapping_body_field'] = JSON.stringify(mapping_body_field);
        defaultValues['mapping_sublist_item_field'] = JSON.stringify(mapping_sublist_item_field);
        defaultValues['mapping_sublist_containers_details_field'] = JSON.stringify(mapping_sublist_containers_details_field);
        defaultValues['pack_detail'] = JSON.stringify(pack_detail);
        form.updateDefaultValues(defaultValues);

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'GenerateLoadingPlan') {
        // ################################################################################################
        // ===== Convert Params Variable
        // ################################################################################################
        var rec_id = JSON.parse(PARAMS['rec_id']);
        var mapping_body_field = JSON.parse(PARAMS['mapping_body_field']);
        var mapping_sublist_item_field = JSON.parse(PARAMS['mapping_sublist_item_field']);
        var mapping_sublist_containers_details_field = JSON.parse(PARAMS['mapping_sublist_containers_details_field']);
        var job_record_id = null;
        var error_message = '';
        log.debug('rec_id', rec_id);

        // ################################################################################################
        // ===== Generate Loading Plan
        // ################################################################################################
        var lp_rec = record.create({
					    type: 'customrecord_exp_loadplan',
					    isDynamic: true
					});

        // ################################################################################################
        // ===== Set Body Field
        // ################################################################################################
        log.debug('mapping_body_field', mapping_body_field);
        for (var key in mapping_body_field) {

            if (key == 'custpage_custrecord_lp_countryoforigin') continue;
            if (key == 'custpage_custrecord_lp_shippingport') continue;
            if (key == 'custpage_custrecord_lp_destinationcountry') continue;
            if (key == 'custpage_custrecord_lp_portofdischarge') continue;

            var id = key.replace('custpage_', '');
            var value = PARAMS[key];
            var type = mapping_body_field[key].type;
            if (!!value && type == 'date') {
                value = format.parse(value, 'date');
            }
            else if (!!value && type == 'timeofday') {
                value = format.parse(value, 'timeofday');
            }
            else if (!!value && type == 'percent') {
                value = value.replace('%', '');
            }
            if (!!value) {
                // log.debug('id | value', id + ' | ' + value);
                lp_rec.setValue(id, value);
            }
        }
        lp_rec.setValue('custrecord_lp_loaddate', new Date());
        lp_rec.setValue('custrecord_lp_status', 1); // Pending Confirm

        // ################################################################################################
        // ===== Save Record
        // ################################################################################################
        var lp_id = lp_rec.save();

        // ################################################################################################
        // ===== Generate EXP Containers Information
        // ################################################################################################
        var cti_list = [];
        var subListId = 'custpage_containers_packing_list';
        var line_count = REQUEST.getLineCount(subListId);
        var cti_rec = null;
        for (var i = 0; i < line_count; i++) {
            var number = Number(REQUEST.getSublistValue(subListId, 'custpage_number', i));
            if (number > 0) {
                if (!!cti_rec) {
                    var cti_id = cti_rec.save();
                    cti_list.push(cti_id);
                }
                cti_rec = record.create({
                    type: 'customrecord_exp_containersinfo',
                    isDynamic: true
                });

                cti_rec.setValue('name', 'Containers #' + number.toString());
                cti_rec.setValue('custrecord_eci_containersnumber', number.toString());
                cti_rec.setValue('custrecord_eci_containerstype', REQUEST.getSublistValue(subListId, 'custpage_type_id', i));
                cti_rec.setValue('custrecord_eci_containerssize', REQUEST.getSublistValue(subListId, 'custpage_size_id', i));
                cti_rec.setValue('custrecord_eci_containersdetails', REQUEST.getSublistValue(subListId, 'custpage_description', i));
                cti_rec.setValue('custrecord_eci_loadplan', lp_id);
            }
            else {
                cti_rec.selectNewLine('recmachcustrecord_cit_containersnumber');
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_loadingplan', lp_id);
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_itemcode', REQUEST.getSublistValue(subListId, 'custpage_id', i).toString());
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_itemname', REQUEST.getSublistValue(subListId, 'custpage_name', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_itemdescription', REQUEST.getSublistValue(subListId, 'custpage_memo', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_quantity', REQUEST.getSublistValue(subListId, 'custpage_qty', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_unitsofmeasure', REQUEST.getSublistValue(subListId, 'custpage_unitid', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_qtypacked', REQUEST.getSublistValue(subListId, 'custpage_selected', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_netweight', REQUEST.getSublistValue(subListId, 'custpage_net_weight', i));
                cti_rec.setCurrentSublistValue('recmachcustrecord_cit_containersnumber', 'custrecord_cit_grossweight', REQUEST.getSublistValue(subListId, 'custpage_gross_weight', i));
                cti_rec.setCurrentSublistText('recmachcustrecord_cit_containersnumber', 'custrecord_cit_refpinumber', 'Sales Order #'+REQUEST.getSublistValue(subListId, 'custpage_custcol_exp_cirefpinum', i));
                cti_rec.commitLine('recmachcustrecord_cit_containersnumber');
            }

            if (i == line_count-1) {
                var cti_id = cti_rec.save();
                    cti_list.push(cti_id);
            }
        }

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'customrecord_exp_loadplan', id: lp_id });

    }
    else if (PARAMS['step'] == 'InProgressConfirmLoadingPlan') {
        formName = 'Loading Plan - Confirm';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        // ################################################################################################
        // ===== Default Variable
        // ################################################################################################
        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;
        var mapping_body_field = {};
        var mapping_sublist_item_field = {};
        var mapping_sublist_containers_details_field = {};

        form.clientScriptModulePath = CS_SCRIPT_PATH;
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'rec_id', type: 'text', label: 'Rec ID' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' }).defaultValue = 'T';
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Get Loading Plan Information
        // ################################################################################################
        var ssResult = getLoadingPlanInformation(PARAMS['rec_id']);

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_internalid', type: 'select', label: 'Loading No.', source: 'customrecord_exp_loadplan', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var fieldFormat = { id: 'custpage_custrecord_lp_loaddate', type: 'date', label: 'Loading Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custrecord_lp_loaddate');

        var fieldFormat = { id: 'custpage_custrecord_lp_confirmdate', type: 'date', label: 'Confirm Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
            uiField.defaultValue = '';

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_custrecord_lp_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: fieldGroupFormat.id };
                mapping_body_field[fieldFormat.id] = fieldFormat;
            var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
                uiField.defaultValue = ssResult[0].getValue('custrecord_lp_subsidiary');
        }

        var fieldFormat = { id: 'custpage_custrecord_lp_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custrecord_lp_customer');

        var fieldFormat = { id: 'custpage_custrecord_lp_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custrecord_lp_currency');

        // ################################################################################################
        // ===== Classification Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'classification_information', label: 'Classification' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_lp_location', type: 'select', label: 'Location (Branch)', source: 'location', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = ssResult[0].getValue('custrecord_lp_location');

        // ################################################################################################
        // ===== Containers Details Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_containers_details_tab', label: 'Containers Details' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Containers Details Tab - Containers Details
        // ################################################################################################
        var subListId = 'custpage_containers_details_list';
        var field_format = [];
        var sublistFormat = { id: subListId, type: 'list', label: 'Containers Details', tab: tabFormat.id  };
        var sublist = form.addSublist(sublistFormat);
        var fieldFormat = { id: 'custpage_internalid_custrecord_eci_loadplan', label: 'Containers Internal ID', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'hidden' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_name_custrecord_eci_loadplan', label: 'Containers', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containersnumber_custrecord_eci_loadplan', label: 'Containers Number', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containersno_custrecord_eci_loadplan', label: 'Containers No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containersealno_custrecord_eci_loadplan', label: 'Container Seal No.', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'entry' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containerstype_custrecord_eci_loadplan', label: 'Containers Type', type: 'select', source: 'customlist_exp_containerstype' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containerssize_custrecord_eci_loadplan', label: 'Containers Size', type: 'select', source: 'customlist_exp_containerssize' }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;
        var fieldFormat = { id: 'custpage_custrecord_eci_containersdetails_custrecord_eci_loadplan', label: 'Containers Details', type: 'text', source: null }; field_format.push(fieldFormat);
            sublist.addField(fieldFormat).updateDisplayType({ displayType: 'inline' });
            mapping_sublist_containers_details_field[fieldFormat.id] = fieldFormat;

        REC_DATA = {};
        var recDataArr = [];
        for (var i = 0; !!ssResult && i < ssResult.length; i++) {
            var columns = ssResult[i].columns;
            var rec_id = ssResult[i].getValue({ name: 'internalid', join: 'custrecord_eci_loadplan', summary: null });
            var key = rec_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                for (var n in columns) {
                    var key_name = columns[n].name;
                    if (!!columns[n].join) {
                        key_name += '_' + columns[n].join;
                    }
                    if (key_name == 'custrecord_eci_containerstype_custrecord_eci_loadplan') {
                        REC_DATA[key][key_name] = ssResult[i].getValue(columns[n]);
                    }
                    else if (key_name == 'custrecord_eci_containerssize_custrecord_eci_loadplan') {
                        REC_DATA[key][key_name] = ssResult[i].getValue(columns[n]);
                    }
                    else {
                        REC_DATA[key][key_name] = ssResult[i].getText(columns[n]) || ssResult[i].getValue(columns[n]);
                    }
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
        // ===== Set Containers Details
        // ################################################################################################
        var ignoreValue = [];
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
        // ===== Create Button
        // ################################################################################################
        form.addSubmitButton({ label: 'Submit' });
        var scriptURL = url.resolveRecord({
                        recordType: 'customrecord_exp_loadplan',
                        recordId: PARAMS['rec_id']
                    });
        var script_function = "page_init;";
            script_function += "function bt_back(){ window.location = '" + scriptURL + "'; }";
            script_function += "bt_back;";
        form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });

        // ################################################################################################
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'SubmitConfirmLoadingPlan';
        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id'] =  PARAMS['rec_id'];
        defaultValues['params'] = JSON.stringify(PARAMS);
        form.updateDefaultValues(defaultValues);

        context.response.writePage(form);

    }
    else if (PARAMS['step'] == 'SubmitConfirmLoadingPlan') {
        // ################################################################################################
        // ===== Convert Params Variable
        // ################################################################################################
        var rec_id = JSON.parse(PARAMS['rec_id']);
        var job_record_id = null;
        var error_message = '';
        log.debug('rec_id', rec_id);


        // ################################################################################################
        // ===== Update Containers Information
        // ################################################################################################
        var cti_list = [];
        var subListId = 'custpage_containers_details_list';
        var line_count = REQUEST.getLineCount(subListId);
        var cti_rec = null;
        for (var i = 0; i < line_count; i++) {
            var cti_id = REQUEST.getSublistValue(subListId, 'custpage_internalid_custrecord_eci_loadplan', i);
            var update_data = {};
                update_data['custrecord_eci_containersno'] = REQUEST.getSublistValue(subListId, 'custpage_custrecord_eci_containersno_custrecord_eci_loadplan', i);
                update_data['custrecord_eci_containersealno'] = REQUEST.getSublistValue(subListId, 'custpage_custrecord_eci_containersealno_custrecord_eci_loadplan', i);

            record.submitFields({ type: 'customrecord_exp_containersinfo', id: cti_id, values: update_data });
        }

        // ################################################################################################
        // ===== Update Loading Plan
        // ################################################################################################
        var update_data = {};
            update_data['custrecord_lp_status'] = 2; // Confirmed
            update_data['custrecord_lp_confirmdate'] = PARAMS['custpage_custrecord_lp_confirmdate'];

        record.submitFields({ type: 'customrecord_exp_loadplan', id: rec_id, values: update_data });

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'customrecord_exp_loadplan', id: rec_id });
    }
    else if (PARAMS['step'] == 'SubmitCancelLoadingPlan') {
        // ################################################################################################
        // ===== Convert Params Variable
        // ################################################################################################
        var rec_id = JSON.parse(PARAMS['rec_id']);
        var job_record_id = null;
        var error_message = '';
        log.debug('rec_id', rec_id);

        // ################################################################################################
        // ===== Update Loading Plan
        // ################################################################################################
        var update_data = {};
            update_data['custrecord_lp_status'] = 3; // Cancelled

        record.submitFields({ type: 'customrecord_exp_loadplan', id: rec_id, values: update_data });

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'customrecord_exp_loadplan', id: rec_id });
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
        columnSearch.push(search.createColumn({ name: 'otherrefnum', summary: null }));

        // ################################################################################################
        // ===== Get Customer Information
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'phone', join: 'customer', summary: null }));
        columnSearch.push(search.createColumn({ name: 'fax', join: 'customer', summary: null }));
        columnSearch.push(search.createColumn({ name: 'email', join: 'customer', summary: null }));
        columnSearch.push(search.createColumn({ name: 'shipaddress', join: 'customer', summary: null }));

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
        columnSearch.push(search.createColumn({ name: 'custcol_exp_cirefpinum', summary: null }));

        // ################################################################################################
        // ===== Get Address Tab
        // ################################################################################################
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'billingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'shipaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'billaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_destinationcountry', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_shipmasteraddress', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_shipport', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_port', join: 'shippingaddress', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_exp_intransitto', join: 'shippingaddress', summary: null }));
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
    return getSearch('salesorder', null, columnSearch, filterSearch);
}

function getBookingInformation(rec_id) {
    var isConfirmed = false;
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'custrecord_bk_transaction', join: null, operator: 'is', values: rec_id }) );
        filterSearch.push( search.createFilter({ name: 'custrecord_bk_bookingstatus', join: null, operator: 'is', values: 1 }) ); // Confirmed
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'name', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_bk_placeofreceipt', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_placeofloading', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_countryoforigin', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_shippingport', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_destinationcountry', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_portofdischarge', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_placeofdelivery', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_transhipmentport', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_etddate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_etddatetext', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_etadate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_shippingmarks', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cycompanyname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cytel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cycontract', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cycontracttel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cydate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_cypickupplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_loadingplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_loadingdatefrom', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_loadingdateto', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_loadinginformation', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returncompanyname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returntel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returncontract', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returncontracttel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_paperlesscode', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returndate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_returnplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_firstreturn', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_closingdate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_closingtime', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_vgmname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_vgmtel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_vgmmarks', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_vgmcutdate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_bk_vgmcuttime', summary: null }));


    return getSearch('customrecord_exp_booking', null, columnSearch, filterSearch);
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

function getLoadingPlanInformation(recId) {
    var filterSearch = [];
        filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: recId }) );
    var columnSearch = [];
        columnSearch.push(search.createColumn({ name: 'internalid', summary: null }));
        columnSearch.push(search.createColumn({ name: 'name', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_subsidiary', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_customer', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_loaddate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_currency', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_transaction', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_location', summary: null }));
        columnSearch.push(search.createColumn({ name: 'internalid', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'name', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containersnumber', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containersno', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containersealno', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containerstype', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containerssize', join: 'custrecord_eci_loadplan', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_eci_containersdetails', join: 'custrecord_eci_loadplan', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_lp_placeofreceipt', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_portofloading', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_countryoforigin', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_shippingport', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_destinationcountry', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_portofdischarge', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_placeofdelivery', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_transhipmentport', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_etddate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_etddatetext', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_etadate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_shippingmarks', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cycompanyname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cytel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cycontract', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cycontracttel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cydate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_cypickupplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_loadingplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_loadingdatefrom', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_loadingdateto', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_loadinginformation', summary: null }));

        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returncompanyname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returntel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returncontract', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returncontracttel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_paperlesscode', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returndate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_returnplace', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_firstreturn', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_closingdate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_closingtime', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_vgmname', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_vgmtel', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_vgmmarks', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_vgmcutdate', summary: null }));
        columnSearch.push(search.createColumn({ name: 'custrecord_lp_vgmcuttime', summary: null }));

    return getSearch('customrecord_exp_loadplan', null, columnSearch, filterSearch);
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

function nvlNull(input, output) {
    if (!!input || input === 0) return input.toString();
    if (!!output || output === 0) return output;
    return null;
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

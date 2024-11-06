/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType Suitelet
 *
 * @summary     Booking
 * @author      Rakop M. [2024/09/09] <rakop@teibto.com>
 *
 * @version     1.0
 */

var CS_SCRIPT_PATH = './EXP SL Booking CS.js';
var SL_SCRIPT_ID = 'customscript_exp_sl_booking';
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
    formName = 'Booking';
    var form = ui.createForm(formName);

    if (PARAMS['step'] == 'EnterBooking') {
        formName = 'Booking - Confirmed';
        form = ui.createForm(formName);

        log.debug('PARAMS', PARAMS);
        log.debug('In Progress | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

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
        form.addField({ id: 'is_confirm', type: 'checkbox', label: 'Is Confirm' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_body_field', type: 'longtext', label: 'Mapping Body Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_item_field', type: 'longtext', label: 'Mapping Sublist Item Field' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'mapping_sublist_containers_details_field', type: 'longtext', label: 'Mapping Sublist Containers Details Field' }).updateDisplayType({ displayType: 'hidden' });

        // ################################################################################################
        // ===== Get Sales Order Information
        // ################################################################################################
        var filterSearch = [];
            filterSearch.push( search.createFilter({ name: 'internalid', join: null, operator: 'anyof', values: PARAMS['rec_id'] }) );
            filterSearch.push( search.createFilter({ name: 'mainline', join: null, operator: 'is', values: 'T' }) );
        var ssResult = getSalesOrderInformation(filterSearch);

        // ################################################################################################
        // ===== Primary Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'primary_information', label: 'Primary Information' };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        if (USE_SUB == true) {
            var fieldFormat = { id: 'custpage_custrecord_bk_subsidiary', type: 'select', label: 'Subsidiary', source: 'subsidiary', container: fieldGroupFormat.id };
                mapping_body_field[fieldFormat.id] = fieldFormat;
            var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
                uiField.isMandatory = true;
                uiField.defaultValue = ssResult[0].getValue('subsidiary');
        }

        var fieldFormat = { id: 'custpage_custrecord_bk_customer', type: 'select', label: 'Customer', source: 'customer', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
            uiField.defaultValue = ssResult[0].getValue('entity');

        var fieldFormat = { id: 'custpage_name', type: 'text', label: 'Booking No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'hidden' });
            uiField.isMandatory = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_bookingdate', type: 'date', label: 'Booking Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
            // uiField.defaultValue = new Date();

        var fieldFormat = { id: 'custpage_custrecord_bk_transaction', type: 'select', label: 'Commercial Invoice No.', source: 'salesorder', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('internalid');

        var fieldFormat = { id: 'custpage_custrecord_bk_netweight', type: 'currency', label: 'Net Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_grossweight', type: 'currency', label: 'Gross Weight', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_bookingstatus', type: 'select', label: 'Booking Status', source: 'customlist_exp_bookingstatus', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = 1;

        var fieldFormat = { id: 'custpage_currency', type: 'select', label: 'Currency', source: 'currency', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.isMandatory = true;
            uiField.defaultValue = ssResult[0].getValue('currency');

        // ################################################################################################
        // ===== Booking Tab
        // ################################################################################################
        var tabFormat = { id: 'custpage_booking_tab', label: 'Booking' };
        form.addTab(tabFormat);

        // ################################################################################################
        // ===== Booking Tab - Booking Information Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'booking_information', label: 'Booking Information', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_refponum', type: 'text', label: 'Ref. PO No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('otherrefnum');

        var fieldFormat = { id: 'custpage_custrecord_bk_refbookingnum', type: 'text', label: 'Ref. Booking No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_attention', type: 'textarea', label: 'Attention', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_descriptionofgoods', type: 'textarea', label: 'Description of Goods', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_freightterm', type: 'select', label: 'Freight Term', source: 'customlist_exp_freightterm', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        // ################################################################################################
        // ===== Booking Tab - Booking Details
        // ################################################################################################
        var fieldGroupFormat = { id: 'booking_details_information', label: 'Booking Details', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_forwardername', type: 'select', label: 'Forwarder Name', source: 'customrecord_exp_frightforwarder', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_forwardertel', type: 'phone', label: 'Forwarder Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_forwardercontract', type: 'text', label: 'Forwarder Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_forwardercontracttel', type: 'phone', label: 'Forwarder Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_feedervesselname', type: 'text', label: 'Feeder Vessel Name', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_feedercontract', type: 'text', label: 'Feeder Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_feedercontracttel', type: 'phone', label: 'Feeder Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_bookingdescription', type: 'text', label: 'Booking Description', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

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

        var fieldFormat = { id: 'custpage_custrecord_bk_shippingagent', type: 'text', label: 'Shipping Agent', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_agentaddress', type: 'text', label: 'Agent Address', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_agenttel', type: 'text', label: 'Agent Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_agentfax', type: 'text', label: 'Agent Fax', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_agentemail', type: 'text', label: 'Agent Email', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vesselname', type: 'text', label: 'Vessel Name', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_voyageno', type: 'text', label: 'Voyage No.', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_placeofreceipt', type: 'select', label: 'Place of Receipt', source: 'customrecord_exp_placeofreceipt', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_placeofloading', type: 'select', label: 'Place of Loading', source: 'customlist_exp_portload', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_portload');

        var fieldFormat = { id: 'custpage_custrecord_bk_countryoforigin', type: 'text', label: 'Country of Origin', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getText('custbody_exp_countryorigin');

        var fieldFormat = { id: 'custpage_custrecord_bk_agentdestination', type: 'text', label: 'Agent at Destination', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_shippingport', type: 'select', label: 'Shipping Port', source: 'customrecord_exp_shippport', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
        var shipmaster_id = ssResult[0].getValue({ name: 'custrecord_exp_shipmasteraddress', join: 'shippingaddress' });
        var recObj = search.lookupFields({ type: 'customrecord_exp_shippingmaster', id: shipmaster_id, columns: ['custrecord_exps_shipport'] });
            uiField.defaultValue = recObj['custrecord_exps_shipport'][0].value;

        var fieldFormat = { id: 'custpage_custrecord_bk_destinationcountry', type: 'text', label: 'Destination Country', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'custrecord_exp_destinationcountry', join: 'shippingaddress' });

        var fieldFormat = { id: 'custpage_custrecord_bk_portofdischarge', type: 'text', label: 'Port of Discharge', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'custrecord_exp_port', join: 'shippingaddress' });

        var fieldFormat = { id: 'custpage_custrecord_bk_placeofdelivery', type: 'text', label: 'Place of Delivery', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_transhipmentport', type: 'text', label: 'Transhipment Port', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_etddate', type: 'date', label: 'ETD Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etddate');

        var fieldFormat = { id: 'custpage_custrecord_bk_etddatetext', type: 'text', label: 'ETD Date (Text)', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etdtext');

        var fieldFormat = { id: 'custpage_custrecord_bk_etadate', type: 'date', label: 'ETA Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_etadate');

        var fieldFormat = { id: 'custpage_custrecord_bk_shippingmarks', type: 'textarea', label: 'Shipping Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('custbody_exp_shippingmarks');

        // ################################################################################################
        // ===== Shipping Tab - Shipping Details Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'shipping_details_information', label: 'Shipping Details', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_shippername', type: 'select', label: 'Shipper Name', source: 'customrecord_thl_combranch_address', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_shipperaddress', type: 'textarea', label: 'Shipper Address', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_shippertel', type: 'phone', label: 'Shipper Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_shipperfax', type: 'phone', label: 'Shipper Fax', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_shipperemail', type: 'text', label: 'Shipper Email', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_consigneename', type: 'select', label: 'Consignee Name', source: 'customer', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue('entity');

        var fieldFormat = { id: 'custpage_custrecord_bk_consigneeaddress', type: 'textarea', label: 'Consignee Address', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'shipaddress', join: 'customer' });

        var fieldFormat = { id: 'custpage_custrecord_bk_consigneetel', type: 'phone', label: 'Consignee Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'phone', join: 'customer' });

        var fieldFormat = { id: 'custpage_custrecord_bk_consigneefax', type: 'phone', label: 'Consignee Fax', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'fax', join: 'customer' });

        var fieldFormat = { id: 'custpage_custrecord_bk_consigneeemail', type: 'text', label: 'Consignee Email', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });
            uiField.defaultValue = ssResult[0].getValue({ name: 'email', join: 'customer' });

        // ################################################################################################
        // ===== Shipping Tab - Notify Party Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'notify_party_information', label: 'Notify Party', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyname1', type: 'select', label: 'Notify Name1', source: 'customrecord_exp_notifyparty', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyaddress1', type: 'textarea', label: 'Notify Address1', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifytel1', type: 'phone', label: 'Notify Tel 1', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyfax1', type: 'phone', label: 'Notify Fax 1', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyemail1', type: 'email', label: 'Notify Email 1', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyeorinumber1', type: 'text', label: 'Notify EORI Number 1', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyname2', type: 'select', label: 'Notify Name2', source: 'customrecord_exp_notifyparty', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyaddress2', type: 'textarea', label: 'Notify Address2', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifytel2', type: 'phone', label: 'Notify Tel 2', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyfax2', type: 'phone', label: 'Notify Fax 2', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyemail2', type: 'email', label: 'Notify Email 2', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyeorinumber2', type: 'text', label: 'Notify EORI Number 2', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyname3', type: 'select', label: 'Notify Name3', source: 'customrecord_exp_notifyparty', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyaddress3', type: 'textarea', label: 'Notify Address3', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifytel3', type: 'phone', label: 'Notify Tel 3', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyfax3', type: 'phone', label: 'Notify Fax 3', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyemail3', type: 'email', label: 'Notify Email 3', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_notifyeorinumber3', type: 'text', label: 'Notify EORI Number 3', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

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

        var fieldFormat = { id: 'custpage_custrecord_bk_cycompanyname', type: 'select', label: 'CY Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_cytel', type: 'phone', label: 'CY Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_cycontract', type: 'text', label: 'CY Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_cycontracttel', type: 'phone', label: 'CY Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_cydate', type: 'date', label: 'CY Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_cypickupplace', type: 'text', label: 'Pick up Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_loadingplace', type: 'text', label: 'Loading Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_loadingdatefrom', type: 'date', label: 'Loading Date From', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_loadingdateto', type: 'date', label: 'Loading Date To', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_loadinginformation', type: 'textarea', label: 'Loading Information', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        // ################################################################################################
        // ===== Container Plan Tab - Return (RE) Group
        // ################################################################################################
        var fieldGroupFormat = { id: 'return_re_information', label: 'Return (RE)', tab: tabFormat.id };
        var fieldGroup = form.addFieldGroup(fieldGroupFormat);
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldFormat = { id: 'custpage_custrecord_bk_returncompanyname', type: 'select', label: 'RTN Company Name', source: 'customrecord_exp_containercompany', container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_returntel', type: 'phone', label: 'RTN Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_returncontract', type: 'text', label: 'RTN Contract', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_returncontracttel', type: 'phone', label: 'RTN Contract Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_paperlesscode', type: 'text', label: 'Paper Less Code', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_returndate', type: 'date', label: 'Return Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_returnplace', type: 'text', label: 'Return Place', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_firstreturn', type: 'text', label: 'First Return', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_closingdate', type: 'date', label: 'Closing Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_closingtime', type: 'timeofday', label: 'Closing Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vgmname', type: 'text', label: 'VGM Name', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vgmtel', type: 'phone', label: 'VGM Tel', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vgmmarks', type: 'textarea', label: 'VGM Marks', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vgmcutdate', type: 'date', label: 'VGM Cut-Off Date', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        var fieldFormat = { id: 'custpage_custrecord_bk_vgmcuttime', type: 'timeofday', label: 'VGM Cut-Off Time', source: null, container: fieldGroupFormat.id };
            mapping_body_field[fieldFormat.id] = fieldFormat;
        var uiField = form.addField(fieldFormat).updateDisplayType({ displayType : 'entry' });

        // ################################################################################################
        // ===== Shipping Tab - EXP Containers Details
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
        // ===== Default Values
        // ################################################################################################
        var defaultValues = {};
        for (var id in PARAMS) {
            defaultValues[id] = PARAMS[id];
        }
        defaultValues['step'] = 'GenerateBooking';
        defaultValues['previous_step'] = PARAMS['step'];
        defaultValues['rec_id'] =  PARAMS['rec_id'];
        defaultValues['params'] = JSON.stringify(PARAMS);
        defaultValues['mapping_body_field'] = JSON.stringify(mapping_body_field);
        defaultValues['mapping_sublist_item_field'] = JSON.stringify(mapping_sublist_item_field);
        defaultValues['mapping_sublist_containers_details_field'] = JSON.stringify(mapping_sublist_containers_details_field);
        form.updateDefaultValues(defaultValues);

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
        form.addButton({ id: 'bt_cancel', label: 'Cancel', functionName: script_function });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'GenerateBooking') {
        // ################################################################################################
        // ===== Validate Data
        // ################################################################################################
        // if (checkInProgressData(PARAMS['order_select'])) {
        //     form = ui.createForm('Warning');
        //     var uiField = form.addField({ id: 'error_msg', type: 'richtext', label: ' ', source: null, container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        //         uiField.defaultValue = '<b style="color:Tomato;">The information has changed. Please try again.</b>';
        //     var script_function = getStartPageFunction(PARAMS['ref_pi_id_select']);
        //     form.addButton({ id: 'bt_back', label: 'Back', functionName: script_function });
        //     context.response.writePage(form);
        //     return;
        // }

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
        // ===== Create Job Record
        // ################################################################################################
        // var job_record_rec = record.create({ type: 'customrecord_exp_splitpi_jobprocess', isDynamic: true });
        //     job_record_rec.setValue('custrecord_spj_script_id', SL_SCRIPT_ID);
        //     job_record_rec.setValue('custrecord_spj_splitdoc', PARAMS['order_select']);
        //     job_record_rec.setValue('custrecord_spj_pisplitnum', PARAMS['split_no_select']);
        //     job_record_rec.setValue('custrecord_spj_refpinum', PARAMS['ref_pi_select']);
        // var job_record_id = job_record_rec.save();


        // ################################################################################################
        // ===== Generate Booking
        // ################################################################################################
        var bk_rec = record.create({
					    type: 'customrecord_exp_booking',
					    isDynamic: true
					});

        // ################################################################################################
        // ===== Set Body Field
        // ################################################################################################
        log.debug('mapping_body_field', mapping_body_field);
        for (var key in mapping_body_field) {
            var id = key.replace('custpage_', '');
            var value = PARAMS[key];
            var type = mapping_body_field[key].type;
            if (!!value && type == 'date') {
                value = format.parse(value, 'date');
            }
            else if (!!value && type == 'percent') {
                value = value.replace('%', '');
            }
            if (!!value) {
                // log.debug('id | value', id + ' | ' + value);
                bk_rec.setValue(id, value);
            }
        }

        // ################################################################################################
        // ===== Set Sublist EXP Containers Details Line
        // ################################################################################################
        log.debug('mapping_sublist_containers_details_field', mapping_sublist_containers_details_field);
        var subListId = 'custpage_containers_details_list';
        var subListNSId = 'recmachcustrecord_exp_bookingcontainers';
        var line_count = REQUEST.getLineCount(subListId);
        for (var i = 0; i < line_count; i++) {
            bk_rec.selectNewLine(subListNSId);
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
                bk_rec.setCurrentSublistValue(subListNSId, id, value);
            }
            bk_rec.commitLine(subListNSId);
        }

        // ################################################################################################
        // ===== Save Record
        // ################################################################################################
        var bk_id = bk_rec.save();

        // ################################################################################################
        // ===== Update Job Record
        // ################################################################################################
        // var data = {};
        //     data['custrecord_spj_processcompleted'] = true;
        // record.submitFields({ type: 'customrecord_exp_splitpi_jobprocess', id: job_record_id, values: data });

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'customrecord_exp_booking', id: bk_id });

    }
    else if (PARAMS['step'] == 'InProgressCancelBooking') {
        // ################################################################################################
        // ===== Cancel Proforma Booking
        // ################################################################################################
        var data = {};
            data['custrecord_bk_bookingstatus'] = 2; // Cancelled
        record.submitFields({ type: 'customrecord_exp_booking', id: PARAMS['rec_id'], values: data });

        // ################################################################################################
        // ===== Redirect Record
        // ################################################################################################
        redirect.toRecord({ type: 'customrecord_exp_booking', id: PARAMS['rec_id'] });
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
        columnSearch.push(search.createColumn({ name: 'custbody_exp_shippingmarks', summary: null }));
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
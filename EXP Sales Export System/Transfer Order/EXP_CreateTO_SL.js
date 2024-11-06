/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
var config, file, https, log, record, redirect, render, runtime, search, ui, url, xml , libCode;
var CS_SCRIPTID_path = './EXP_CreateTO_CS.js';
define(['N/config', 'N/file', 'N/https', 'N/log', 'N/record', 'N/redirect', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/xml', '../lib/Libraries Code 2.0.220622'],
    /**
     * @param{} config
     * @param{} currentRecord
     * @param{} https
     * @param{} log
     * @param{} record
     * @param{} render
     * @param{} runtime
     * @param{} search
     * @param{} serverWidget
     * @param{} url
     * @param{} xml
     */
    (_config, _file, _https, _log, _record, _redirect, _render, _runtime, _search, _ui, _url, _xml , _libCode) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        config = _config;
        file = _file;
        https = _https;
        log = _log;
        record = _record;
        redirect = _redirect;
        render = _render;
        runtime = _runtime;
        search = _search;
        ui = _ui;
        url = _url;
        xml = _xml;
        libCode = _libCode;

        const onRequest = (scriptContext) => {
            const response = scriptContext.response;
            const request = scriptContext.request;
            const params = request.parameters;
            log.debug(  'params' ,  params);
            const recid = params['recid'];
            const rectype = params['rectype'];

            var loadedRecord = record.load({
                type: rectype ,
                id:  recid,
            });

            var form = ui.createForm({ title: 'Create Transfer Order from Commercial Invoice' ,  });
            // hideNavBar : true,
            form.clientScriptModulePath = CS_SCRIPTID_path;
            var filtergroup = form.addFieldGroup({
                id : 'filter',
                label : 'Filter'
            });
            var dateField = form.addField({
                id: 'asofdate',
                type: 'date',
                label: 'Date',
                container: 'filter'
            }).updateBreakType({ breakType: ui.FieldBreakType.STARTCOL });
            dateField.defaultValue = format.parse({ value: new Date() , type: format.Type.DATE, timezone: format.Timezone.ASIA_BANGKOK });
            dateField.updateDisplaySize({ height: 60, width: 100 });
            dateField.isMandatory = true;

            var fromlocationField = form.addField({
                id: 'fromlocation',
                type : 'select',
                label: 'From Location',
                container: 'filter'
            })

            var projectField = form.addField({
                id: 'refci',
                type:  'url',
                label: 'Ref. Commercial Invoice' ,
                container: 'filter'
            }).updateBreakType({ breakType: ui.FieldBreakType.STARTCOL });
            projectField.updateDisplayType( { displayType : 'inline'})
            try{
                var text = 'no record data';
                if(!!loadedRecord){
                    text = loadedRecord.getValue('tranid');
                }
                var url = '/app/accounting/transactions/salesord.nl?id=' + recid;
                projectField.defaultValue = url;
                projectField.linkText = text;
            }catch (e){
                log.debug(  '' , 'No rec ID or Type' )
            }

            var tolocationField = form.addField({
                id: 'tolocation',
                type : 'select',
                label: 'TO Location',
                container: 'filter'
            })

            var To_Location = loadedRecord.getValue('location');

            var Column = [search.createColumn({ name : 'name'}) , search.createColumn({ name : 'custrecord_exp_available_to'}) ]
            var ss_location = libCode.loadSavedSearch('location' , null , [] , Column);
            var From_Location_Obj = [];
            var To_Location_Obj = [];

            if(!!ss_location && ss_location.length > 0){
                ss_location.forEach( (v , i) => {
                    item = { id : v.id , name : v.getValue('name') };
                    To_Location_Obj.push(item);
                    if(v.getValue('custrecord_exp_available_to')){
                        From_Location_Obj.push(item);
                    }
                })
            }

            From_Location_Obj.forEach( (v, i) => {
                fromlocationField.addSelectOption({value : v.id, text : v.name})
            })
            To_Location_Obj.forEach( (v, i) => {
                tolocationField.addSelectOption({value : v.id, text : v.name})
                if(v.id == To_Location){
                    tolocationField.defaultValue = v.id;
                }
            });

            var filtergroup = form.addFieldGroup({
                id : 'loadingplan',
                label : 'Loading Plan'
            });

            let item_sublist = form.addSublist({
                id: 'item_sublist',
                type: ui.SublistType.LIST,
                label: 'Item'
            });
            item_sublist.addField({ id: 'fromlocation', type: 'text', label: 'From Location' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            item_sublist.addField({ id: 'itemid', type: 'text', label: 'Item' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            item_sublist.addField({ id: 'itemname', type: 'text', label: 'Item Description' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            item_sublist.addField({ id: 'tolocation', type: 'text', label: 'TO Location' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            item_sublist.addField({ id: 'quantity', type: 'text', label: 'Quantity' }).updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });
            item_sublist.addField({ id: 'unit', type: 'text', label: 'Unit' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
            item_sublist.addField({ id: 'containers', type: 'text', label: 'Containers Number' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });


            var ss_loadinplan = libCode.loadSavedSearch(null , 'customsearch_exp_loadingplan' , [search.createFilter({ name : 'custrecord_lp_transaction' , join : null , operator : 'anyof' , values : recid})]);
            var line = 0;
            var sscol = {};
            if(!!ss_loadinplan && ss_loadinplan.length > 0){
                var column = ss_loadinplan[0].columns;
                column.forEach(function (value, index) {
                    sscol[value.label] = value;
                })

                ss_loadinplan.forEach( (v,i) => {
                    item_sublist.setSublistValue({ id: 'itemid', line: line, value: v.getValue(sscol['itemid']) });
                    item_sublist.setSublistValue({ id: 'itemname', line: line, value: v.getValue(sscol['itemname']) });
                    item_sublist.setSublistValue({ id: 'tolocation', line: line, value: v.getValue(sscol['tolocation']) });
                    item_sublist.setSublistValue({ id: 'quantity', line: line, value: v.getValue(sscol['quantity']) });
                    item_sublist.setSublistValue({ id: 'unit', line: line, value: v.getValue(sscol['unit']) });
                    item_sublist.setSublistValue({ id: 'containers', line: line, value: v.getValue(sscol['containers']) });
                    line++;
                })
            }


            // var refciField = form.addField({
            //     id: 'refci',
            //     type : 'text',
            //     label: 'Ref. Commercial Invoice',
            //     container: 'filter'
            // });

            var stepField = form.addField({
                id: 'stepfield',
                type: 'text',
                label: 'step' ,
                container: 'filter'
            });
            stepField.defaultValue = 'T';
            stepField.updateDisplayType({ displayType : 'hidden'})

            form.addSubmitButton({
                label: 'Submit'
            });

            var url = '/app/accounting/transactions/salesord.nl?id=' + recid;
            var backbtn = form.addButton({
                id: 'back_btn',
                label: 'Back',
                functionName: 'backtoTrans("'+ recid +'")' ,
            });

            response.writePage(form);
        }



        return {onRequest}

    });

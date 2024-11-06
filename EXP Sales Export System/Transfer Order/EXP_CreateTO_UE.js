/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
var config, currentRecord, file, log, record, redirect, render, runtime , url , libCode;

define(['N/config', 'N/currentRecord', 'N/file', 'N/log', 'N/record', 'N/redirect', 'N/render', 'N/runtime' , 'N/url' , 'N/query', '../lib/Libraries Code 2.0.220622.js'],
    /**
     * @param{config} config
     * @param{currentRecord} currentRecord
     * @param{file} file
     * @param{log} log
     * @param{record} record
     * @param{redirect} redirect
     * @param{render} render
     * @param{runtime} runtime
     */
    (_config, _currentRecord, _file, _log, _record, _redirect, _render, _runtime , _url , _query ,  _libCode) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        config = _config;
        currentRecord = _currentRecord;
        file = _file;
        log = _log;
        record = _record;
        redirect = _redirect;
        render = _render;
        runtime = _runtime;
        url = _url;
        query = _query;
        libCode = _libCode;

        const beforeLoad = (scriptContext) => {
            var event = scriptContext.type
            var newRecord = scriptContext.newRecord;
            var form = scriptContext.form;
            var recid = newRecord.id;
            var rectype = newRecord.type;
            //###################################### ปุ่มสร้าง Transfer Order #############################################
            //###################################### ปุ่มสร้าง Transfer Order #############################################
            //###################################### ปุ่มสร้าง Transfer Order #############################################
            try {
                if (event == 'view') {
                    var createpo_url = url.resolveScript({scriptId: "customscript_exp_createto_sl", deploymentId: 1, params: {rectype: newRecord.id, recid: newRecord.type}});
                    var script = " a = ''; var url = '" + createpo_url + "'; window.open(url);";
                    var print_button_pr = form.addButton({
                        id: 'custpage_createpo_button',
                        label: 'Create Transfer Order',
                        functionName: script
                    });
                }

            } catch (e) {

                log.error({
                    title: 'ERROR',
                    details: 'Error On beforeLoad Project Plan Cost Button Function ' + event + ' Stage : ' + e
                });

            }
            //###########################################################################################################
            //###########################################################################################################
            //###########################################################################################################


        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        const beforeSubmit = (scriptContext) => {
            var event = scriptContext.type;

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });

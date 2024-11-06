/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
var config, file, https, log, record, redirect, render, runtime, search, ui, url, xml , libCode;
const CS_SCRIPTID_path = '../ClientScript/ACM_CostRecJV_CS.js'
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

            var form = ui.createForm({ title: 'Create Transfer Order from Commercial Invoice' ,  });
            // hideNavBar : true,
            // form.clientScriptModulePath = CS_SCRIPTID_path;

            var stepField = form.addField({
                id: 'stepfield',
                type: 'text',
                label: 'step' ,
            });
            stepField.defaultValue = 'T';
            stepField.updateDisplayType({ displayType : 'hidden'})

            response.writePage(form);
        }



        return {onRequest}

    });

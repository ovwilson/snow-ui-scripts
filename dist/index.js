var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var options = {
    tableSysId: 'a01b1d83dba30010629a5385ca961957',
    uri: '/api/now/attachment',
    query: 'sysparm_query=table_sys_idSTARTSWITH',
    fileUri: '{{sys_id}}/file',
    limit: 'sysparm_limit=10',
    files: [
        { name: 'runtime-es5.js', type: 'js', defer: true, module: false },
        { name: 'runtime-es2015.js', type: 'js', defer: false, module: true },
        { name: 'polyfills-es5.js', type: 'js', defer: true, module: false },
        { name: 'polyfills-es2015.js', type: 'js', defer: false, module: true },
        { name: 'main-es5.js', type: 'js', defer: true, module: false },
        { name: 'main-es2015.js', type: 'js', defer: false, module: true },
        { name: 'styles.css', type: 'css' }
    ]
};
var SNOW = /** @class */ (function () {
    function SNOW(options) {
        var _this = this;
        this.token = function () { return window.g_ck || ''; };
        this.options = options;
        this.request(this.getMetaDataUri(), this.token())
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.setSysIds(xhr); })
            .then(function (transformedFiles) { return _this.getContent(transformedFiles); })["catch"](function (xhr) { return _this.onError(xhr); });
    }
    SNOW.prototype.getMetaDataUri = function () { return this.options.uri + "?" + this.options.query + this.options.tableSysId + "&" + this.options.limit; };
    SNOW.prototype.setContentUri = function (file) { return this.options.uri + "/" + this.options.fileUri.replace('{{sys_id}}', file.sys_id); };
    SNOW.prototype.setSysIds = function (xhr) {
        var data = JSON.parse(xhr.response).result;
        return this.transformFiles(this.options.files, data);
    };
    SNOW.prototype.getContent = function (files) {
        var _this = this;
        files.map(function (file) { return _this.request(_this.setContentUri(file), _this.token())
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.findContentType(xhr, file); })["catch"](function (xhr) { return _this.onError(xhr); }); });
    };
    SNOW.prototype.findContentType = function (xhr, file) {
        switch (file.type) {
            case 'js':
                this.setScriptTag(xhr, file);
                break;
            case 'css':
                this.setStyleTag(xhr);
                break;
            default: break;
        }
    };
    SNOW.prototype.setScriptTag = function (xhr, file) {
        var body, newScript, inlineScript;
        body = document.getElementsByTagName('body')[0];
        newScript = document.createElement("script");
        if (file.defer) {
            newScript.defer = true;
            newScript.setAttribute('nomodule', 'true');
        }
        if (file.module) {
            newScript.setAttribute("type", "module");
        }
        inlineScript = document.createTextNode(xhr.responseText);
        newScript.appendChild(inlineScript);
        body.appendChild(newScript);
    };
    SNOW.prototype.setStyleTag = function (xhr) {
        /* Create style document */
        var css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode(xhr.responseText));
        /* Append style to the tag name */
        document.getElementsByTagName('head')[0].appendChild(css);
    };
    SNOW.prototype.transformFiles = function (files, data) {
        var _this = this;
        return files.map(function (file) { return _this.filterByFileName(file, data); });
    };
    SNOW.prototype.filterByFileName = function (file, data) {
        var filteredFile = data.filter(function (d) { return d.file_name === file.name; })[0];
        return (__assign(__assign({}, file), { sys_id: filteredFile.sys_id }));
    };
    SNOW.prototype.request = function (url, token) {
        var xhr = new XMLHttpRequest();
        return new Promise(function (resolve, reject) {
            xhr.open('get', url);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-UserToken', token);
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4)
                    return;
                xhr.status === 200 ? resolve(xhr) : reject(xhr);
            };
            xhr.send();
        });
    };
    SNOW.prototype.onSuccess = function (xhr) { console.info(xhr.status + " - " + xhr.statusText); };
    SNOW.prototype.onError = function (xhr) { console.error("Error: " + xhr.status + " - " + xhr.statusText, JSON.parse(xhr.responseText)); };
    return SNOW;
}());
new SNOW(options);

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
var Resources = /** @class */ (function () {
    function Resources() {
        var _this = this;
        this.token = function () { return window.g_ck || ''; };
        this.cs = document.currentScript;
        this.uri = this.cs.getAttribute('data-uri');
        this.scope = this.cs.getAttribute('data-scope');
        this.category = this.cs.getAttribute('data-category');
        this.env = this.cs.getAttribute('data-env');
        this.properties_table = this.cs.getAttribute('data-table-props');
        this.resources_table = this.cs.getAttribute('data-table-resources');
        this.query = "sysparm_query=scope=" + this.scope + "^environment=" + this.env + "^category=" + this.category;
        this.properties_limit = "sysparm_limit=1";
        this.request(this.getUri('properties', null), this.token())
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.setOptions(xhr); })
            .then(function () { return _this.request(_this.getUri('resources', null), _this.token()); })
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.setResources(xhr); })
            .then(function () { return _this.request(_this.getUri('scripted_rest_api', null), _this.token()); })
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.setSysIds(xhr); })
            .then(function (transformedFiles) { return _this.getContent(transformedFiles); })["catch"](function (xhr) { return _this.onError(xhr); });
    }
    Resources.prototype.getUri = function (name, file) {
        switch (name) {
            case 'properties':
                return this.uri + "/" + this.scope + "_" + this.properties_table + "?" + this.query + "&" + this.properties_limit;
                break;
            case 'resources':
                return this.uri + "/" + this.scope + "_" + this.resources_table + "?" + this.query;
                break;
            case 'scripted_rest_api':
                return this.options.uri + "?" + this.options.query + this.options.tableSysId + "&sysparm_limit=" + this.options.limit;
                break;
            case 'file':
                return this.options.uri + "/" + this.options.fileUri.replace('{{sys_id}}', file.sys_id);
                break;
            default:
                return null;
                break;
        }
    };
    Resources.prototype.setOptions = function (xhr) {
        var data = JSON.parse(xhr.response).result[0];
        this.options = ({
            tableSysId: data.ssr_sys_id,
            uri: data.ssr_uri,
            fileUri: data.ssr_file_uri,
            query: data.ssr_query,
            limit: data.ssr_limit,
            resource_table: data.resource_table,
            resources: []
        });
    };
    Resources.prototype.setResources = function (xhr) {
        var data = JSON.parse(xhr.response).result;
        this.options = (__assign(__assign({}, this.options), { resources: data }));
    };
    Resources.prototype.setSysIds = function (xhr) {
        var data = JSON.parse(xhr.response).result;
        return this.transformFiles(this.options.resources, data);
    };
    Resources.prototype.getContent = function (files) {
        var _this = this;
        files.map(function (file) { return _this.request(_this.getUri('file', file), _this.token())
            .then(function (xhr) { _this.onSuccess(xhr); return xhr; })
            .then(function (xhr) { return _this.findContentType(xhr, file); })["catch"](function (xhr) { return _this.onError(xhr); }); });
    };
    Resources.prototype.findContentType = function (xhr, file) {
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
    Resources.prototype.setScriptTag = function (xhr, file) {
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
    Resources.prototype.setStyleTag = function (xhr) {
        /* Create style document */
        var css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode(xhr.responseText));
        /* Append style to the tag name */
        document.getElementsByTagName('head')[0].appendChild(css);
    };
    Resources.prototype.transformFiles = function (files, data) {
        var _this = this;
        return files.map(function (file) { return _this.filterByFileName(file, data); });
    };
    Resources.prototype.filterByFileName = function (file, data) {
        var filteredFile = data.filter(function (d) { return d.file_name === file.name; })[0];
        return (__assign(__assign({}, file), { sys_id: filteredFile.sys_id }));
    };
    Resources.prototype.request = function (url, token) {
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
    Resources.prototype.onSuccess = function (xhr) { console.info(xhr.status + " - " + xhr.statusText); };
    Resources.prototype.onError = function (xhr) { console.error("Error: " + xhr.status + " - " + xhr.statusText, JSON.parse(xhr.responseText)); };
    return Resources;
}());
new Resources();

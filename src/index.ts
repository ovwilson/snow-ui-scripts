interface FileSchema {
    name: string;
    defer: boolean;
    module: boolean;
    sys_id?: string;
}

interface FileMetaData {
    size_bytes: string;
    file_name: string;
    table_name: string;
    sys_id: string;
    table_sys_id: string;
    content_type: string;
}

interface SNOWOptions {
    tableSysId: string;
    uri: string;
    query: string;
    fileUri: string;
    limit: string;
    files: FileSchema[];
}

const options: SNOWOptions = {
    tableSysId: 'a01b1d83dba30010629a5385ca961957',
    uri: '/api/now/attachment',
    query: 'sysparm_query=table_sys_idSTARTSWITH',
    fileUri: '{{sys_id}}/file',
    limit: 'sysparm_limit=10',
    files: [
        { name: 'runtime-es5.js%20', defer: true, module: false },
        { name: 'runtime-es2015.js%20', defer: false, module: true },
        { name: 'polyfills-es5.js%20', defer: true, module: false },
        { name: 'polyfills-es2015.js%20', defer: false, module: true },
        { name: 'main-es5.js%20', defer: true, module: false },
        { name: 'main-es2015.js%20', defer: false, module: true }
    ]
}

class SNOW {

    private token = () => (window as any).g_ck || '';
    private options: SNOWOptions;

    constructor(options: SNOWOptions) {

        this.options = options;

        this.request(this.getMetaDataUri(), this.token())
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.setSysIds(xhr))
            .then((transformedFiles: FileSchema[]) => this.getContent(transformedFiles))
            .catch((xhr: XMLHttpRequest) => this.onError(xhr));
    }

    getMetaDataUri(): string { return `${this.options.uri}?${this.options.query}${this.options.tableSysId}&${this.options.limit}`; }

    setContentUri(file: FileSchema): string { return `${this.options.uri}/${this.options.fileUri.replace('{{sys_id}}', file.sys_id)}`; }

    setSysIds(xhr: XMLHttpRequest): FileSchema[] {
        let data: FileMetaData[] = JSON.parse(xhr.response).result;
        return this.transformFiles(this.options.files, data);
    }

    getContent(files: FileSchema[]): void {
        files.map(file => this.request(this.setContentUri(file), this.token())
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.setScriptTag(xhr, file))
            .catch((xhr: XMLHttpRequest) => this.onError(xhr))
        )
    }

    setScriptTag(xhr: XMLHttpRequest, file: FileSchema): void {
        let body, newScript, inlineScript;
        body = document.getElementsByTagName('body')[0];
        newScript = document.createElement("script");
        if (file.defer) { newScript.defer = true; newScript.setAttribute('nomodule', 'true'); }
        if (file.module) { newScript.setAttribute("type", "module"); }
        inlineScript = document.createTextNode(xhr.responseText);
        newScript.appendChild(inlineScript);
        body.appendChild(newScript);
    }

    transformFiles(files: FileSchema[], data: FileMetaData[]): FileSchema[] { return files.map(file => this.filterByFileName(file, data)); }

    filterByFileName(file: any, data: FileMetaData[]) {
        let filteredFile = data.filter(d => d.file_name + '%20' === file.name)[0];
        return ({ ...file, sys_id: filteredFile.sys_id });
    }

    request(url: string, token: string): Promise<any> {
        let xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise(function (resolve, reject) {
            xhr.open('get', url);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-UserToken', token);
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                xhr.status === 200 ? resolve(xhr) : reject(xhr);
            }
            xhr.send();
        });
    }

    onSuccess(xhr: XMLHttpRequest): void { console.info(`${xhr.status} - ${xhr.statusText}`); }

    onError(xhr: XMLHttpRequest): void { console.error(`Error: ${xhr.status} - ${xhr.statusText}`, JSON.parse(xhr.responseText)); }
}

new SNOW(options);
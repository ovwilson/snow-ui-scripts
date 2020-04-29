import { SNOWOptions, FileSchema, FileMetaData } from './models';

export class SNOW {

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
